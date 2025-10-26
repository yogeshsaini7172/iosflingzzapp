import { cn } from "@/lib/utils";
import Loader from "@/components/ui/Loader";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
}

const sizeMap: Record<string, number> = {
  sm: 20,
  md: 48,
  lg: 64,
  xl: 80,
};

const LoadingSpinner = ({ size = "md", className, text }: LoadingSpinnerProps) => {
  const numericSize = sizeMap[size] ?? sizeMap.md;
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <Loader size={numericSize} />
      {text && (
        <p className="text-sm font-medium text-muted-foreground">{text}</p>
      )}
    </div>
  );
};

export { LoadingSpinner };
