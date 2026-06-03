import { createClient } from "@supabase/supabase-js";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SHARED_SECRET = Deno.env.get("SHARED_SECRET");
const APP_URL = Deno.env.get("APP_URL") || "https://ultimate-stem.vercel.app";

// 1. Explicitly type the expected database join structure
interface UserProfile {
  user_email: string;
}

interface EoiRecord {
  user: UserProfile | null;
}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

// 2. Use Deno's native global server wrapper directly (No remote import required)
Deno.serve(async (req) => {
  if (
    !RESEND_API_KEY ||
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY ||
    !SHARED_SECRET
  ) {
    return new Response(
      JSON.stringify({
        error:
          "Server misconfiguration: missing required environment variables (RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SHARED_SECRET).",
      }),
      { status: 500 },
    );
  }

  const requestSecret = req.headers.get("X-Notification-Secret");
  if (requestSecret !== SHARED_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const { tournament_id, tournament_title } = await req.json();
    const normalizedTournamentTitle = typeof tournament_title === "string"
      ? tournament_title
      : "";
    const safeTournamentTitleForSubject = normalizedTournamentTitle.replace(
      /[\r\n]+/g,
      " ",
    ).trim() || "Tournament";
    const safeTournamentTitleForHtml = escapeHtml(normalizedTournamentTitle);

    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false },
      },
    );

    const { data, error: dbError } = await supabaseAdmin
      .from("expression_of_interest")
      .select(`
        user:user_id (
          user_email
        )
      `)
      .eq("tournament_id", tournament_id)
      .eq("eot_status", "interested");

    if (dbError) throw dbError;

    // Cast the data response to our explicit interface to clear the 'any' warning
    const eoiRecords = data as unknown as EoiRecord[];

    if (!eoiRecords || eoiRecords.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expressions of interest registered." }),
        { status: 200 },
      );
    }

    const emailList = eoiRecords
      .map((record) => record.user?.user_email)
      .filter((email): email is string => typeof email === "string");

    if (emailList.length === 0) {
      return new Response(
        JSON.stringify({ message: "No valid subscriber emails found." }),
        { status: 200 },
      );
    }

    const batchSize = 100;
    const chunks = [];
    for (let i = 0; i < emailList.length; i += batchSize) {
      chunks.push(emailList.slice(i, i + batchSize));
    }

    for (const chunk of chunks) {
      const emailPayload = chunk.map((email) => ({
        from:
          "Ultimate STEM Notifications <notifications@auth.ultimate-stem.com>",
        to: [email],
        subject: `🚀 ${safeTournamentTitleForSubject} has officially begun!`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #182033;">
            <h2>The gates are open!</h2>
            <p>You registered your interest for <strong>${safeTournamentTitleForHtml}</strong>.</p>
            <p>The tournament is now live. Head over to your dashboard to view the rules and secure your placement slot!</p>
            <br />
            <a href="${APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg,#8b5cf6 0%,#6d3ef0 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Enter Tournament</a>
          </div>
        `,
      }));

      const resendResponse = await fetch(
        "https://api.resend.com/emails/batch",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify(emailPayload),
        },
      );

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        console.error(`Resend batch delivery failure log: ${errorText}`);
        throw new Error(
          `Resend batch delivery failed with status ${resendResponse.status}: ${errorText}`,
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, dispatchedCount: emailList.length }),
      { status: 200 },
    );
  } catch (err) {
    // 3. Securely evaluate the catch error variable type to please deno-ts
    const errorMessage = err instanceof Error
      ? err.message
      : "An unknown execution error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
});
