import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LoginSignupProps {
  onLoginSuccess: (userId: string) => void;
  onSignupSuccess: () => void;
}

const LoginSignup = ({ onLoginSuccess, onSignupSuccess }: LoginSignupProps) => {
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check credentials against test_users table
      const { data: user, error } = await supabase
        .from("test_users")
        .select("*, profiles(user_id)")
        .eq("username", loginData.username)
        .eq("password", loginData.password)
        .single();

      if (error || !user) {
        toast({
          title: "Login Failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
        return;
      }

      // Store user info in localStorage
      localStorage.setItem("demoUserId", user.profiles?.user_id || user.id);
      localStorage.setItem("currentUser", JSON.stringify({
        id: user.profiles?.user_id || user.id,
        username: user.username,
      }));

      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.username}!`,
      });

      onLoginSuccess(user.profiles?.user_id || user.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = () => {
    toast({
      title: "Welcome!",
      description: "Let's set up your profile",
    });
    onSignupSuccess();
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
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="username" className="text-white/90 font-modern font-semibold text-sm">
                    Username 👤
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={loginData.username}
                    onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                    className="bg-black/20 border-white/20 text-white placeholder:text-white/60 rounded-xl h-12 font-modern transition-luxury focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-white/90 font-modern font-semibold text-sm">
                    Password 🔐
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-black/20 border-white/20 text-white placeholder:text-white/60 rounded-xl h-12 font-modern transition-luxury focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary hover:shadow-royal transition-luxury font-modern font-bold text-lg h-14 rounded-2xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Sign In</span>
                      <span>🚀</span>
                    </div>
                  )}
                </Button>
              </form>
              
              <div className="mt-8 genZ-glass-card p-4 rounded-2xl">
                <h4 className="text-sm font-modern font-bold mb-4 text-white/90 text-center">
                  Quick Test Accounts 🎯
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Array.from({ length: 10 }, (_, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs bg-black/20 border-white/20 text-white hover:bg-primary hover:border-primary transition-luxury rounded-xl"
                      onClick={() => setLoginData({ 
                        username: `user${String(i + 1).padStart(3, '0')}`, 
                        password: "pass123" 
                      })}
                    >
                      user{String(i + 1).padStart(3, '0')} 🔑
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-6">
              <div className="text-center space-y-6">
                <div className="space-y-4">
                  <div className="text-4xl animate-bounce-slow">💫</div>
                  <p className="text-white/90 font-modern text-lg leading-relaxed">
                    Ready to find your perfect match? <br/>
                    Let's create your amazing profile! ✨
                  </p>
                  <div className="flex justify-center space-x-2 text-lg">
                    <span className="animate-float">💖</span>
                    <span className="animate-pulse-glow delay-300">🌟</span>
                    <span className="animate-bounce-slow delay-600">🚀</span>
                  </div>
                </div>
                <Button 
                  onClick={handleSignup}
                  className="w-full bg-gradient-secondary hover:shadow-gold transition-luxury font-modern font-bold text-lg h-16 rounded-2xl text-black"
                  size="lg"
                >
                  <div className="flex items-center space-x-3">
                    <span>Start Your Journey</span>
                    <span className="text-2xl">🎉</span>
                  </div>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginSignup;