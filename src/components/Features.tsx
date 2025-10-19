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
    <section id="features" className="relative py-32 overflow-hidden">
      {/* Premium background with mesh gradient */}
      <div className="absolute inset-0 mesh-gradient opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      
      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="text-center mb-20 animate-fade-in">
          <h2 className="text-5xl lg:text-7xl font-bold mb-6 gradient-text tracking-tight">
            Why Choose WebFlow?
          </h2>
          <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Powerful features designed to help your business grow and succeed in the digital world.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="relative overflow-hidden animate-elegant-entrance"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="text-center pb-6 relative z-10">
                <div className="relative w-20 h-20 mx-auto mb-6 group-hover:scale-110 transition-elegant">
                  <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-elegant" />
                  <div className="relative w-full h-full bg-gradient-primary rounded-3xl flex items-center justify-center shadow-elegant group-hover:shadow-glow">
                    <feature.icon className="w-10 h-10 text-white" strokeWidth={1.5} />
                  </div>
                </div>
                <CardTitle className="text-2xl mb-3">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center relative z-10">
                <CardDescription className="text-base text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
              
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-smooth shimmer pointer-events-none" />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;