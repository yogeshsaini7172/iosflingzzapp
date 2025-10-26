import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PremiumBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "secondary" | "success" | "accent";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  pulse?: boolean;
  className?: string;
}

const PremiumBadge = ({ 
  children, 
  variant = "default", 
  size = "md", 
  icon: Icon,
  pulse = false,
  className 
}: PremiumBadgeProps) => {
  const variants = {
    default: "bg-gradient-to-br from-card/80 to-card/60 border-border/50 text-foreground",
    primary: "bg-gradient-primary border-primary/40 text-primary-foreground shadow-elegant",
    secondary: "bg-gradient-secondary border-secondary/40 text-secondary-foreground shadow-elegant",
    success: "bg-gradient-to-br from-success to-success/80 border-success/40 text-success-foreground shadow-elegant",
    accent: "bg-gradient-to-br from-accent to-accent/80 border-accent/40 text-accent-foreground shadow-elegant",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-3",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className={cn(
      "inline-flex items-center rounded-full border backdrop-blur-sm font-semibold tracking-wide transition-elegant hover:scale-105 cursor-default",
      variants[variant],
      sizes[size],
      pulse && "animate-pulse-glow",
      className
    )}>
      {Icon && (
        <div className="relative">
          {pulse && (
            <div className={cn(
              "absolute inset-0 blur-md opacity-50 animate-pulse",
              variant === "primary" && "bg-primary-glow",
              variant === "secondary" && "bg-secondary-glow",
              variant === "success" && "bg-success",
              variant === "accent" && "bg-accent-glow"
            )} />
          )}
          <Icon className={cn("relative", iconSizes[size])} strokeWidth={2.5} />
        </div>
      )}
      <span>{children}</span>
    </div>
  );
};

export { PremiumBadge };
