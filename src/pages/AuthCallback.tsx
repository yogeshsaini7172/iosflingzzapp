import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const [status, setStatus] = useState("Finishing login...");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate("/app", { replace: true });
      } else {
        setStatus("Login failed or session not found");
      }
    });
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
