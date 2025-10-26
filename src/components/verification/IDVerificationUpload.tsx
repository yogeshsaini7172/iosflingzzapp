import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import Loader from '@/components/ui/Loader';
import { supabase } from '@/integrations/supabase/client';

interface IDVerificationUploadProps {
  onVerificationComplete?: (result: any) => void;
}

const IDVerificationUpload: React.FC<IDVerificationUploadProps> = ({
  onVerificationComplete
}) => {
  const [govtId, setGovtId] = useState<File | null>(null);
  const [secondaryId, setSecondaryId] = useState<File | null>(null);
  const [signupName, setSignupName] = useState('');
  const [signupDob, setSignupDob] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const { toast } = useToast();

  const getCurrentUserId = () => {
    return localStorage.getItem("demoUserId") || "11111111-1111-1111-1111-111111111001";
  };

  const handleFileUpload = (file: File, type: 'govt' | 'secondary') => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    if (type === 'govt') {
      setGovtId(file);
    } else {
      setSecondaryId(file);
    }

    toast({
      title: "File uploaded",
      description: `${type === 'govt' ? 'Government' : 'Secondary'} ID uploaded successfully`
    });
  };

  const handleVerification = async () => {
    if (!govtId) {
      toast({
        title: "Government ID required",
        description: "Please upload your government ID",
        variant: "destructive"
      });
      return;
    }

    if (!secondaryId && (!signupName || !signupDob)) {
      toast({
        title: "Additional verification needed",
        description: "Please upload a secondary ID or provide your name and date of birth",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);

    try {
      const formData = new FormData();
      formData.append('govt_id', govtId);
      formData.append('user_id', getCurrentUserId());
      
      if (secondaryId) {
        formData.append('secondary_id', secondaryId);
      } else {
        formData.append('signup_name', signupName);
        formData.append('signup_dob', signupDob);
      }

      const { data, error } = await supabase.functions.invoke('id-verification', {
        body: formData
      });

      if (error) throw error;

      setVerificationResult(data);
      
      if (data.status === 'verified') {
        toast({
          title: "Verification successful! ✅",
          description: "Your identity has been verified successfully"
        });
      } else {
        toast({
          title: "Verification failed",
          description: data.reason || "Please check your documents and try again",
          variant: "destructive"
        });
      }

      onVerificationComplete?.(data);

    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: "Verification error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (verificationResult) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {verificationResult.status === 'verified' ? (
              <CheckCircle className="w-16 h-16 text-green-500" />
            ) : (
              <AlertCircle className="w-16 h-16 text-red-500" />
            )}
          </div>
          <CardTitle className={verificationResult.status === 'verified' ? 'text-green-600' : 'text-red-600'}>
            {verificationResult.status === 'verified' ? 'Verification Successful' : 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {verificationResult.reason}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Government ID</h4>
              <p><strong>Name:</strong> {verificationResult.govt_id?.name || 'Not detected'}</p>
              <p><strong>DOB:</strong> {verificationResult.govt_id?.dob || 'Not detected'}</p>
            </div>
            {verificationResult.secondary_id && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Secondary ID</h4>
                <p><strong>Name:</strong> {verificationResult.secondary_id?.name || 'Not detected'}</p>
                <p><strong>DOB:</strong> {verificationResult.secondary_id?.dob || 'Not detected'}</p>
              </div>
            )}
          </div>
          <Button 
            onClick={() => setVerificationResult(null)} 
            variant="outline" 
            className="w-full"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Shield className="w-12 h-12 text-primary" />
        </div>
        <CardTitle>Identity Verification</CardTitle>
        <CardDescription>
          Upload your government ID and either a secondary ID or provide your details for verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Government ID Upload */}
        <div className="space-y-2">
          <Label htmlFor="govt-id">Government ID (Required)</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            {govtId ? (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>{govtId.name}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setGovtId(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload your government ID (Driver's license, Passport, etc.)
                </p>
                <Input
                  id="govt-id"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'govt');
                  }}
                  className="cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Secondary verification options */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm font-medium">Choose one verification method:</p>
          </div>

          {/* Option 1: Secondary ID */}
          <div className="space-y-2">
            <Label htmlFor="secondary-id">Option 1: Upload Secondary ID</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              {secondaryId ? (
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>{secondaryId.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSecondaryId(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Upload student ID, work ID, or another form of identification
                  </p>
                  <Input
                    id="secondary-id"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'secondary');
                    }}
                    className="cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Option 2: Manual details */}
          {!secondaryId && (
            <>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">OR</p>
              </div>
              <div className="space-y-4">
                <Label>Option 2: Provide your details</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name (as on ID)</Label>
                    <Input
                      id="signup-name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-dob">Date of Birth</Label>
                    <Input
                      id="signup-dob"
                      type="date"
                      value={signupDob}
                      onChange={(e) => setSignupDob(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Verification button */}
        <Button 
          onClick={handleVerification}
          disabled={isVerifying}
          className="w-full"
          size="lg"
        >
          {isVerifying ? (
              <>
                <Loader size={12} className="inline-block mr-2" />
                Verifying...
              </>
            ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Verify Identity
            </>
          )}
        </Button>

        {/* Important notes */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• All uploaded documents are securely processed and not stored</p>
          <p>• Verification typically takes 1-2 minutes</p>
          <p>• Supported formats: JPG, PNG (max 10MB)</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default IDVerificationUpload;