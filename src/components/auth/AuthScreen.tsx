import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Lock, User, School, Loader2, Shield, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface AuthScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

const AuthScreen = ({ onBack, onComplete }: AuthScreenProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [step, setStep] = useState<'form' | 'verify'>("form");
  const [otp, setOtp] = useState("");
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Redirecting to Google",
        description: "Please complete authentication in the new window"
      });
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    try {
      setIsLoading(true);
      
      // Use signInWithOtp for OTP-based signup
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
          data: {
            first_name: name.split(' ')[0] || name,
            last_name: name.split(' ').slice(1).join(' ') || '',
            university: college
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Verification code sent",
        description: "Check your email for the 6-digit verification code"
      });
      setStep('verify');

    } catch (error: any) {
      toast({
        title: "Sign Up Error", 
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;
      onComplete();
    } catch (error: any) {
      toast({
        title: "Sign In Error",
        description: error.message, 
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft p-4 animate-fade-in">
      <div className="container mx-auto max-w-md">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 hover:bg-white/20 transition-smooth"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
            Welcome to CampusConnect
          </h1>
          <p className="text-muted-foreground font-prompt text-lg">
            The verified student dating platform 💜
          </p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-card border-0 bg-gradient-card backdrop-blur-sm hover:shadow-medium transition-smooth">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
              Join the Community
            </CardTitle>
            <CardDescription className="text-base font-prompt">
              Connect with verified students from top universities ✨
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 'form' ? (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
                  <TabsTrigger value="login" className="rounded-lg font-medium">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-lg font-medium">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  <div className="space-y-4">
                    <div className="relative group">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type="email"
                        placeholder="College email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 rounded-xl border-border/50 focus:border-primary transition-colors h-12"
                      />
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 rounded-xl border-border/50 focus:border-primary transition-colors h-12"
                      />
                    </div>
                    <Button
                      onClick={handleEmailSignIn}
                      disabled={isLoading || !email || !password}
                      className="w-full rounded-xl h-12 font-semibold"
                      variant="coral"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Sign In to CampusConnect
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4">
                  <div className="space-y-4">
                    <div className="relative group">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type="text"
                        placeholder="Full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 rounded-xl border-border/50 focus:border-primary transition-colors h-12"
                      />
                    </div>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type="email"
                        placeholder="College email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 rounded-xl border-border/50 focus:border-primary transition-colors h-12"
                      />
                    </div>
                    <div className="relative group">
                      <School className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type="text"
                        placeholder="University name"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className="pl-10 rounded-xl border-border/50 focus:border-primary transition-colors h-12"
                      />
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type="password"
                        placeholder="Create password (min 8 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 rounded-xl border-border/50 focus:border-primary transition-colors h-12"
                      />
                    </div>
                    <Button
                      onClick={handleEmailSignUp}
                      disabled={isLoading || !name || !email || !college || !password}
                      className="w-full rounded-xl h-12 font-semibold"
                      variant="coral"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Create Account
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-6">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <KeyRound className="w-8 h-8 text-white" />
                </div>
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-semibold">Enter verification code</h2>
                  <p className="text-muted-foreground text-sm">We sent a 6-digit code to {email}</p>
                </div>
                <div className="flex justify-center">
                  <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setStep('form')}
                    variant="outline"
                    className="h-12 rounded-xl"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        setIsLoading(true);
                        const { error } = await supabase.auth.verifyOtp({
                          email: email,
                          token: otp,
                          type: 'email'
                        });
                        if (error) throw error;
                        toast({ title: 'Verified!', description: 'Account created successfully' });
                        onComplete();
                      } catch (err: any) {
                        toast({ title: 'Verification failed', description: err.message, variant: 'destructive' });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading || otp.length !== 6}
                    className="h-12 rounded-xl"
                    variant="coral"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Verify
                  </Button>
                </div>
                <div className="text-center">
                  <Button
                    variant="link"
                    className="text-sm"
                    onClick={async () => {
                      try {
                        setIsLoading(true);
                        const { error } = await supabase.auth.resend({
                          type: 'signup',
                          email: email
                        });
                        if (error) throw error;
                        setOtp('');
                        toast({ title: 'Code resent', description: 'Please check your inbox.' });
                      } catch (err: any) {
                        toast({ title: 'Resend failed', description: err.message, variant: 'destructive' });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    Resend code
                  </Button>
                </div>
              </div>
            )}


            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground font-prompt font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google OAuth */}
            <Button
              onClick={handleGoogleAuth}
              disabled={isLoading}
              variant="outline"
              className="w-full rounded-xl border-border/50 hover:bg-accent/10 transition-colors h-12 font-medium"
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Footer */}
            <div className="mt-6 text-center space-y-2">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground font-prompt">
                <Shield className="w-4 h-4 text-success" />
                <span>Only verified students can join</span>
              </div>
              <p className="text-xs text-muted-foreground font-prompt">
                ID verification required after signup • Safe & Secure
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthScreen;