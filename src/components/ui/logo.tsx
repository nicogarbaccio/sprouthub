import React from "react";
import { cn } from "@/lib/utils";

/** The sprouthub logo: green on light mode, white on dark mode. */
export const LOGO_LIGHT_SRC = "/sprouthub-logo-green.svg";
export const LOGO_DARK_SRC = "/sprouthub-logo-white.svg";

interface LogoProps {
  className?: string;
  alt?: string;
  /** Set when the logo sits on a green background (nav, footer, splash) — always uses the white logo. */
  onGreen?: boolean;
}

// Swapped with the `dark` class (not useTheme) so the right logo shows on first paint
export const Logo: React.FC<LogoProps> = ({ className = "h-8 w-auto", alt = "sprouthub", onGreen = false }) =>
  onGreen ? (
    <img src={LOGO_DARK_SRC} alt={alt} className={cn(className)} />
  ) : (
    <>
      <img src={LOGO_LIGHT_SRC} alt={alt} className={cn(className, "dark:hidden")} />
      <img src={LOGO_DARK_SRC} alt={alt} className={cn(className, "hidden dark:block")} />
    </>
  );

export default Logo;
