import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg"></div>
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent" title="datingSigma - Elite College Dating">
            datingSigma
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-smooth">
            Services
          </a>
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-smooth">
            Features
          </a>
          <a href="#about" className="text-muted-foreground hover:text-foreground transition-smooth">
            About
          </a>
        </nav>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            Contact
          </Button>
          <Button variant="hero" size="sm">
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;