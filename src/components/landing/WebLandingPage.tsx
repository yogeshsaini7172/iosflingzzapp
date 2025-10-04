import { Button } from "@/components/ui/button";
import { Heart, Shield, Sparkles, Users, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WebLandingPageProps {
  onEnterApp: () => void;
}

export const WebLandingPage = ({ onEnterApp }: WebLandingPageProps) => {
  const { toast } = useToast();

  const handleStoreClick = (store: string) => {
    toast({
      title: "Coming Soon! 🚀",
      description: `${store} app is launching soon. Stay tuned!`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Logo/Title */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              FLINGZZ
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium">
              Premium Dating Experience
            </p>
          </div>

          {/* Main CTA */}
          <div className="py-8">
            <Button
              onClick={onEnterApp}
              size="lg"
              className="text-lg px-12 py-6 h-auto bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300 transform hover:scale-105"
            >
              Try Web View
            </Button>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-12">
            <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Verified Users</h3>
              <p className="text-sm text-muted-foreground">
                Connect only with verified real people
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Smart Matching</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered compatibility scoring system
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Blind Dates</h3>
              <p className="text-sm text-muted-foreground">
                Exciting mystery matches for adventurous souls
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Location Based</h3>
              <p className="text-sm text-muted-foreground">
                Meet people near you and beyond
              </p>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="pt-16 space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Why Choose FLINGZZ?
            </h2>
            
            <div className="max-w-2xl mx-auto space-y-4 text-left">
              {[
                "Quality over quantity - verified profiles only",
                "Advanced compatibility algorithm",
                "Safe and secure platform",
                "Real-time chat and notifications",
                "Premium features for serious daters",
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-card/30 backdrop-blur-sm">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="pt-12">
            <Button
              onClick={onEnterApp}
              variant="outline"
              size="lg"
              className="text-lg px-12 py-6 h-auto"
            >
              Get Started Now
            </Button>
          </div>

          {/* Store Buttons */}
          <div className="pt-8">
            <p className="text-sm text-muted-foreground mb-4">Find us on</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => handleStoreClick("Google Play Store")}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-8 py-6 h-auto flex items-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                <div className="text-left">
                  <div className="text-xs">GET IT ON</div>
                  <div className="text-sm font-semibold">Google Play</div>
                </div>
              </Button>

              <Button
                onClick={() => handleStoreClick("Apple App Store")}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-8 py-6 h-auto flex items-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                </svg>
                <div className="text-left">
                  <div className="text-xs">Download on the</div>
                  <div className="text-sm font-semibold">App Store</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-sm text-muted-foreground pt-8">
            Available on Web and Android • Premium dating for exceptional individuals
          </p>
        </div>
      </div>
    </div>
  );
};
