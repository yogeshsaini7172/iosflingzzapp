import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const [status, setStatus] = useState("Finishing login...");
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('AuthCallback: Starting OAuth callback handling');
        
        // Check for OAuth code in URL and exchange it for session
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
          console.log('AuthCallback: Found OAuth code, exchanging for session');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('AuthCallback: Code exchange error:', error);
            setStatus(`Login failed: ${error.message}`);
            return;
          }
          
          if (data.session?.user) {
            console.log('AuthCallback: Session created successfully');
            setStatus('Login successful! Redirecting...');
            setTimeout(() => {
              navigate('/app', { replace: true });
            }, 100);
            return;
          }
        }
        
        // Fallback: Check for existing session
        const { data, error } = await supabase.auth.getSession();
        
        console.log('AuthCallback: Session check result:', { 
          hasSession: !!data.session, 
          user: data.session?.user?.email,
          error: error?.message 
        });

        if (error) {
          console.error('AuthCallback: Session error:', error);
          setStatus(`Login failed: ${error.message}`);
          return;
        }

        if (data.session?.user) {
          console.log('AuthCallback: Valid session found, checking profile...');
          
          // Check if user has a profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, first_name')
            .eq('user_id', data.session.user.id)
            .maybeSingle();

          console.log('AuthCallback: Profile check result:', { 
            hasProfile: !!profile, 
            hasName: !!profile?.first_name,
            profileError: profileError?.message 
          });

          if (profileError) {
            console.error('AuthCallback: Profile check error:', profileError);
          }

          // Always redirect to /app - let the main app decide the route
          console.log('AuthCallback: Redirecting to /app');
          setStatus('Login successful! Redirecting...');
          
          // Use setTimeout to ensure state updates are processed
          setTimeout(() => {
            navigate('/app', { replace: true });
          }, 100);
          
          return;
        }

        console.log('AuthCallback: No valid session found');
        setStatus('Login failed - no session found');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
        
      } catch (e: any) {
        console.error('AuthCallback: Unexpected error:', e);
        setStatus(`Error completing sign-in: ${e.message}`);
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
