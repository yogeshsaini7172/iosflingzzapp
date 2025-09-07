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
    <div className="space-y-6 animate-fade-in pb-6">
      <div className="text-center mb-6">
        <Camera className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-3">Show Your Best Self ✨</h3>
        <p className="text-muted-foreground text-lg">Upload up to 6 photos that represent you</p>
      </div>

      {/* Mobile-Optimized Photo Upload Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[3/4] bg-gradient-card rounded-2xl border-2 border-dashed border-border/50 flex items-center justify-center relative overflow-hidden hover:border-primary/50 transition-smooth hover:shadow-soft touch-manipulation"
          >
            {data.profileImages[index] ? (
              <>
                <img
                  src={URL.createObjectURL(data.profileImages[index])}
                  alt={`Profile ${index + 1}`}
                  className="w-full h-full object-cover rounded-2xl"
                />
                <Button
                  onClick={() => removeImage(index)}
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 rounded-full w-8 h-8 p-0 touch-manipulation shadow-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 bg-primary/90 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Main
                  </div>
                )}
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center p-3 text-center w-full h-full justify-center touch-manipulation">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  multiple
                />
                <Camera className="w-10 h-10 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground font-medium text-center leading-tight">
                  {index === 0 ? "Main Photo" : `Photo ${index + 1}`}
                </span>
              </label>
            )}
          </div>
        ))}
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