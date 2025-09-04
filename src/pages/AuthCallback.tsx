import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const [status, setStatus] = useState('Finalizing sign-in…');
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const finalize = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;

        if (data.session) {
          setStatus('Signed in — redirecting');
          navigate('/app', { replace: true });
          return;
        }

        const hash = window.location.hash || window.location.search;
        if (!hash) {
          setStatus('No auth data in callback URL');
          return;
        }

        const t = setTimeout(async () => {
          const { data: again } = await supabase.auth.getSession();
          if (again.session) navigate('/app', { replace: true });
          else setStatus('Could not complete sign-in');
        }, 500);
        return () => clearTimeout(t);
      } catch (e) {
        setStatus('Error completing sign-in');
      }
    };

    finalize();
    return () => {
      cancelled = true;
    };
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
