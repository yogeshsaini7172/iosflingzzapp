import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Mail, Phone, ArrowLeft } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authStep, setAuthStep] = useState<'login' | 'signup' | 'phone-otp' | 'verify-otp'>('login');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
  const navigate = useNavigate();
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithPhone, verifyPhoneOTP } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    
    try {
      const { error } = authStep === 'login' 
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password);
        
      if (!error) {
        navigate('/');
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setIsLoading(true);
    
    try {
      const { error, confirmationResult: result } = await signInWithPhone(phone);
      if (!error && result) {
        setConfirmationResult(result);
        setAuthStep('verify-otp');
      }
    } catch (error) {
      console.error('Phone auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    if (!otp || !confirmationResult) return;

    setIsLoading(true);
    
    try {
      const { error } = await verifyPhoneOTP(confirmationResult, otp);
      if (!error) {
        navigate('/');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await signInWithGoogle();
      if (!error) {
        navigate('/');
      }
    } catch (error) {
      console.error('Google auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authStep === 'verify-otp') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 left-4"
              onClick={() => setAuthStep('phone-otp')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>Verify Phone Number</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to your phone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
              >
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
            
            <Button 
              onClick={handleOTPVerification}
              disabled={otp.length !== 6 || isLoading}
              className="w-full"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => handlePhoneAuth(new Event('submit') as any)}
              disabled={isLoading}
              className="w-full"
            >
              Resend Code
            </Button>
            
            <div id="recaptcha-container"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome to CampusConnect</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={authStep === 'phone-otp' ? 'phone' : 'email'} onValueChange={(value) => {
            if (value === 'email') setAuthStep('login');
            else if (value === 'phone') setAuthStep('phone-otp');
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="email" className="space-y-4">
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    variant={authStep === 'login' ? 'default' : 'outline'}
                    onClick={() => setAuthStep('login')}
                    className="flex-1"
                  >
                    {isLoading && authStep === 'login' ? 'Signing in...' : 'Sign In'}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    variant={authStep === 'signup' ? 'default' : 'outline'}
                    onClick={() => setAuthStep('signup')}
                    className="flex-1"
                  >
                    {isLoading && authStep === 'signup' ? 'Signing up...' : 'Sign Up'}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="phone" className="space-y-4">
              <form onSubmit={handlePhoneAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                </Button>
                
                <div id="recaptcha-container"></div>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full"
            >
              Continue with Google
            </Button>
          </div>
          
          <p className="mt-6 text-center text-sm text-muted-foreground">
            By continuing, you agree to our{' '}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;