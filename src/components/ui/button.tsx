import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 ease-elegant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transform-gpu touch-feedback pwa-ready",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground hover:shadow-glow hover:scale-[1.02] shadow-elegant active:scale-[0.98] relative overflow-hidden group before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft hover:shadow-medium active:scale-[0.98] hover:scale-[1.02] transition-all duration-200",
        outline:
          "border-2 border-primary/30 bg-background/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/50 hover:shadow-soft active:scale-[0.98] hover:scale-[1.02] relative overflow-hidden group before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/0 before:via-primary/5 before:to-primary/0 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500",
        secondary:
          "bg-gradient-secondary text-secondary-foreground hover:shadow-romantic hover:scale-[1.02] shadow-soft active:scale-[0.98] relative overflow-hidden group after:absolute after:inset-0 after:bg-gradient-to-t after:from-white/5 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground rounded-xl active:scale-[0.98] backdrop-blur-sm hover:shadow-soft transition-all duration-200",
        link: "text-primary underline-offset-4 hover:underline active:scale-[0.98] relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-gradient-primary after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left",
        hero: "bg-gradient-hero text-white hover:shadow-premium hover:scale-[1.02] transition-luxury shadow-royal border-0 font-bold active:scale-[0.98] relative overflow-hidden group before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0 before:translate-y-[-100%] hover:before:translate-y-[100%] before:transition-transform before:duration-700 before:skew-y-12",
        "ghost-white": "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md rounded-xl active:scale-[0.98] shadow-soft hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300",
        premium: "bg-gradient-royal text-white hover:shadow-glow hover:scale-[1.02] transition-luxury shadow-premium border-0 font-bold relative overflow-hidden active:scale-[0.98] group before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-1000 after:absolute after:inset-[2px] after:bg-gradient-royal after:rounded-[10px] after:-z-10",
        neon: "bg-primary/5 text-primary border-2 border-primary/50 hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-glow backdrop-blur-sm font-bold active:scale-[0.98] transition-all duration-500 hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        glass: "glass-premium text-foreground hover:bg-white/10 hover:shadow-elegant active:scale-[0.98] backdrop-blur-xl border border-white/10 relative overflow-hidden group before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        gold: "bg-gradient-gold text-card hover:shadow-gold hover:scale-[1.02] shadow-soft active:scale-[0.98] font-bold relative overflow-hidden group before:absolute before:inset-0 before:bg-gradient-to-r before:from-yellow-300/0 before:via-yellow-100/30 before:to-yellow-300/0 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
        magnetic: "bg-gradient-primary text-primary-foreground shadow-elegant hover:shadow-glow relative overflow-hidden group transition-all duration-300 hover:[transform:translate3d(var(--magnetic-x,0),var(--magnetic-y,0),0)_scale(1.02)] active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-500",
        "3d": "bg-gradient-primary text-primary-foreground shadow-[0_8px_0_hsl(var(--primary-dark)),0_12px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_0_hsl(var(--primary-dark)),0_8px_20px_rgba(0,0,0,0.3)] active:shadow-[0_2px_0_hsl(var(--primary-dark)),0_4px_10px_rgba(0,0,0,0.3)] translate-y-0 hover:translate-y-1 active:translate-y-2 transition-all duration-150 font-bold relative overflow-hidden",
        shimmer: "bg-gradient-to-r from-primary via-primary-light to-primary bg-size-200 bg-pos-0 hover:bg-pos-100 text-primary-foreground shadow-elegant hover:shadow-glow transition-all duration-700 active:scale-[0.98] relative overflow-hidden group before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-1000",
      },
      size: {
        default: "h-11 px-5 py-2.5 min-w-[44px]",
        sm: "h-9 rounded-lg px-3 text-xs min-w-[36px]",
        lg: "h-14 rounded-xl px-8 text-base min-w-[56px]",
        xl: "h-16 rounded-2xl px-10 text-lg min-w-[64px]",
        icon: "h-11 w-11 rounded-xl min-w-[44px] min-h-[44px]",
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
