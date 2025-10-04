import { Button } from "@/components/ui/button";
import { Heart, Shield, Sparkles, Users, CheckCircle2 } from "lucide-react";

interface WebLandingPageProps {
  onEnterApp: () => void;
}

export const WebLandingPage = ({ onEnterApp }: WebLandingPageProps) => {
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

          {/* Footer Note */}
          <p className="text-sm text-muted-foreground pt-8">
            Available on Web and Android • Premium dating for exceptional individuals
          </p>
        </div>
      </div>
    </div>
  );
};
