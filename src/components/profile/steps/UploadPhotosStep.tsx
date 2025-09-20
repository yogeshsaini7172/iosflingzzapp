import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, X, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadPhotosStepProps {
  data: any;
  onChange: (data: any) => void;
}

const UploadPhotosStep = ({ data, onChange }: UploadPhotosStepProps) => {
  const { toast } = useToast();

  const updateField = (field: string, value: any) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (data.profileImages.length + files.length > 6) {
      toast({
        title: "Too many images",
        description: "You can upload maximum 6 images",
        variant: "destructive"
      });
      return;
    }
    updateField('profileImages', [...data.profileImages, ...files]);
  };

  const removeImage = () => {
    updateField('profileImages', []);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-6">
      <div className="text-center mb-6">
        <Camera className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-3">Show Your Best Self ✨</h3>
        <p className="text-muted-foreground text-lg">Upload your main profile photo</p>
      </div>
      <div className="flex flex-col items-center gap-4">
        <label htmlFor="main-photo-upload" className="cursor-pointer">
          {data.profileImages[0] ? (
            <img
              src={URL.createObjectURL(data.profileImages[0])}
              alt="Main Profile"
              className="w-40 h-40 rounded-full object-cover border-4 border-primary shadow"
            />
          ) : (
            <div className="w-40 h-40 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-primary">
              <Camera className="w-14 h-14 text-primary" />
            </div>
          )}
          <input
            id="main-photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={!!data.profileImages[0]}
          />
        </label>
        <span className="text-lg font-semibold mt-2">Main Photo</span>
        <span className="text-sm text-muted-foreground">Upload only 1 photo as your main profile image</span>
        {data.profileImages[0] && (
          <Button size="sm" variant="destructive" onClick={() => removeImage()}>
            Remove Photo
          </Button>
        )}
      </div>
      {/* Mobile-Optimized Photo Tips */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <h4 className="font-semibold mb-3 text-lg">Photo Tips 📸</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start space-x-2">
              <span className="text-primary">•</span>
              <span>Use clear, high-quality photos</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary">•</span>
              <span>Show your face clearly in the first photo</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary">•</span>
              <span>Include full-body shots and close-ups</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary">•</span>
              <span>Show your interests and personality</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-primary">•</span>
              <span>Avoid group photos where it's hard to identify you</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Mobile-Optimized Profile Visibility Setting */}
      <Card className="border-2 border-primary/20 bg-gradient-card shadow-card">
        <CardContent className="p-5">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {data.isProfilePublic ? 
                <Eye className="w-5 h-5 text-success" /> : 
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              }
              <div className="flex-1">
                <Label htmlFor="public-profile" className="font-semibold text-base">
                  Make profile visible to others?
                </Label>
              </div>
              <Switch
                id="public-profile"
                checked={data.isProfilePublic}
                onCheckedChange={(checked) => updateField('isProfilePublic', checked)}
                className="data-[state=checked]:bg-success scale-110"
              />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed pl-8">
              {data.isProfilePublic 
                ? "Your profile will be visible to other verified students for matching" 
                : "Your profile will be private until you manually enable visibility"
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadPhotosStep;