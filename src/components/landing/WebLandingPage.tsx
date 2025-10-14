import { Button } from "@/components/ui/button";
import { Heart, Shield, Sparkles, Users, CheckCircle2, Target, Zap, Award } from "lucide-react";
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
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Logo/Title */}
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-7xl md:text-9xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              FLINGZZ
            </h1>
            <p className="text-2xl md:text-3xl text-foreground font-semibold">
              Where Quality Meets Connection
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Premium dating platform designed for exceptional individuals seeking meaningful relationships through intelligent matching and verified profiles.
            </p>
          </div>

          {/* Main CTA */}
          <div className="py-6">
            <Button
              onClick={onEnterApp}
              size="lg"
              className="text-xl px-16 py-8 h-auto bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300 transform hover:scale-105 shadow-elegant"
            >
              Try Web View
            </Button>
          </div>

          {/* Store Buttons */}
          <div className="pt-4 pb-12">
            <p className="text-sm text-muted-foreground mb-4">Download Our Mobile App</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => handleStoreClick("Google Play Store")}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-8 py-6 h-auto flex items-center gap-3 hover:bg-primary/5 transition-colors"
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
                className="w-full sm:w-auto px-8 py-6 h-auto flex items-center gap-3 hover:bg-primary/5 transition-colors"
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
        </div>
      </div>

      {/* About Us Section */}
      <div className="bg-card/30 backdrop-blur-sm border-y border-border">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                About FLINGZZ
              </h2>
              <p className="text-xl text-muted-foreground">
                Redefining Modern Dating Through Innovation
              </p>
            </div>

            <div className="prose prose-lg mx-auto text-center">
              <p className="text-lg text-foreground/90 leading-relaxed">
                FLINGZZ is more than just a dating app—it's a revolution in how people connect. 
                Born from the vision to create authentic, meaningful relationships in a digital world, 
                we've built a platform that prioritizes quality, safety, and genuine compatibility.
              </p>
              <p className="text-lg text-foreground/90 leading-relaxed mt-6">
                Our advanced Quality Compatibility Score (QCS) algorithm analyzes multiple dimensions 
                of compatibility, from shared interests to lifestyle preferences, ensuring that every 
                match has real potential. We believe that exceptional people deserve an exceptional 
                dating experience.
              </p>
            </div>

            {/* Mission & Values */}
            <div className="grid md:grid-cols-3 gap-8 pt-8">
              <div className="text-center space-y-4 p-6 rounded-2xl bg-background/50">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Our Mission</h3>
                <p className="text-muted-foreground">
                  To facilitate genuine connections by combining cutting-edge technology with 
                  human-centered design, creating a safe space for authentic relationships.
                </p>
              </div>

              <div className="text-center space-y-4 p-6 rounded-2xl bg-background/50">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Innovation First</h3>
                <p className="text-muted-foreground">
                  We continuously evolve our AI-powered matching algorithms and features to 
                  provide the most advanced and effective dating experience available.
                </p>
              </div>

              <div className="text-center space-y-4 p-6 rounded-2xl bg-background/50">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Quality Promise</h3>
                <p className="text-muted-foreground">
                  Every profile is verified, every match is meaningful, and every interaction 
                  is protected by our advanced security and privacy measures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              What Makes Us Different
            </h2>
            <p className="text-xl text-muted-foreground">
              Advanced features designed for exceptional results
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border space-y-4 hover:shadow-elegant transition-all">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-xl text-foreground">Verified Profiles</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every user goes through our rigorous verification process. Connect only with 
                real, verified individuals for peace of mind and authentic interactions.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border space-y-4 hover:shadow-elegant transition-all">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-xl text-foreground">Smart Matching</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our proprietary QCS algorithm analyzes compatibility across multiple dimensions, 
                ensuring higher-quality matches based on your preferences and values.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border space-y-4 hover:shadow-elegant transition-all">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-xl text-foreground">Blind Date Mode</h3>
              <p className="text-muted-foreground leading-relaxed">
                Experience the thrill of mystery with our unique Blind Date feature. 
                Connect based on compatibility scores before revealing profiles.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border space-y-4 hover:shadow-elegant transition-all">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-xl text-foreground">Location Intelligence</h3>
              <p className="text-muted-foreground leading-relaxed">
                Meet people in your area with precision location matching. Expand your radius 
                or discover connections near you effortlessly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-br from-primary/5 to-background border-y border-border">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Why Choose FLINGZZ?
              </h2>
              <p className="text-xl text-muted-foreground">
                Join thousands of successful connections
              </p>
            </div>
            
            <div className="space-y-4">
              {[
                {
                  title: "Quality Over Quantity",
                  desc: "We focus on meaningful matches rather than endless swiping. Every profile is verified and curated."
                },
                {
                  title: "Advanced Compatibility Algorithm",
                  desc: "Our QCS system analyzes 50+ factors to predict relationship compatibility with unprecedented accuracy."
                },
                {
                  title: "Safe & Secure Platform",
                  desc: "Bank-level encryption, ID verification, and 24/7 moderation ensure a safe dating environment."
                },
                {
                  title: "Real-Time Communication",
                  desc: "Instant chat, notifications, and seamless messaging keep you connected when it matters most."
                },
                {
                  title: "Premium Features",
                  desc: "Exclusive tools for serious daters: unlimited swipes, advanced filters, and priority matching."
                },
                {
                  title: "Data-Driven Insights",
                  desc: "Receive personalized suggestions and profile optimization tips based on your activity and preferences."
                }
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-4 p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-colors">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h4>
                    <p className="text-muted-foreground">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Ready to Find Your Match?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join FLINGZZ today and start your journey toward meaningful connections
          </p>
          <Button
            onClick={onEnterApp}
            size="lg"
            className="text-xl px-16 py-8 h-auto bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300 transform hover:scale-105"
          >
            Get Started Now
          </Button>
          <p className="text-sm text-muted-foreground pt-4">
            Available on Web and Mobile • Premium dating for exceptional individuals
          </p>
        </div>
      </div>
    </div>
  );
};
