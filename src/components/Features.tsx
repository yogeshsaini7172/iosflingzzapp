import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Zap, Heart, MessageCircle, Trophy } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime guarantee for your peace of mind."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Built-in tools for seamless team communication and project management."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized performance with cutting-edge technology for maximum speed."
    },
    {
      icon: Heart,
      title: "User-Friendly",
      description: "Intuitive design that your team will love to use every single day."
    },
    {
      icon: MessageCircle,
      title: "24/7 Support",
      description: "Round-the-clock customer support to help you whenever you need it."
    },
    {
      icon: Trophy,
      title: "Award Winning",
      description: "Recognized by industry leaders for excellence in innovation and design."
    }
  ];

  return (
    <section id="features" className="py-24 bg-gradient-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Why Choose WebFlow?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help your business grow and succeed in the digital world.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="relative group hover:shadow-medium transition-smooth bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-glow transition-smooth">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;