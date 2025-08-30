import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 bg-gradient-hero relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-white/5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 max-w-4xl mx-auto">
          <CardContent className="text-center py-16 px-8">
            <div className="inline-flex items-center gap-2 bg-secondary/20 text-white px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Trusted by 500+ Businesses</span>
            </div>
            
            <h2 className="text-4xl lg:text-6xl font-bold mb-6 text-white leading-tight">
              Your Success
              <br />
              <span className="bg-gradient-to-r from-white to-secondary bg-clip-text text-transparent">
                Starts Here
              </span>
            </h2>
            
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Ready to transform your business? Let's build something amazing together. Get started today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button variant="hero" size="lg" className="text-lg px-8 py-4 bg-white text-primary hover:bg-white/90">
                <div className="flex items-center">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </div>
              </Button>
              <Button variant="ghost-white" size="lg" className="text-lg px-8 py-4">
                View Portfolio
              </Button>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-8 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>Free Consultation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>Expert Team</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>24/7 Support</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CTA;