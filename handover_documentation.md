# Ultimate STEM — Complete Handover Documentation & User Manual

Hi Christopher, Welcome to the **Ultimate STEM** project handover guide and user manual. This document is designed to guide you through the process of transferring, deploying, and maintaining the web application.

---

## 1. Project Architecture Overview

The Ultimate STEM platform is built using a modern, scalable web stack:
* **Frontend/Backend Server:** Next.js (version 16) deployed on **Vercel**.
* **Database & Auth:** **Supabase** (PostgreSQL database, Row-Level Security (RLS) policies, and user authentication).
* **Emails:** **Resend** (for dispatching batch emails to users when tournaments begin).
* **Domain & DNS Management:** **Cloudflare** (handles custom domain routing and SSL/TLS protection).
* **Storage:** **Supabase Storage** (stores book covers in a public `book-covers` bucket).

---

## 2. Infrastructure Setup & Migration

As a new owner, you will need to establish accounts with the primary service providers (GitHub, Supabase, Resend, Vercel, and Cloudflare) and transfer the project configuration.

### A. Repository Migration (GitHub)
The repository is currently hosted in Danny's public personal repository. You should migrate this to your own GitHub account or organisation:

1. **Option A: Transfer Ownership** (Danny transfers it directly):
   - In the GitHub repository settings, Danny will have to scroll to the bottom of the **General** tab to the **Danger Zone**.
   - He can then click **Transfer ownership**, enter your GitHub username or organisation name, and follow the prompts.
2. **Option B: Duplicate Repository** (If you want a fresh start, might be easier):
   - Create a new, blank repository on your GitHub account (e.g., `ultimate-stem`).
   - Clone the current repository to your local machine:
     ```bash
     git clone --bare https://github.com/DannyVEN05/Ultimate-STEM.git
     cd Ultimate-STEM.git
     ```
   - Push it to your new repository:
     ```bash
     git push --mirror https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
     cd ..
     rm -rf Ultimate-STEM.git
     ```
  - This will make a copy of the original repo, meaning there will now be 2 copies of the repository - one under Danny's account and one under yours.

---

### B. Database & Backend Migration (Supabase)
If you want to transfer the existing database, including already registered users, test data, and files, Danny can transfer ownership of the Supabase Organisation containing the project:
1. In the Supabase Dashboard, Danny can go to **Project Settings** (bottom-left gear icon) -> **Project Access**.
2. Click **Manage Members** and invite you via email, selecting the **Owner** role.
3. Once you accept the invitation and log in, you can go to the same settings page and change Danny to Administrator, or remove the existing team if you wish.
4. The project, database, user authentication logs, and files are now fully owned by you.

**NOTE: The other way would be to restart the database from scratch, this is way too hard and we will not do it this way.**

---

### C. Part A - Email Delivery Setup (Resend)
Resend is used to send transactional and bulk emails. Because the project is on the free tier, it does not support multiple team members or direct domain transfers between accounts. 

There are two ways to handle the transfer:

*   **Option A: Transfer the entire Resend Account (Easiest if created via email/password):**
    1. Danny can go to **Settings** -> **Profile** in the Resend dashboard.
    2. He can change the email address to your email. You will receive a confirmation link, set your password, and take over the account.

