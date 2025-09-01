import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ArrowLeft, Mail, Lock, User, GraduationCap, Phone, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [currentStep, setCurrentStep] = useState<'auth' | 'verify' | 'profile'>('auth');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSignUp = async () => {
    if (!email || !password) {
      toast({
        title: "Missing information",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }
    
    // Validate email format (basic .edu check)
    if (!email.endsWith('.edu')) {
      toast({
        title: "Invalid email",
        description: "Please use a valid .edu email address",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Use signUp with email confirmation
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });

      if (error) throw error;
      
      toast({
        title: "Verification code sent",
        description: "Check your email for the 6-digit verification code"
      });
      
      setCurrentStep('verify');
    } catch (error: any) {
      toast({
        title: "Signup Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!email || !otp) {
      toast({
        title: "Missing information",
        description: "Please enter the verification code",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Verify the OTP token
      const { error } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: 'signup'
      });

      if (error) throw error;
      
      toast({
        title: "Email verified successfully",
        description: "Your account has been created! Now complete your profile."
      });
      
      setCurrentStep('profile');
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message === "Token has expired or is invalid" 
          ? "The verification code has expired or is invalid. Please request a new one."
          : error.message,
        variant: "destructive"
      });
      // Clear invalid OTP
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) return;
    
    try {
      setIsLoading(true);
      
      // Resend signup confirmation
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });

      if (error) throw error;
      
      toast({
        title: "Code resent",
        description: "A new verification code has been sent to your email"
      });
      
      // Clear the current OTP input
      setOtp("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({
        title: "Missing information",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;
      
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in"
      });
      
      // Redirect to main app
      window.location.href = '/';
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

  const handleCompleteProfile = async () => {
    // For now, just redirect to main app
    toast({
      title: "Profile setup complete!",
      description: "Welcome to GradSync"
    });
    
    // Redirect to main app
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  const AuthForm = () => (
    <div className="space-y-6">
      <Tabs defaultValue="signup" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
          <TabsTrigger value="signin">Sign In</TabsTrigger>
        </TabsList>
        
        <TabsContent value="signup" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">College Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="email" 
                placeholder="your.name@college.edu" 
                type="email"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">Must be a valid .edu email address</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="password" 
                placeholder="Create a strong password" 
                type="password"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          <Button 
            className="w-full" 
            variant="hero"
            onClick={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? "Sending OTP..." : "Create Account"}
          </Button>
        </TabsContent>
        
        <TabsContent value="signin" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="signin-email" 
                placeholder="your.email@college.edu" 
                type="email"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="signin-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="signin-password" 
                placeholder="Enter your password" 
                type="password"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            className="w-full" 
            variant="hero"
            onClick={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
          
          <div className="text-center">
            <a href="#" className="text-sm text-primary hover:underline">
              Forgot your password?
            </a>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      
      <Button variant="outline" className="w-full">
        <Phone className="mr-2 h-4 w-4" />
        Phone Number
      </Button>
    </div>
  );

  const VerificationStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
        <KeyRound className="w-8 h-8 text-white" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-2">Enter Verification Code</h3>
        <p className="text-muted-foreground">
          We've sent a 6-digit verification code to {email}. 
          Enter the code below to verify your account.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-center">
          <InputOTP
            value={otp}
            onChange={setOtp}
            maxLength={6}
            onComplete={handleVerifyOTP}
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
        
        <p className="text-xs text-muted-foreground text-center">
          Enter the 6-digit code sent to your email
        </p>
        
        <Button 
          variant="hero" 
          className="w-full"
          onClick={handleVerifyOTP}
          disabled={isLoading || otp.length !== 6}
        >
          {isLoading ? "Verifying..." : "Verify Code"}
        </Button>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm text-muted-foreground mb-3">
          Didn't receive the code? Check your spam folder or
        </p>
        <Button variant="outline" size="sm" onClick={handleResendOTP} disabled={isLoading}>
          Resend Code
        </Button>
      </div>
    </div>
  );

  const ProfileSetup = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Complete Your Profile</h3>
        <p className="text-muted-foreground">
          Tell us a bit about yourself to find better matches.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="name" 
              placeholder="Enter your full name" 
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="college">College/University</Label>
          <div className="relative">
            <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="college" 
              placeholder="Your college name" 
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="year">Graduation Year</Label>
            <Input 
              id="year" 
              placeholder="2025" 
              type="number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input 
              id="age" 
              placeholder="20" 
              type="number"
            />
          </div>
        </div>
      </div>
      
      <Button 
        variant="hero" 
        className="w-full"
        onClick={handleCompleteProfile}
      >
        Complete Setup & Continue
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-lg shadow-glow">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-between mb-4">
            {currentStep !== 'auth' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(currentStep === 'verify' ? 'auth' : 'verify')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <div className="flex items-center gap-2 mx-auto">
              <div className="w-6 h-6 bg-gradient-primary rounded"></div>
              <span className="font-bold bg-gradient-primary bg-clip-text text-transparent">
                GradSync
              </span>
            </div>
          </div>
          
        <div className="space-y-2">
          {/* Progress indicator */}
          <div className="flex justify-center space-x-2 mb-4">
            <div className={`w-2 h-2 rounded-full transition-all ${currentStep === 'auth' ? 'bg-primary' : currentStep === 'verify' || currentStep === 'profile' ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`w-2 h-2 rounded-full transition-all ${currentStep === 'verify' ? 'bg-primary' : currentStep === 'profile' ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`w-2 h-2 rounded-full transition-all ${currentStep === 'profile' ? 'bg-primary' : 'bg-muted'}`}></div>
          </div>
          
          <CardTitle className="text-2xl">
            {currentStep === 'auth' && 'Welcome to GradSync'}
            {currentStep === 'verify' && 'Verify Your Email'}
            {currentStep === 'profile' && 'Almost There!'}
          </CardTitle>
          <CardDescription>
            {currentStep === 'auth' && 'Connect with students at your college'}
            {currentStep === 'verify' && 'We need to verify your student status'}
            {currentStep === 'profile' && 'Set up your profile to get started'}
          </CardDescription>
        </div>
        </CardHeader>
        
        <CardContent>
          {currentStep === 'auth' && <AuthForm />}
          {currentStep === 'verify' && <VerificationStep />}
          {currentStep === 'profile' && <ProfileSetup />}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;