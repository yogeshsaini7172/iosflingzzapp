import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Lock, User, GraduationCap, Phone } from "lucide-react";

const Auth = () => {
  const [currentStep, setCurrentStep] = useState<'auth' | 'verify' | 'profile'>('auth');

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
                required
              />
            </div>
          </div>
          
          <Button 
            className="w-full" 
            variant="hero"
            onClick={() => setCurrentStep('verify')}
          >
            Create Account
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
              />
            </div>
          </div>
          
          <Button className="w-full" variant="hero">
            Sign In
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
        <Mail className="w-8 h-8 text-white" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-2">Check Your Email</h3>
        <p className="text-muted-foreground">
          We've sent a verification link to your college email address. 
          Click the link to verify your account and continue.
        </p>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm text-muted-foreground mb-3">
          Didn't receive the email? Check your spam folder or
        </p>
        <Button variant="outline" size="sm">
          Resend Verification Email
        </Button>
      </div>
      
      <Button 
        variant="hero" 
        className="w-full"
        onClick={() => setCurrentStep('profile')}
      >
        I've Verified My Email
      </Button>
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
      
      <Button variant="hero" className="w-full">
        Complete Setup
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