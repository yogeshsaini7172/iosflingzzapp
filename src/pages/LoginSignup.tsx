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
  const [signupData, setSignupData] = useState({ email: "" });
  const [phoneData, setPhoneData] = useState({ phone: "", otp: "" });
  const [otpData, setOtpData] = useState({ email: "", otp: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'signup' | 'email-otp' | 'phone-otp'>('signup');
  const { toast } = useToast();
  const { signUpWithEmail, verifyOTP, resendOTP, signInWithPhone, verifyPhoneOTP, resendPhoneOTP, signInWithGoogle } = useAuth();

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signUpWithEmail(signupData.email);
      
      if (!error) {
        setOtpData({ email: signupData.email, otp: "" });
        setCurrentStep('email-otp');
        toast({
          title: "Check your email! 📧",
          description: "We've sent you a 6-digit verification code.",
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

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signInWithPhone(phoneData.phone);
      
      if (!error) {
        setCurrentStep('phone-otp');
        toast({
          title: "Check your phone! 📱",
          description: "We've sent you a 6-digit verification code via SMS.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Phone signup error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await verifyOTP(otpData.email, otpData.otp);
      
      if (!error) {
        toast({
          title: "Email verified! ✅",
          description: "Welcome to datingSigma!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await verifyPhoneOTP(phoneData.phone, phoneData.otp);
      
      if (!error) {
        toast({
          title: "Phone verified! ✅",
          description: "Welcome to datingSigma!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification failed", 
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmailOTP = async () => {
    setIsLoading(true);
    try {
      await resendOTP(otpData.email);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendPhoneOTP = async () => {
    setIsLoading(true);
    try {
      await resendPhoneOTP(phoneData.phone);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Google authentication failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Google authentication error",
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
          {currentStep === 'signup' && (
            <Tabs defaultValue="email" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-2xl p-1">
                <TabsTrigger 
                  value="email" 
                  className="rounded-xl text-white data-[state=active]:bg-gradient-primary data-[state=active]:text-white font-modern font-semibold transition-luxury"
                >
                  Email 📧
                </TabsTrigger>
                <TabsTrigger 
                  value="phone" 
                  className="rounded-xl text-white data-[state=active]:bg-gradient-secondary data-[state=active]:text-black font-modern font-semibold transition-luxury"
                >
                  Phone 📱
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="email" className="space-y-6">
                <div className="space-y-4">
                  <Button 
                    onClick={handleGoogleAuth}
                    className="w-full bg-white text-black border border-gray-300 hover:bg-gray-50 h-12 rounded-xl font-modern font-semibold transition-luxury"
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google ✨
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-white/60 font-modern">or</span>
                    </div>
                  </div>

                  <form onSubmit={handleEmailSignup} className="space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="signup-email" className="text-white/90 font-modern font-semibold text-sm">
                        College Email 📧
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your college email"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ email: e.target.value })}
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
                          <span>Sending OTP...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>Send OTP Code</span>
                          <span>📧</span>
                        </div>
                      )}
                    </Button>
                  </form>
                </div>
              </TabsContent>

              <TabsContent value="phone" className="space-y-6">
                <div className="space-y-4">
                  <Button 
                    onClick={handleGoogleAuth}
                    className="w-full bg-white text-black border border-gray-300 hover:bg-gray-50 h-12 rounded-xl font-modern font-semibold transition-luxury"
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google ✨
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-white/60 font-modern">or</span>
                    </div>
                  </div>

                  <form onSubmit={handlePhoneSignup} className="space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-white/90 font-modern font-semibold text-sm">
                        Phone Number 📱
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={phoneData.phone}
                        onChange={(e) => setPhoneData({ ...phoneData, phone: e.target.value })}
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
                          <span>Sending SMS...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>Send SMS Code</span>
                          <span>📱</span>
                        </div>
                      )}
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {currentStep === 'email-otp' && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="text-6xl animate-bounce-slow">📧</div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-elegant font-bold text-white">Check Your Email</h3>
                  <p className="text-white/80 font-modern">
                    We sent a 6-digit code to <br />
                    <span className="font-semibold text-primary">{otpData.email}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleEmailOTPVerification} className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="email-otp" className="text-white/90 font-modern font-semibold text-sm">
                    Enter 6-digit code 🔐
                  </Label>
                  <Input
                    id="email-otp"
                    type="text"
                    placeholder="123456"
                    value={otpData.otp}
                    onChange={(e) => setOtpData({ ...otpData, otp: e.target.value })}
                    className="bg-black/20 border-white/20 text-white placeholder:text-white/60 rounded-xl h-12 font-modern transition-luxury focus:border-primary focus:ring-primary text-center text-xl tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-secondary hover:shadow-gold transition-luxury font-modern font-bold text-lg h-14 rounded-2xl text-black"
                  disabled={isLoading || otpData.otp.length !== 6}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-black/30 border-t-black"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Verify Email</span>
                      <span>✅</span>
                    </div>
                  )}
                </Button>
              </form>

              <div className="text-center space-y-2">
                <p className="text-white/60 text-sm font-modern">Didn't receive the code?</p>
                <Button 
                  variant="ghost"
                  onClick={handleResendEmailOTP}
                  disabled={isLoading}
                  className="text-primary hover:text-primary/80 font-modern font-semibold"
                >
                  Resend Code 🔄
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => setCurrentStep('signup')}
                  className="text-white/70 hover:text-white font-modern ml-4"
                >
                  ← Back
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'phone-otp' && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="text-6xl animate-bounce-slow">📱</div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-elegant font-bold text-white">Check Your Phone</h3>
                  <p className="text-white/80 font-modern">
                    We sent a 6-digit code to <br />
                    <span className="font-semibold text-primary">{phoneData.phone}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handlePhoneOTPVerification} className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="phone-otp" className="text-white/90 font-modern font-semibold text-sm">
                    Enter 6-digit SMS code 🔐
                  </Label>
                  <Input
                    id="phone-otp"
                    type="text"
                    placeholder="123456"
                    value={phoneData.otp}
                    onChange={(e) => setPhoneData({ ...phoneData, otp: e.target.value })}
                    className="bg-black/20 border-white/20 text-white placeholder:text-white/60 rounded-xl h-12 font-modern transition-luxury focus:border-primary focus:ring-primary text-center text-xl tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary hover:shadow-royal transition-luxury font-modern font-bold text-lg h-14 rounded-2xl"
                  disabled={isLoading || phoneData.otp.length !== 6}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Verify Phone</span>
                      <span>✅</span>
                    </div>
                  )}
                </Button>
              </form>

              <div className="text-center space-y-2">
                <p className="text-white/60 text-sm font-modern">Didn't receive the code?</p>
                <Button 
                  variant="ghost"
                  onClick={handleResendPhoneOTP}
                  disabled={isLoading}
                  className="text-primary hover:text-primary/80 font-modern font-semibold"
                >
                  Resend SMS 🔄
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => setCurrentStep('signup')}
                  className="text-white/70 hover:text-white font-modern ml-4"
                >
                  ← Back
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginSignup;