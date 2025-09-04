import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Upload, FileCheck, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IDVerificationStepProps {
  data: any;
  onChange: (data: any) => void;
  onVerificationStatusChange?: (status: 'idle' | 'pending' | 'verified' | 'failed', details?: any) => void;
}

const IDVerificationStep = ({ data, onChange, onVerificationStatusChange }: IDVerificationStepProps) => {
  const [collegeIdFile, setCollegeIdFile] = useState<File | null>(data.collegeIdFile);
  const [govtIdFile, setGovtIdFile] = useState<File | null>(data.govtIdFile);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleCollegeIdUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      setCollegeIdFile(file);
      onChange({ ...data, collegeIdFile: file });
      toast({
        title: "College ID uploaded!",
        description: "Your college ID has been uploaded successfully"
      });
    }
  };

  const handleGovtIdUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large", 
          description: "Please select a file smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      setGovtIdFile(file);
      onChange({ ...data, govtIdFile: file });
      toast({
        title: "Government ID uploaded!",
        description: "Your government ID has been uploaded successfully"
      });
    }
  };

const handleSubmitVerification = async () => {
  if (!govtIdFile) {
    toast({
      title: "Government ID required",
      description: "Please upload a government ID to verify.",
      variant: "destructive"
    });
    return;
  }

  try {
    setIsUploading(true);

    const formData = new FormData();
    formData.append('govt_id', govtIdFile);
    if (collegeIdFile) formData.append('secondary_id', collegeIdFile);

    const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
    if (fullName) formData.append('signup_name', fullName);
    if (data.dateOfBirth) formData.append('signup_dob', data.dateOfBirth);

    const demoUserId = localStorage.getItem('demoUserId');
    if (demoUserId) formData.append('user_id', demoUserId);

    onVerificationStatusChange?.('pending');

    const res = await fetch('https://cchvsqeqiavhanurnbeo.functions.supabase.co/id-verification', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjaHZzcWVxaWF2aGFudXJuYmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MjI4OTMsImV4cCI6MjA3MjA5ODg5M30.6EII7grfX9gCUx6haU2wIfoiMDPrFTQn2XMDi6cY5-U'
      },
      body: formData
    });

    const result = await res.json();

    if (result.status === 'verified') {
      toast({
        title: "Verified ✅",
        description: "Your ID has been successfully verified."
      });
      onVerificationStatusChange?.('verified', result);
    } else {
      toast({
        title: "Verification failed",
        description: result.reason || "Please re-upload clear photos and try again.",
        variant: "destructive"
      });
      onVerificationStatusChange?.('failed', result);
    }
  } catch (error: any) {
    console.error('Verification error:', error);
    toast({
      title: "Verification error",
      description: error.message || "Something went wrong. Please try again.",
      variant: "destructive"
    });
    onVerificationStatusChange?.('failed');
  } finally {
    setIsUploading(false);
  }
};

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-2">Identity Verification</h3>
        <p className="text-muted-foreground">Help us keep our community safe and authentic</p>
      </div>

      {/* Why Verification */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2 flex items-center">
            <Shield className="w-4 h-4 mr-2 text-primary" />
            Why we verify identities
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Ensures authentic college student community</li>
            <li>• Reduces fake profiles and catfishing</li>
            <li>• Creates a safer dating environment</li>
            <li>• Builds trust between users</li>
          </ul>
        </CardContent>
      </Card>

      {/* College ID Upload */}
      <Card className="border-2 border-dashed border-border/50 hover:border-primary/50 transition-smooth">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <FileCheck className="w-6 h-6 text-primary" />
              <h4 className="font-medium">College ID Card</h4>
              {collegeIdFile && (
                <Badge className="bg-success text-success-foreground">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Uploaded
                </Badge>
              )}
            </div>
            
            {collegeIdFile ? (
              <div className="space-y-2">
                <p className="text-sm text-success font-medium">
                  ✓ {collegeIdFile.name}
                </p>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => {
                     setCollegeIdFile(null);
                     onChange({ ...data, collegeIdFile: null });
                   }}
                 >
                  Replace File
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Upload a clear photo of your student ID card
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleCollegeIdUpload}
                    className="hidden"
                  />
                  <Button variant="outline" className="rounded-xl" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload College ID
                    </span>
                  </Button>
                </label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Government ID Upload */}
      <Card className="border-2 border-dashed border-border/50 hover:border-primary/50 transition-smooth">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <FileCheck className="w-6 h-6 text-primary" />
              <h4 className="font-medium">Government ID (Optional)</h4>
              {govtIdFile && (
                <Badge className="bg-success text-success-foreground">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Uploaded
                </Badge>
              )}
            </div>
            
            {govtIdFile ? (
              <div className="space-y-2">
                <p className="text-sm text-success font-medium">
                  ✓ {govtIdFile.name}
                </p>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => {
                     setGovtIdFile(null);
                     onChange({ ...data, govtIdFile: null });
                   }}
                 >
                  Replace File
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Driver's license, passport, or national ID card
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleGovtIdUpload}
                    className="hidden"
                  />
                  <Button variant="outline" className="rounded-xl" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Government ID
                    </span>
                  </Button>
                </label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="font-medium text-orange-800">Important Notes</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• All personal information is encrypted and secure</li>
                <li>• Verification typically takes 1-2 business days</li>
                <li>• You can use the app while verification is pending</li>
                <li>• We never share your documents with other users</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      {(collegeIdFile || govtIdFile) && (
        <Card className="border-primary/20 bg-gradient-card">
          <CardContent className="p-4 text-center">
            <Button
              onClick={handleSubmitVerification}
              disabled={isUploading}
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {isUploading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting Documents...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Submit for Verification</span>
                </div>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              You can continue using the app while we review your documents
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IDVerificationStep;