*   **Option B: Link domain to a new Resend Account:**
    1. Sign up for a free account at [Resend.com](https://resend.com).
    2. In the Resend Dashboard, go to **Domains** -> **Add Domain**.
    3. Enter the sending domain (e.g., `auth.ultimate-stem.com`).
    4. Resend will generate a new set of DNS records (DKIM, SPF, TXT/MX).
    5. Log into your **Cloudflare dashboard** and update the DNS records with the new values.
    6. Generate a new **API Key** in Resend under **API Keys** -> **Create API Key** and update the `RESEND_API_KEY` environment variable in the Supabase project under **Edge Functions** -> **Secrets**.

#### C. Part B - Subdomain Configuration (Apex vs Subdomains)
Currently, the system uses the `auth.ultimate-stem.com` subdomain for Supabase authentication emails (confirm signup, reset password, etc.) and is configured to send tournament notifications from `notifications@auth.ultimate-stem.com`. However, the support email on the dashboard is `info@contact.ultimate-stem.com`, which requires the `contact.` subdomain.

Because Resend's free tier only allows **one** verified domain, you have two options to use both subdomains:

*   **Option A: Verify the Apex Domain `ultimate-stem.com` (Recommended & Free):**
    If you verify the root domain (`ultimate-stem.com`) in Resend, you remain on the **free tier** (since it is only one domain), but you are permitted to send emails from **any subdomain** under it. This allows you to send from `noreply@auth.ultimate-stem.com` and `notifications@contact.ultimate-stem.com` simultaneously.
*   **Option B: Upgrade Resend Account (Paid Tier):**
    If you prefer not to verify the apex domain and wish to keep subdomains separate, you can upgrade Resend to a paid plan (starting at $4/month) which allows you to verify multiple domains.

##### Setup Steps for Option A (Apex Domain):
1. **Verify the Apex Domain in Resend:**
   - In Resend, go to **Domains** -> **Add Domain**.
   - Delete the old `auth.ultimate-stem.com` domain from Resend (if you are on the free tier).
   - Enter your root domain: `ultimate-stem.com`.
   - Copy the generated DKIM/SPF DNS records and add them to your **Cloudflare DNS** settings.
2. **Set up a Free Inbox for `info@contact.ultimate-stem.com` in Cloudflare:**
   - Go to your Cloudflare dashboard -> **Email** -> **Email Routing**.
   - Enable Email Routing and create a custom address: `info@contact.ultimate-stem.com`.
   - Set the destination to forward to your personal or business email (e.g., `yourname@gmail.com`). This gives you a working support inbox for free without paying for email hosting.
3. **Update the Edge Function Sender Address:**
   - Open [supabase/functions/send-tournament-notifications/index.ts](file:///Users/dannyvenizelou/Documents/SDS%20Ultimate%20STEM%20Project/ultimate-stem/supabase/functions/send-tournament-notifications/index.ts) in your code editor.
   - On line 110, change the `from` email field to use the `contact` subdomain:
     `notifications@auth.ultimate-stem.com` ➔ `notifications@contact.ultimate-stem.com`
   - Redeploy the function using the Supabase CLI:
     ```bash
     supabase functions deploy send-tournament-notifications
     ```

##### Setup Steps for Option B (Paid Tier / Separate Subdomains):
1. **Verify the New Subdomain in Resend:**
   - Keep your existing `auth.ultimate-stem.com` domain verified in Resend.
   - Go to **Domains** -> **Add Domain** and enter: `contact.ultimate-stem.com`.
   - Copy the generated DKIM/SPF DNS records and add them to your **Cloudflare DNS** settings.
2. **Set up a Free Inbox for `info@contact.ultimate-stem.com` in Cloudflare:**
   - Go to your Cloudflare dashboard -> **Email** -> **Email Routing**.
   - Enable Email Routing and create a custom address: `info@contact.ultimate-stem.com`.
   - Set the destination to forward to your personal or business email (e.g., `yourname@gmail.com`).
3. **Update the Edge Function Sender Address:**
   - Open [supabase/functions/send-tournament-notifications/index.ts](file:///Users/dannyvenizelou/Documents/SDS%20Ultimate%20STEM%20Project/ultimate-stem/supabase/functions/send-tournament-notifications/index.ts) in your code editor.
   - On line 110, change the `from` email field to use the `contact` subdomain:
     `notifications@auth.ultimate-stem.com` ➔ `notifications@contact.ultimate-stem.com`
   - Redeploy the function using the Supabase CLI:
     ```bash
     supabase functions deploy send-tournament-notifications
     ```

---

### D. Frontend Deployment Setup (Vercel)
Vercel hosts the Next.js frontend code and deploys it automatically. You can transfer the active Vercel project directly to you so all env variables and deployment histories are kept intact:

1. Sign up for a **Vercel account** (preferably using your GitHub account).
2. In Danny's Vercel Dashboard, he will open the project -> go to **Settings** -> scroll down to the bottom of the **General** tab to the **Transfer Project** section.
3. Danny will click **Transfer**, enter your Vercel username or email address, and send the request.
4. Once you accept, the project is active on your Vercel dashboard.
5. **Connecting Git:** In your Vercel Dashboard, navigate to the transferred project -> **Settings** -> **Git**. If you created a new repository, disconnect the old repository hook and connect your newly cloned repository to enable automatic CD (continuous deployment) on git push.
6. **Configuring Custom Domain:** Go to the **Domains** section in your Vercel project dashboard, and add your custom domain `ultimate-stem.com` (and optionally `www.ultimate-stem.com`, setting it to redirect to the apex domain). This will replace the current `ultimate-stem.vercel.app` domain. Ensure that you update any redirect URLS from earlier. Vercel will show the target A and CNAME records to use in Cloudflare.


---

### E. Domain and DNS Configuration (Cloudflare)
Since you already own the domain on Cloudflare, you must configure it to point to your new Resend and Vercel services:

1. **Vercel DNS Routing:**
   - In Cloudflare, go to the **DNS** settings for your domain.
   - Add an **A Record** for the apex domain `@` pointing to `76.76.21.21`.
   - Add a **CNAME Record** for `www` pointing to `cname.vercel-dns.com`.
2. **Resend Email Authentication:**
   - Add the TXT, MX, and CNAME records provided by Resend to verify your sending domain (e.g. `auth.ultimate-stem.com`). This ensures high email deliverability.
3. **CRITICAL SSL/TLS Mode Settings:**
   > [!WARNING]
   > Cloudflare's default SSL mode is often set to **Flexible**. Under Flexible mode, Cloudflare requests pages from Vercel using unencrypted HTTP port 80. This causes Next.js and Supabase server components to initiate an infinite redirect loop (HTTP to HTTPS loop), making the app inaccessible.
   > 
   > **Action Required:** Go to the **SSL/TLS** tab in your Cloudflare dashboard and change the SSL/TLS encryption mode to **Full** or **Full (strict)**.

---

## 3. Local Development Setup

To run and edit the project locally on your machine:

1. Clone your GitHub repository to your computer.
2. Open the directory in your code editor (e.g., VS Code).
3. Install the project dependencies:
   ```bash
   npm install
   ```
4. Create a `.env.local` file in the root of the project and define your local environment keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-supabase-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-here>
   ```
5. Spin up the development server:
   ```bash
   npm run dev
   ```
6. Open your browser and navigate to [http://localhost:4000](http://localhost:4000) to see the application running.

---

## 4. User Manual & Administration Guide

This section explains how to manage user roles, run tournament progressions, and administer the platform.

### A. Assigning the Admin Role
The platform uses the `user_role` field in the database to restrict access to administrative functions. 

Because admin registration is restricted for security reasons, you should claim the existing pre-seeded admin account to gain access to the dashboard:
1. Go to the website login page, and sign into the current administrator account:
   - **Email:** `admin@gmail.com`
   - **Password:** `12345678`
2. Go to your **Profile** page and change the email address in the profile to your own personal or business email.
3. Check your new email inbox and click the confirmation link sent by the system to verify the email change.
4. Once confirmed, sign out of the website.
5. Go back to the login page, click **Forgot Password**, enter your email address, and follow the link to set your own secure password.
6. You will now have exclusive administrative access to the `/admin` dashboard routes (e.g., `/admin/tournaments`).

---

### B. Understanding the "Passive Cron" System
To run the platform on free database tiers and avoid the cost and setup overhead of background server daemons, the tournament lifecycle relies on a **passive cron** mechanism:

* **How it works:** When a tournament transitions from `upcoming` -> `stage1` -> `stage2` -> `concluded`, the database updates are NOT executed by an automated background script. Instead, they are run when users visit key sections of the website.
* **Trigger pages:** Whenever *any* user loads the **Dashboard**, **Leaderboard**, **Past Tournaments**, or **Admin Panel**, the web application executes a Database RPC call:
  ```typescript
  await supabase.rpc("run_tournament_cron");
  ```
* **Database Action:** The `run_tournament_cron()` function looks at the current time (`now()`), checks all active tournaments, and automatically progresses their status:
  - If `now() >= tournament_start_date` -> shifts status from `upcoming` to `stage1` (which triggers the database webhook to send Resend notification emails).
  - If `now() >= tournament_s2_start_date` -> automatically seeds approved entries and advances the tournament to `stage2` (bracket play).
  - Calculates round end times, tallies votes for bracket matches, and advances winners to the next rounds until a champion is crowned and the status is changed to `concluded`.

*Note: For low-to-medium traffic applications, this passive cron system works perfectly. If the platform scales and you require absolute second-by-second accuracy, you can set up a scheduled cron trigger in the Supabase Dashboard under Database -> pg_cron, or call this RPC endpoint at regular intervals using an external cron scheduler (like Vercel Cron or GitHub Actions).*

---

### C. Administering Tournaments
As an administrator, you can manage tournaments directly on the `/admin/tournaments` page:

1. **Creating Tournaments:**
   - Set the Tournament Title, Description, Rules, and Key Dates (Start Date, Seeding/Stage 2 Start Date, and End Date).
2. **Reviewing Submissions:**
   - Under `admin/concept-submissions`, you can review user concepts uploaded for active tournaments.
   - You can Approve or Reject submissions. Only approved submissions will be eligible for seeding in the Bracket Stage (Stage 2).
3. **Ending or Terminating Tournaments:**
   - You can terminate an active tournament if required, which will cancel ongoing bracket matches and clean up active states.


If you have any concerns or remaining questions please contact Danny at `danny.venizelou@student.uts.edu.au`.
