import { LucideIcon, Cake, Cookie, Croissant, Coffee, IceCream, Gift, Sparkles, Heart, Star, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BakeryIconProps {
  icon: LucideIcon;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "pink" | "lavender" | "gold";
}

const sizeClasses = {
  sm: "h-8 w-8 p-1.5",
  md: "h-12 w-12 p-2.5",
  lg: "h-16 w-16 p-3",
};

const variantClasses = {
  default: "bg-pink-soft text-pink-deep",
  pink: "bg-pink-medium text-pink-deep",
  lavender: "bg-lavender-soft text-lavender-deep",
  gold: "bg-gold-soft text-gold-sparkle",
};

export const BakeryIcon = ({
  icon: Icon,
  className,
  size = "md",
  variant = "default",
}: BakeryIconProps) => {
  return (
    <div
      className={cn(
        "rounded-2xl flex items-center justify-center transition-all duration-300",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <Icon className="w-full h-full" />
    </div>
  );
};

// Export common bakery icons for convenience
export const BakeryIcons = {
  Cake,
  Cookie,
  Croissant,
  Coffee,
  IceCream,
  Gift,
  Sparkles,
  Heart,
  Star,
  Crown,
};
