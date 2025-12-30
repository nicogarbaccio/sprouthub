import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface ThemeAwareLogoProps {
  className?: string;
  alt?: string;
}

/**
 * ThemeAwareLogo Component
 *
 * Automatically switches between LogoDark.svg (for dark mode) and LogoLight.svg (for light mode)
 * based on the current theme. Provides consistent branding across theme changes.
 */
export const ThemeAwareLogo: React.FC<ThemeAwareLogoProps> = ({
  className = "h-8 w-auto",
  alt = "sprouthub Logo",
}) => {
  const { actualTheme } = useTheme();

  // Use LogoDark.svg for dark mode (cream color #dfc490)
  // Use LogoLight.svg for light mode (green color #4a6741)
  const logoSrc = actualTheme === "dark" ? "/LogoDark.svg" : "/LogoLight.svg";

  return <img src={logoSrc} alt={alt} className={cn(className)} />;
};

export default ThemeAwareLogo;
