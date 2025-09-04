import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const [status, setStatus] = useState("Finishing login...");
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const hashOrSearch = window.location.hash || window.location.search;

        // Handle OAuth/OTP code exchange when "code" or tokens are present
        if (hashOrSearch.includes('access_token') || hashOrSearch.includes('code')) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) {
            setStatus(`Login failed: ${error.message}`);
            return;
          }
          if (data.session) {
            navigate('/app', { replace: true });
            return;
          }
        }

        // Fallback: just check for an existing session
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate('/app', { replace: true });
        } else {
          setStatus('Login failed or session not found');
        }
      } catch (e) {
        setStatus('Error completing sign-in');
      }
    };

    handleCallback();
  }, [navigate]);

  useEffect(() => {
    document.title = 'Auth Callback | datingSigma';
  }, []);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground text-sm">{status}</p>
      </div>
    </div>
  );
}
