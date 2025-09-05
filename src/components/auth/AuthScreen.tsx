import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Mail, Phone, Chrome, Loader2, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type AuthStep = 'login' | 'signup' | 'email-otp' | 'phone-otp' | 'verify-email-otp' | 'verify-phone-otp';

const AuthScreen = () => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('login');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    signInWithEmail,
    signUpWithEmail,
    signUpWithEmailOTP,
    verifyEmailOTP,
    resendEmailOTP,
    signUpWithPhoneOTP,
    verifyPhoneOTP,
    resendPhoneOTP,
    signInWithGoogle
  } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      switch (currentStep) {
        case 'login':
          if (!formData.email || !formData.password) {
            toast.error('Please fill in all fields');
            return;
          }
          const { error: loginError } = await signInWithEmail(formData.email, formData.password);
          if (loginError) {
            // If login fails, offer to create account
            toast.error('Login failed. Try signing up instead?');
          }
          break;

        case 'signup':
          if (!formData.email || !formData.password || !formData.confirmPassword) {
            toast.error('Please fill in all fields');
            return;
          }
          if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
          }
          if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
          }
          await signUpWithEmail(formData.email, formData.password);
          break;

        case 'email-otp':
          if (!formData.email) {
            toast.error('Please enter your email');
            return;
          }
          const { error: emailOtpError } = await signUpWithEmailOTP(formData.email);
          if (!emailOtpError) {
            setCurrentStep('verify-email-otp');
          }
          break;

        case 'phone-otp':
          if (!formData.phone) {
            toast.error('Please enter your phone number');
            return;
          }
          const { error: phoneOtpError } = await signUpWithPhoneOTP(formData.phone);
          if (!phoneOtpError) {
            setCurrentStep('verify-phone-otp');
          }
          break;

        case 'verify-email-otp':
          if (!formData.otp) {
            toast.error('Please enter the OTP code');
            return;
          }
          await verifyEmailOTP(formData.email, formData.otp);
          break;

        case 'verify-phone-otp':
          if (!formData.otp) {
            toast.error('Please enter the OTP code');
            return;
          }
          await verifyPhoneOTP(formData.phone, formData.otp);
          break;
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast.error(error.message || 'Google sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      if (currentStep === 'verify-email-otp') {
        await resendEmailOTP(formData.email);
      } else if (currentStep === 'verify-phone-otp') {
        await resendPhoneOTP(formData.phone);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP');
    }
  };

  const resetForm = () => {
    setFormData({ email: '', phone: '', password: '', confirmPassword: '', otp: '' });
    setCurrentStep('login');
  };

  const renderForm = () => {
    switch (currentStep) {
      case 'login':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign In
            </Button>
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setCurrentStep('signup')}
                className="p-0"
              >
                Don't have an account? Sign up
              </Button>
            </div>
          </form>
        );

      case 'signup':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Create a password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm your password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign Up
            </Button>
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setCurrentStep('login')}
                className="p-0"
              >
                Already have an account? Sign in
              </Button>
            </div>
          </form>
        );

      case 'email-otp':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Send OTP Code
            </Button>
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={resetForm}
                className="p-0"
              >
                Back to login
              </Button>
            </div>
          </form>
        );

      case 'phone-otp':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
              Send SMS Code
            </Button>
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={resetForm}
                className="p-0"
              >
                Back to login
              </Button>
            </div>
          </form>
        );

      case 'verify-email-otp':
      case 'verify-phone-otp':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code sent to{' '}
                <strong>
                  {currentStep === 'verify-email-otp' ? formData.email : formData.phone}
                </strong>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                value={formData.otp}
                onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value }))}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Verify Code
            </Button>
            <div className="text-center space-y-2">
              <Button
                type="button"
                variant="link"
                onClick={handleResendOTP}
                className="p-0"
              >
                Resend Code
              </Button>
              <br />
              <Button
                type="button"
                variant="link"
                onClick={resetForm}
                className="p-0"
              >
                Back to login
              </Button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
                <Heart className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {currentStep === 'login' && 'Welcome Back'}
              {currentStep === 'signup' && 'Create Account'}
              {currentStep === 'email-otp' && 'Email Verification'}
              {currentStep === 'phone-otp' && 'Phone Verification'}
              {(currentStep === 'verify-email-otp' || currentStep === 'verify-phone-otp') && 'Enter Code'}
            </CardTitle>
            <p className="text-muted-foreground">
              {currentStep === 'login' && 'Sign in to continue your journey'}
              {currentStep === 'signup' && 'Join thousands finding love'}
              {currentStep === 'email-otp' && 'We\'ll send you a verification code'}
              {currentStep === 'phone-otp' && 'We\'ll send you an SMS code'}
              {(currentStep === 'verify-email-otp' || currentStep === 'verify-phone-otp') && 'Check your messages for the code'}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Main Auth Options */}
            {(currentStep === 'login' || currentStep === 'signup') && (
              <div className="space-y-4">
                {/* Google Sign In */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Chrome className="mr-2 h-4 w-4" />
                  )}
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Tabs defaultValue="email" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email">Email</TabsTrigger>
                    <TabsTrigger value="phone">Phone</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="email" className="space-y-4">
                    {renderForm()}
                    <div className="text-center">
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setCurrentStep('email-otp')}
                        className="p-0 text-sm"
                      >
                        <Mail className="mr-1 h-3 w-3" />
                        Use email OTP instead
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="phone" className="space-y-4">
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => setCurrentStep('phone-otp')}
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Continue with Phone
                    </Button>
                    <div className="text-center">
                      <Button
                        type="button"
                        variant="link"
                        onClick={resetForm}
                        className="p-0"
                      >
                        Back to email
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* OTP Forms */}
            {(currentStep === 'email-otp' || 
              currentStep === 'phone-otp' || 
              currentStep === 'verify-email-otp' || 
              currentStep === 'verify-phone-otp') && (
              renderForm()
            )}

            {/* Feature highlights */}
            {(currentStep === 'login' || currentStep === 'signup') && (
              <div className="pt-4 border-t">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="flex flex-col items-center space-y-1">
                    <Badge variant="secondary" className="w-8 h-8 rounded-full p-0">
                      💕
                    </Badge>
                    <span className="text-xs text-muted-foreground">Smart Matching</span>
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <Badge variant="secondary" className="w-8 h-8 rounded-full p-0">
                      🛡️
                    </Badge>
                    <span className="text-xs text-muted-foreground">Verified Profiles</span>
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <Badge variant="secondary" className="w-8 h-8 rounded-full p-0">
                      💬
                    </Badge>
                    <span className="text-xs text-muted-foreground">Real Connections</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* reCAPTCHA container for Firebase phone auth - invisible */}
        <div id="recaptcha-container" className="hidden"></div>
      </div>
    </div>
  );
};

export default AuthScreen;