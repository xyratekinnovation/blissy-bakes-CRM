import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-button hover:shadow-glow rounded-2xl",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl",
        outline: "border-2 border-primary bg-background hover:bg-primary/10 text-primary rounded-2xl",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-2xl",
        ghost: "hover:bg-primary/10 hover:text-primary rounded-2xl",
        link: "text-primary underline-offset-4 hover:underline",
        bakery: "bg-gradient-to-r from-pink-medium to-lavender-medium text-primary-foreground shadow-button hover:shadow-glow hover:scale-105 rounded-2xl",
        gold: "bg-gradient-to-r from-gold-soft to-gold-sparkle text-chocolate shadow-gold hover:shadow-glow hover:scale-105 rounded-2xl",
        soft: "bg-pink-soft text-pink-deep hover:bg-pink-medium border border-pink-medium/30 rounded-2xl",
        lavender: "bg-lavender-soft text-lavender-deep hover:bg-lavender-medium border border-lavender-medium/30 rounded-2xl",
        glass: "bg-card/50 backdrop-blur-lg border border-primary/20 text-foreground hover:bg-card/70 hover:border-primary/40 rounded-2xl",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 text-xs rounded-xl",
        lg: "h-14 px-8 text-base",
        xl: "h-16 px-10 text-lg rounded-3xl",
        icon: "h-12 w-12",
        "icon-sm": "h-10 w-10 rounded-xl",
        "icon-lg": "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
