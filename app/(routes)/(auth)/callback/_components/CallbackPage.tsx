"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const CallbackPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.push('/dashboard');
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        router.push('/dashboard');
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [router, supabase]);

  return (
    <div className="flex items-center justify-center h-full">
      <p>Verifying your account... please wait.</p>
    </div>
  );
};

export default CallbackPage;