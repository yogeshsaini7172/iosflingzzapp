import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-hero opacity-90"></div>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-white/5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left text-white">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Find Your
              <br />
              <span className="bg-gradient-to-r from-white to-secondary bg-clip-text text-transparent">
                Campus Match
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl mb-8 text-white/90 max-w-lg">
              Connect with fellow students at your college. Verify with your .edu email and start meaningful connections today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="lg" className="text-lg px-8 py-4">
                <a href="/auth">Start Matching</a>
              </Button>
              <Button variant="ghost-white" size="lg" className="text-lg px-8 py-4">
                Learn More
              </Button>
            </div>
            
            <div className="mt-12 flex items-center gap-8 justify-center lg:justify-start text-white/80">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">50K+</div>
                <div className="text-sm">Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-sm">Colleges</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">10K+</div>
                <div className="text-sm">Matches</div>
              </div>
            </div>
          </div>
          
          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="relative z-10 animate-float">
              <img 
                src={heroImage} 
                alt="College students using GradSync dating app" 
                className="w-full max-w-lg mx-auto rounded-3xl shadow-glow"
              />
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-secondary/20 rounded-full animate-pulse-glow"></div>
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-accent/20 rounded-full animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>
      
      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" className="w-full h-auto text-background">
          <path fill="currentColor" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default Hero;