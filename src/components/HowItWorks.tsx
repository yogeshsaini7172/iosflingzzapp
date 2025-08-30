import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, MessageSquare, Settings, Rocket, Trophy } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: MessageSquare,
      title: "Consultation",
      description: "We start with a detailed consultation to understand your business needs and goals.",
      step: "01"
    },
    {
      icon: Settings,
      title: "Custom Planning",
      description: "Our team creates a tailored strategy and roadmap specifically for your project.",
      step: "02"
    },
    {
      icon: Rocket,
      title: "Development",
      description: "We build your solution using cutting-edge technology and best practices.",
      step: "03"
    },
    {
      icon: Trophy,
      title: "Launch & Support",
      description: "We launch your project and provide ongoing support to ensure continued success.",
      step: "04"
    }
  ];

  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            How We <span className="bg-gradient-primary bg-clip-text text-transparent">Work</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our proven process ensures your project is delivered on time, on budget, and exceeds expectations.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="relative text-center group hover:shadow-medium transition-smooth border-border/50">
              <CardHeader className="pb-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:shadow-glow transition-smooth">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <CardTitle className="text-lg mb-2">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  {step.description}
                </CardDescription>
              </CardContent>
              
              {/* Connector Arrow */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/30">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              )}
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Free Consultation Available</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;