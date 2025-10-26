import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 px-4">
      {/* Premium animated mesh gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-48 w-[500px] h-[500px] bg-gradient-primary opacity-25 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-48 w-[500px] h-[500px] bg-gradient-secondary opacity-25 rounded-full blur-3xl floating" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-royal opacity-15 rounded-full blur-3xl animate-pulse-glow" />
        
        {/* Additional ambient orbs */}
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-accent-glow/20 rounded-full blur-3xl floating" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-secondary-glow/20 rounded-full blur-3xl floating" style={{ animationDelay: '2s' }} />
      </div>

      {/* Premium glass container with enhanced effects */}
      <div className="relative glass-premium rounded-[2rem] p-8 md:p-16 lg:p-20 max-w-6xl mx-auto text-center shadow-premium backdrop-blur-2xl border border-primary/30 animate-elegant-entrance overflow-hidden">
        {/* Animated border glow */}
        <div className="absolute inset-0 rounded-[2rem] opacity-50 animate-pulse-glow pointer-events-none">
          <div className="absolute inset-0 rounded-[2rem] border border-primary-glow/50" />
        </div>

        {/* Shimmer effect */}
        <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
          <div className="shimmer" />
        </div>

        <div className="relative z-10">
          {/* Floating premium badge */}
          <div className="inline-flex items-center gap-3 px-8 py-3 rounded-full glass-effect border border-primary/40 mb-10 animate-bounce-in shadow-elegant hover:shadow-glow transition-elegant hover:scale-105 cursor-default">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary blur-md opacity-50 animate-pulse" />
              <div className="relative w-2.5 h-2.5 bg-gradient-primary rounded-full" />
            </div>
            <span className="text-sm md:text-base font-bold gradient-text tracking-wide">Premium Dating Experience</span>
          </div>

          {/* Main heading with sophisticated gradient text */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight leading-[1.1]">
            <span className="block bg-gradient-elegant bg-clip-text text-transparent mb-2 animate-fade-in">
              Find Your
            </span>
            <span className="block bg-gradient-primary bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Perfect Match
            </span>
          </h1>

          {/* Premium description with better spacing */}
          <p className="text-lg md:text-xl lg:text-2xl text-foreground/80 max-w-3xl mx-auto mb-14 leading-relaxed font-clean animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Experience luxury dating powered by AI. Connect with verified university students in an exclusive, premium environment.
          </p>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Button 
              size="lg" 
              variant="premium"
              className="group relative overflow-hidden px-10 py-7 text-lg font-bold rounded-2xl shadow-elegant hover:shadow-glow hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Your Journey
                <span className="group-hover:translate-x-1 transition-elegant">→</span>
              </span>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="px-10 py-7 text-lg font-bold rounded-2xl border-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-elegant hover:shadow-medium hover:scale-105"
            >
              Learn More
            </Button>
          </div>

          {/* Premium trust indicators with enhanced styling */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-muted-foreground/90 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl glass-effect hover:scale-105 transition-elegant cursor-default">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary blur-sm opacity-50" />
                <div className="relative w-3 h-3 bg-gradient-primary rounded-full shadow-elegant" />
              </div>
              <span className="text-sm md:text-base font-semibold">10K+ Verified Users</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl glass-effect hover:scale-105 transition-elegant cursor-default">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-secondary blur-sm opacity-50" />
                <div className="relative w-3 h-3 bg-gradient-secondary rounded-full shadow-elegant" />
              </div>
              <span className="text-sm md:text-base font-semibold">500+ Universities</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl glass-effect hover:scale-105 transition-elegant cursor-default">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-gold blur-sm opacity-50" />
                <div className="relative w-3 h-3 bg-gradient-gold rounded-full shadow-elegant" />
              </div>
              <span className="text-sm md:text-base font-semibold">100% Private & Secure</span>
            </div>
          </div>
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-primary opacity-20 blur-3xl rounded-br-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-secondary opacity-20 blur-3xl rounded-tl-full pointer-events-none" />
      </div>

      {/* Enhanced bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />
    </section>
  );
};

export default Hero;