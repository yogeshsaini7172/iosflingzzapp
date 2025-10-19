import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Premium Background Layers */}
      <div className="absolute inset-0 bg-gradient-hero"></div>
      
      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-secondary/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>
      
      {/* Premium Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Ccircle cx='7' cy='7' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="order-2 lg:order-1 text-center lg:text-left text-white glass-premium p-8 rounded-3xl lg:glass-premium lg:p-12 animate-fade-in">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight font-display">
              Build Your
              <br />
              <span className="bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
                Digital Future
              </span>
            </h1>

            <p className="text-lg lg:text-xl mb-10 text-white/80 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Transform your business with our cutting-edge web solutions. Modern design meets powerful functionality.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="premium" size="lg" className="text-lg px-10 py-6 hover-premium">
                Get Started
              </Button>
              <Button variant="glass" size="lg" className="text-lg px-10 py-6">
                Learn More
              </Button>
            </div>

            <div className="mt-12 flex items-center gap-8 justify-center lg:justify-start text-white/80">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-sm">Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">50+</div>
                <div className="text-sm">Clients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">99%</div>
                <div className="text-sm">Success Rate</div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="order-1 lg:order-2 relative">
            <div className="relative z-10 hover-elegant">
              <div className="absolute inset-0 bg-gradient-royal opacity-20 blur-3xl rounded-3xl"></div>
              <img
                src={heroImage}
                alt="Modern web development and digital solutions"
                className="w-full max-w-lg mx-auto rounded-3xl shadow-premium ring-1 ring-white/10 relative z-10"
              />
            </div>
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