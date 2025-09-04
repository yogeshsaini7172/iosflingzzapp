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
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-elegant">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            CampusConnect
          </CardTitle>
          <p className="text-muted-foreground">
            Join the exclusive college dating community
          </p>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={loginData.username}
                    onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Test Accounts:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Array.from({ length: 10 }, (_, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => setLoginData({ 
                        username: `user${String(i + 1).padStart(3, '0')}`, 
                        password: "pass123" 
                      })}
                    >
                      user{String(i + 1).padStart(3, '0')} / pass123
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ready to find your perfect match on campus?
                </p>
                <Button 
                  onClick={handleSignup}
                  className="w-full bg-gradient-primary"
                  size="lg"
                >
                  Start Profile Setup
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