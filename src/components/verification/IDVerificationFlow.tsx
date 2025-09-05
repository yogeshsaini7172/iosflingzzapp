import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Shield, 
  Upload, 
  FileCheck, 
  Camera, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  Lock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IDVerificationFlowProps {
  onBack: () => void;
  onComplete: () => void;
  onSkip?: () => void;
}

const IDVerificationFlow = ({ onBack, onComplete, onSkip }: IDVerificationFlowProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [collegeIdFile, setCollegeIdFile] = useState<File | null>(null);
  const [govtIdFile, setGovtIdFile] = useState<File | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const { toast } = useToast();

  const totalSteps = 3;

  const handleFileUpload = async (file: File, type: 'college' | 'govt') => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}_id_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(fileName);

      // Update the profiles table with the document URL
      const updateField = type === 'college' ? 'college_id_url' : 'govt_id_url';
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          [updateField]: publicUrl,
          verification_status: 'pending'
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      if (type === 'college') {
        setCollegeIdFile(file);
      } else {
        setGovtIdFile(file);
      }

      toast({
        title: `${type === 'college' ? 'College' : 'Government'} ID uploaded!`,
        description: "Document uploaded successfully ✅"
      });

    } catch (error: any) {
      console.error('File upload error:', error);
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitVerification = async () => {
    try {
      setIsLoading(true);
      
      // Simulate AI verification process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // For demo purposes, we'll set status to pending
      setVerificationStatus('pending');
      
      toast({
        title: "Verification Submitted! 🎉",
        description: "We'll review your documents within 24 hours"
      });

      setTimeout(() => {
        onComplete();
      }, 1500);

    } catch (error: any) {
      toast({
        title: "Submission Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-glow">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Identity Verification 🛡️
              </h2>
              <p className="text-muted-foreground font-prompt text-lg">
                Verify your identity to ensure a safe and trusted community
              </p>
            </div>

            <Card className="border-2 border-primary/20 bg-gradient-card shadow-card">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center text-lg">
                  <FileCheck className="w-5 h-5 mr-2 text-primary" />
                  What You Need
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-primary/5 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div>
                      <p className="font-medium text-primary">College ID Card</p>
                      <p className="text-sm text-muted-foreground">
                        Current student ID with your photo and college name clearly visible
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-secondary/5 rounded-lg">
                    <div className="w-2 h-2 bg-secondary rounded-full mt-2" />
                    <div>
                      <p className="font-medium text-secondary">Government ID</p>
                      <p className="text-sm text-muted-foreground">
                        Aadhaar, Passport, PAN Card, or Driver's License
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-accent/20 bg-accent/5 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Lock className="w-5 h-5 text-accent mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-accent">Privacy & Security Promise</p>
                    <p className="text-sm text-muted-foreground">
                      🔒 We use AI to extract and verify only name, DOB, and college information.
                      <br />
                      🗂️ Original documents are encrypted and deleted after verification.
                      <br />
                      ⚡ Process typically takes less than 24 hours.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => setCurrentStep(2)}
              variant="coral"
              className="w-full rounded-xl h-12 font-semibold"
            >
              Start Verification Process
              <Shield className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                Upload Documents 📋
              </h2>
              <p className="text-muted-foreground font-prompt text-lg">
                Upload clear photos of both documents
              </p>
            </div>

            {/* College ID Upload */}
            <Card className="border-2 border-primary/20 shadow-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center">
                  <FileCheck className="w-5 h-5 mr-2 text-primary" />
                  College ID Card
                  {collegeIdFile && <CheckCircle className="w-5 h-5 ml-2 text-success animate-pulse" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {collegeIdFile ? (
                  <div className="flex items-center justify-between p-4 bg-success/10 rounded-xl border-2 border-success/20 shadow-soft">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-6 h-6 text-success" />
                      <div>
                        <p className="font-medium text-success">{collegeIdFile.name}</p>
                        <p className="text-xs text-muted-foreground">Successfully uploaded</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCollegeIdFile(null)}
                      className="text-muted-foreground hover:text-foreground rounded-lg"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'college');
                      }}
                      className="hidden"
                      disabled={isLoading}
                    />
                    <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors hover:bg-primary/5">
                      <Camera className="w-10 h-10 mx-auto mb-3 text-primary" />
                      <p className="font-semibold mb-1 text-primary">Upload College ID</p>
                      <p className="text-sm text-muted-foreground">
                        JPG, PNG up to 10MB • Make sure text is clearly visible
                      </p>
                    </div>
                  </label>
                )}
              </CardContent>
            </Card>

            {/* Government ID Upload */}
            <Card className="border-2 border-secondary/20 shadow-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-secondary" />
                  Government ID
                  {govtIdFile && <CheckCircle className="w-5 h-5 ml-2 text-success animate-pulse" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {govtIdFile ? (
                  <div className="flex items-center justify-between p-4 bg-success/10 rounded-xl border-2 border-success/20 shadow-soft">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-6 h-6 text-success" />
                      <div>
                        <p className="font-medium text-success">{govtIdFile.name}</p>
                        <p className="text-xs text-muted-foreground">Successfully uploaded</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setGovtIdFile(null)}
                      className="text-muted-foreground hover:text-foreground rounded-lg"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'govt');
                      }}
                      className="hidden"
                      disabled={isLoading}
                    />
                    <div className="border-2 border-dashed border-secondary/30 rounded-xl p-8 text-center cursor-pointer hover:border-secondary/50 transition-colors hover:bg-secondary/5">
                      <Upload className="w-10 h-10 mx-auto mb-3 text-secondary" />
                      <p className="font-semibold mb-1 text-secondary">Upload Government ID</p>
                      <p className="text-sm text-muted-foreground">
                        Aadhaar, Passport, PAN, or DL • Ensure details are readable
                      </p>
                    </div>
                  </label>
                )}
              </CardContent>
            </Card>

            {collegeIdFile && govtIdFile && (
              <div className="animate-fade-in">
                <Card className="border-2 border-success/20 bg-success/5 shadow-card">
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
                    <p className="font-medium text-success mb-1">
                      Both documents uploaded successfully!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ready to proceed to review
                    </p>
                  </CardContent>
                </Card>
                
                <Button
                  onClick={() => setCurrentStep(3)}
                  variant="coral"
                  className="w-full rounded-xl h-12 font-semibold mt-4"
                >
                  Continue to Review
                  <FileCheck className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {isLoading && (
              <div className="text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground font-prompt">
                  Uploading document...
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                Review & Submit 🚀
              </h2>
              <p className="text-muted-foreground font-prompt text-lg">
                Review your documents before submission
              </p>
            </div>

            <div className="space-y-4">
              <Card className="border-2 border-success/20 shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-6 h-6 text-success" />
                      <div>
                        <p className="font-semibold text-success">College ID</p>
                        <p className="text-sm text-muted-foreground">
                          {collegeIdFile?.name}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-success text-success bg-success/10">
                      ✅ Ready
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-success/20 shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-6 h-6 text-success" />
                      <div>
                        <p className="font-semibold text-success">Government ID</p>
                        <p className="text-sm text-muted-foreground">
                          {govtIdFile?.name}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-success text-success bg-success/10">
                      ✅ Ready
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-primary/20 bg-gradient-card shadow-card">
              <CardContent className="p-6 text-center space-y-3">
                <Shield className="w-8 h-8 mx-auto text-primary" />
                <p className="text-lg font-semibold text-primary">
                  AI Verification Process
                </p>
                <p className="text-sm text-muted-foreground">
                  Our advanced AI will verify your identity by comparing your documents
                  and extracting key information. You'll be notified once approved.
                </p>
                <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span>Usually takes 2-24 hours</span>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSubmitVerification}
              variant="coral"
              className="w-full rounded-xl h-12 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting for Verification...
                </>
              ) : (
                <>
                  Submit for Verification
                  <Shield className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            {isLoading && (
              <div className="text-center space-y-3 animate-fade-in">
                <Progress value={66} className="h-2" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-primary">
                    Processing documents with AI...
                  </p>
                  <p className="text-xs text-muted-foreground font-prompt">
                    Extracting and verifying information securely
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="container mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={currentStep === 1 ? onBack : () => setCurrentStep(currentStep - 1)}
            className="hover:bg-white/20 transition-smooth"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
            <div className="w-24 h-2 bg-muted/50 rounded-full mt-1">
              <div 
                className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </div>

        {/* Content */}
        <Card className="shadow-card border-0 bg-gradient-card backdrop-blur-sm">
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Skip Button */}
        {onSkip && (
          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={onSkip} className="text-muted-foreground hover:text-primary">
              Skip verification - I'll do this later
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IDVerificationFlow;