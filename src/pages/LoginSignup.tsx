import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface LoginSignupProps {
  onLoginSuccess: (userId: string) => void;
  onSignupSuccess: () => void;
}

const LoginSignup = ({ onLoginSuccess, onSignupSuccess }: LoginSignupProps) => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ email: "", password: "", confirmPassword: "" });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signUpWithEmail, signInWithGoogle } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Login is handled by AuthContext automatically
    toast({
      title: "Please use signup",
      description: "This is a signup-first app. Please create an account first.",
      variant: "destructive",
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (signupData.password.length < 6) {
      toast({
        title: "Password too short", 
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUpWithEmail(signupData.email);
      
      if (error) {
        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Check your email! 📧",
          description: "We've sent you a verification link.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Signup error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Google signup failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Google signup error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full genZ-glass-card genZ-hover-lift shadow-premium border-0">
        <CardHeader className="text-center space-y-4">
          <div className="relative">
            <CardTitle className="text-4xl font-elegant font-bold text-gradient-royal animate-fade-in">
              datingSigma
            </CardTitle>
            <div className="absolute -top-2 -right-2 text-2xl animate-bounce-slow">✨</div>
            <div className="absolute -bottom-1 -left-2 text-xl animate-float delay-1000">💜</div>
          </div>
          <p className="text-white/80 font-modern text-lg">
            Join the exclusive GenZ dating revolution 🔥
          </p>
          <div className="flex justify-center space-x-2 text-2xl animate-pulse-glow delay-500">
            <span>💕</span>
            <span>🌟</span>
            <span>💫</span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Tabs defaultValue="login" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-2xl p-1">
              <TabsTrigger 
                value="login" 
                className="rounded-xl text-white data-[state=active]:bg-gradient-primary data-[state=active]:text-white font-modern font-semibold transition-luxury"
              >
                Sign In ✨
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="rounded-xl text-white data-[state=active]:bg-gradient-secondary data-[state=active]:text-black font-modern font-semibold transition-luxury"
              >
                Join Us 🚀
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-6">
              <div className="text-center space-y-6">
                <div className="space-y-4">
                  <div className="text-4xl animate-bounce-slow">🔐</div>
                  <p className="text-white/90 font-modern text-lg leading-relaxed">
                    This is a signup-first app! <br/>
                    New users, please create your account first ✨
                  </p>
                  <div className="flex justify-center space-x-2 text-lg">
                    <span className="animate-float">💖</span>
                    <span className="animate-pulse-glow delay-300">🌟</span>
                    <span className="animate-bounce-slow delay-600">🚀</span>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    const signupTab = document.querySelector('[value="signup"]') as HTMLElement;
                    if (signupTab) signupTab.click();
                  }}
                  className="w-full bg-gradient-primary hover:shadow-royal transition-luxury font-modern font-bold text-lg h-16 rounded-2xl"
                >
                  <div className="flex items-center space-x-3">
                    <span>Go to Signup</span>
                    <span className="text-2xl">👉</span>
                  </div>
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-6">
              <div className="space-y-4">
                <Button 
                  onClick={handleGoogleSignup}
                  className="w-full bg-white text-black border border-gray-300 hover:bg-gray-50 h-12 rounded-xl font-modern font-semibold transition-luxury"
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-white/60 font-modern">or</span>
                  </div>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="signup-email" className="text-white/90 font-modern font-semibold text-sm">
                      College Email 📧
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your college email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      className="bg-black/20 border-white/20 text-white placeholder:text-white/60 rounded-xl h-12 font-modern transition-luxury focus:border-primary focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="signup-password" className="text-white/90 font-modern font-semibold text-sm">
                      Password 🔐
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      className="bg-black/20 border-white/20 text-white placeholder:text-white/60 rounded-xl h-12 font-modern transition-luxury focus:border-primary focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="confirm-password" className="text-white/90 font-modern font-semibold text-sm">
                      Confirm Password 🔒
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      className="bg-black/20 border-white/20 text-white placeholder:text-white/60 rounded-xl h-12 font-modern transition-luxury focus:border-primary focus:ring-primary"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-secondary hover:shadow-gold transition-luxury font-modern font-bold text-lg h-14 rounded-2xl text-black"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-black/30 border-t-black"></div>
                        <span>Creating account...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Create Account</span>
                        <span>🎉</span>
                      </div>
                    )}
                  </Button>
                </form>
                
                <p className="text-sm text-white/70 text-center font-modern">
                  Connect with fellow students at your university. Build meaningful relationships! 💕
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginSignup;