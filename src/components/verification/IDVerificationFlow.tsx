import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IDVerificationFlowProps {
  onComplete: () => void;
  onBack: () => void;
}

const IDVerificationFlow = ({ onComplete, onBack }: IDVerificationFlowProps) => {
  const [currentStep, setCurrentStep] = useState<'college' | 'govt' | 'review'>('college');
  const [collegeId, setCollegeId] = useState<File | null>(null);
  const [govtId, setGovtId] = useState<File | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const { toast } = useToast();

  const handleFileUpload = (file: File, type: 'college' | 'govt') => {
    if (type === 'college') {
      setCollegeId(file);
      toast({ title: "College ID uploaded successfully" });
    } else {
      setGovtId(file);
      toast({ title: "Government ID uploaded successfully" });
    }
  };

  const handleSubmitVerification = () => {
    // Simulate OCR processing and verification
    toast({ title: "Documents submitted for verification", description: "We'll review your documents within 24 hours" });
    setVerificationStatus('pending');
    setCurrentStep('review');
  };

  const renderCollegeIdStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Upload College ID</CardTitle>
        <CardDescription>Please upload a clear photo of your student ID card</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          {collegeId ? (
            <div className="space-y-2">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
              <p className="text-sm font-medium">{collegeId.name}</p>
              <p className="text-xs text-muted-foreground">College ID uploaded</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
            </div>
          )}
          <Input
            type="file"
            accept="image/*"
            className="mt-4"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'college')}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button 
            onClick={() => setCurrentStep('govt')} 
            disabled={!collegeId}
            className="flex-1"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderGovtIdStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Upload Government ID</CardTitle>
        <CardDescription>Upload your Aadhaar, PAN, or Driver's License</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          {govtId ? (
            <div className="space-y-2">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
              <p className="text-sm font-medium">{govtId.name}</p>
              <p className="text-xs text-muted-foreground">Government ID uploaded</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
            </div>
          )}
          <Input
            type="file"
            accept="image/*"
            className="mt-4"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'govt')}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentStep('college')} className="flex-1">
            Back
          </Button>
          <Button 
            onClick={handleSubmitVerification} 
            disabled={!govtId}
            className="flex-1"
          >
            Submit for Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderReviewStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Verification Status</CardTitle>
        <CardDescription>Your documents are being reviewed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        {verificationStatus === 'pending' && (
          <div className="space-y-4">
            <Clock className="h-16 w-16 text-amber-500 mx-auto animate-pulse" />
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              Under Review
            </Badge>
            <p className="text-sm text-muted-foreground">
              We're verifying your documents using OCR technology. This usually takes 2-24 hours.
            </p>
          </div>
        )}
        {verificationStatus === 'verified' && (
          <div className="space-y-4">
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
            <Badge variant="default" className="bg-emerald-100 text-emerald-800">
              Verified ✓
            </Badge>
            <p className="text-sm text-muted-foreground">
              Congratulations! Your identity has been verified.
            </p>
          </div>
        )}
        {verificationStatus === 'rejected' && (
          <div className="space-y-4">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
            <Badge variant="destructive">
              Verification Failed
            </Badge>
            <p className="text-sm text-muted-foreground">
              We couldn't verify your documents. Please try uploading clearer images.
            </p>
          </div>
        )}
        <Button onClick={onComplete} className="w-full">
          Continue to Profile Setup
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'college' ? 'bg-primary text-primary-foreground' : 
              ['govt', 'review'].includes(currentStep) ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 rounded ${
              ['govt', 'review'].includes(currentStep) ? 'bg-emerald-500' : 'bg-muted'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'govt' ? 'bg-primary text-primary-foreground' : 
              currentStep === 'review' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
            <div className={`w-16 h-1 rounded ${
              currentStep === 'review' ? 'bg-emerald-500' : 'bg-muted'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'review' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'college' && renderCollegeIdStep()}
        {currentStep === 'govt' && renderGovtIdStep()}
        {currentStep === 'review' && renderReviewStep()}
      </div>
    </div>
  );
};

export default IDVerificationFlow;