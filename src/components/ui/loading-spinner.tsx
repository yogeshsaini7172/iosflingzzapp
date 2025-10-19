import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
}

const LoadingSpinner = ({ size = "md", className, text }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        {/* Outer glow ring */}
        <div className={cn(
          "absolute inset-0 rounded-full bg-gradient-primary opacity-30 blur-xl animate-pulse",
          sizeClasses[size]
        )} />
        
        {/* Main spinning ring */}
        <div className={cn(
          "relative rounded-full border-4 border-primary/20 border-t-primary animate-spin",
          sizeClasses[size]
        )} />
        
        {/* Inner spinning ring (opposite direction) */}
        <div className={cn(
          "absolute inset-2 rounded-full border-2 border-secondary/20 border-b-secondary animate-spin",
          "animation-direction-reverse"
        )} 
        style={{ animationDuration: '1.5s' }} />
        
        {/* Center dot with pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-gradient-primary rounded-full animate-pulse shadow-glow" />
        </div>
      </div>
      
      {text && (
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export { LoadingSpinner };
