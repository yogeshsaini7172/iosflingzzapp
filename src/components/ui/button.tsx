import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 ease-elegant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transform-gpu touch-feedback pwa-ready",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground hover:shadow-glow hover:scale-105 shadow-elegant active:scale-98 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft hover:shadow-medium active:scale-98",
        outline:
          "border-2 border-primary/30 bg-background/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/50 hover:shadow-soft active:scale-98",
        secondary:
          "bg-gradient-secondary text-secondary-foreground hover:shadow-romantic hover:scale-105 shadow-soft active:scale-98",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground rounded-xl active:scale-98 backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline active:scale-98",
        hero: "bg-gradient-hero text-white hover:shadow-premium hover:scale-105 transition-luxury shadow-royal border-0 font-bold active:scale-98 relative overflow-hidden",
        "ghost-white": "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md rounded-xl active:scale-98 shadow-soft",
        premium: "bg-gradient-royal text-white hover:shadow-glow hover:scale-105 transition-luxury shadow-premium border-0 font-bold relative overflow-hidden active:scale-98 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-1000",
        neon: "bg-primary/5 text-primary border-2 border-primary/50 hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-glow backdrop-blur-sm font-bold active:scale-98 transition-all duration-500",
        glass: "glass-premium text-foreground hover:bg-white/10 hover:shadow-elegant active:scale-98",
        gold: "bg-gradient-gold text-card hover:shadow-gold hover:scale-105 shadow-soft active:scale-98 font-bold",
      },
      size: {
        default: "h-11 px-5 py-2.5 min-w-[44px]", // Instagram-like minimum touch target
        sm: "h-9 rounded-lg px-3 text-xs min-w-[36px]",
        lg: "h-14 rounded-xl px-8 text-base min-w-[56px]",
        xl: "h-16 rounded-2xl px-10 text-lg min-w-[64px]",
        icon: "h-11 w-11 rounded-xl min-w-[44px] min-h-[44px]", // iOS minimum touch target
        "icon-sm": "h-9 w-9 rounded-lg min-w-[36px] min-h-[36px]",
        "icon-lg": "h-14 w-14 rounded-xl min-w-[56px] min-h-[56px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
