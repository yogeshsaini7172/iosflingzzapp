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

  const removeImage = (index: number) => {
    const newImages = data.profileImages.filter((_, i) => i !== index);
    updateField('profileImages', newImages);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <Camera className="w-12 h-12 text-primary mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-2">Show Your Best Self ✨</h3>
        <p className="text-muted-foreground">Upload up to 6 photos that represent you</p>
      </div>

      {/* Photo Upload Grid */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square bg-gradient-card rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center relative overflow-hidden hover:border-primary/50 transition-smooth hover:shadow-soft"
          >
            {data.profileImages[index] ? (
              <>
                <img
                  src={URL.createObjectURL(data.profileImages[index])}
                  alt={`Profile ${index + 1}`}
                  className="w-full h-full object-cover rounded-xl"
                />
                <Button
                  onClick={() => removeImage(index)}
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 rounded-full w-6 h-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center p-4 text-center w-full h-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  multiple
                />
                <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground font-medium">
                  {index === 0 ? "Main Photo" : `Photo ${index + 1}`}
                </span>
              </label>
            )}
          </div>
        ))}
      </div>

      {/* Photo Tips */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">Photo Tips:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use clear, high-quality photos</li>
            <li>• Show your face clearly in the first photo</li>
            <li>• Include full-body shots and close-ups</li>
            <li>• Show your interests and personality</li>
            <li>• Avoid group photos where it's hard to identify you</li>
          </ul>
        </CardContent>
      </Card>

      {/* Profile Visibility Setting */}
      <Card className="border-2 border-primary/20 bg-gradient-card shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                {data.isProfilePublic ? 
                  <Eye className="w-4 h-4 text-success" /> : 
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                }
                <Label htmlFor="public-profile" className="font-medium">
                  Make profile visible to others?
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {data.isProfilePublic 
                  ? "Your profile will be visible to other verified students for matching" 
                  : "Your profile will be private until you manually enable visibility"
                }
              </p>
            </div>
            <Switch
              id="public-profile"
              checked={data.isProfilePublic}
              onCheckedChange={(checked) => updateField('isProfilePublic', checked)}
              className="data-[state=checked]:bg-success"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadPhotosStep;