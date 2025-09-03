import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Mail, Lock, Heart, Sparkles, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TestCredential {
  email: string;
  password: string;
  profile_name: string;
  university: string;
}

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testCredentials, setTestCredentials] = useState<TestCredential[]>([]);
  const navigate = useNavigate();

  // Load test credentials
  useEffect(() => {
    const loadTestCredentials = async () => {
      const { data, error } = await supabase
        .from('test_credentials')
        .select('*')
        .order('profile_name');
      
      if (!error && data) {
        setTestCredentials(data);
      }
    };
    loadTestCredentials();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    
    // Check if credentials match any test user
    const testUser = testCredentials.find(
      cred => cred.email === email && cred.password === password
    );

    if (testUser) {
      // Get the profile from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
      
      if (profile) {
        // Store user session in localStorage for demo purposes
        localStorage.setItem('currentUser', JSON.stringify({
          id: profile.user_id,
          email: profile.email,
          name: `${profile.first_name} ${profile.last_name}`,
          profile: profile
        }));
        
        toast.success(`Welcome back, ${profile.first_name}!`);
        navigate('/app');
      } else {
        toast.error('Profile not found');
      }
    } else {
      toast.error('Invalid credentials. Use test credentials from the list.');
    }
    
    setIsLoading(false);
  };

  const quickLogin = (credential: TestCredential) => {
    setEmail(credential.email);
    setPassword(credential.password);
  };

  return (
    <div className="min-h-screen bg-gradient-elegant relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 text-white">
          <div className="max-w-md text-center space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 mb-8">
                <Heart className="h-8 w-8 text-accent" />
                <h1 className="text-4xl font-elegant font-bold text-gradient-primary">GradSync</h1>
              </div>
              <p className="text-xl text-white/90">Elite College Dating</p>
              <p className="text-white/80 leading-relaxed">
                Connect with verified students from top universities. 
                Find meaningful relationships with people who share your academic excellence.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-accent" />
                <span>Verified Students</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-accent" />
                <span>Quality Matches</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <span>Smart Algorithm</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-accent" />
                <span>Real Connections</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-6">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Heart className="h-8 w-8 text-accent" />
                <h1 className="text-3xl font-elegant font-bold text-white">GradSync</h1>
              </div>
              <p className="text-white/80">Elite College Dating</p>
            </div>

            <Card className="glass-luxury border-white/20 shadow-premium">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-elegant text-white">Welcome Back</CardTitle>
                <p className="text-white/80">Sign in to find your perfect match</p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/90">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@university.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 glass-luxury border-white/30 text-white placeholder:text-white/50"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white/90">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 glass-luxury border-white/30 text-white placeholder:text-white/50"
                        required
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-6 w-6 text-white/60 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary hover:opacity-90 transition-luxury shadow-royal"
                    disabled={isLoading || !email || !password}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Signing in...
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card/50 px-2 text-white/70">
                      Test Accounts
                    </span>
                  </div>
                </div>

                {/* Quick Login Options */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <p className="text-xs text-white/70 text-center mb-3">
                    Click any profile to auto-fill credentials
                  </p>
                  <div className="grid gap-2">
                    {testCredentials.slice(0, 6).map((credential) => (
                      <Button
                        key={credential.email}
                        variant="ghost"
                        className="w-full justify-start glass-luxury border-white/20 text-white/90 hover:bg-white/10 transition-elegant p-3 h-auto"
                        onClick={() => quickLogin(credential)}
                      >
                        <div className="text-left">
                          <div className="font-medium">{credential.profile_name}</div>
                          <div className="text-xs text-white/60">{credential.university}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="text-center text-xs text-white/60">
                  Demo App • All passwords are "test123"
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;