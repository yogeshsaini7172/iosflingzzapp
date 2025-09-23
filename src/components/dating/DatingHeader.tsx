import { Button } from "@/components/ui/button";
import flingzzLogo from "@/assets/flingzz-logo.jpg";

const DatingHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={flingzzLogo} alt="FLINGZZ Logo" className="w-8 h-8 rounded-lg" />
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            FLINGZZ
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="#discover" className="text-muted-foreground hover:text-foreground transition-smooth">
            Discover
          </a>
          <a href="#matches" className="text-muted-foreground hover:text-foreground transition-smooth">
            Matches
          </a>
          <a href="#safety" className="text-muted-foreground hover:text-foreground transition-smooth">
            Safety
          </a>
        </nav>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            Help
          </Button>
          <Button variant="hero" size="sm">
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DatingHeader;