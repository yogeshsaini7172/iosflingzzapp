import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, GraduationCap, Heart, MessageCircle, Verified } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Shield,
      title: "Verified Students Only",
      description: "Connect with verified college students through .edu email or ID verification."
    },
    {
      icon: Users,
      title: "Campus-Based Matching",
      description: "Find matches within your college campus for meaningful local connections."
    },
    {
      icon: GraduationCap,
      title: "Academic Focus",
      description: "Meet people who share your academic interests and career goals."
    },
    {
      icon: Heart,
      title: "Smart Matching",
      description: "Our algorithm considers compatibility, interests, and academic alignment."
    },
    {
      icon: MessageCircle,
      title: "Secure Messaging",
      description: "Safe and private chat system designed for meaningful conversations."
    },
    {
      icon: Verified,
      title: "Graduation Timeline",
      description: "Automatic account management based on your graduation timeline."
    }
  ];

  return (
    <section id="features" className="py-24 bg-gradient-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Why Choose GradSync?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built specifically for college students, with features that understand your academic lifestyle.
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