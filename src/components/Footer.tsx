import React from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/logo";

/**
 * Site-wide footer for sprouthub.
 * @returns {JSX.Element}
 */
const footerLink = "text-white/80 hover:text-white transition-colors";

const Footer: React.FC = () => (
  // One compact row on desktop; square corners so it runs straight into the sidebar
  <footer className="hidden lg:block bg-nav text-sprout-white py-7 mt-6">
    <div className="max-w-7xl mx-auto px-8 flex items-center justify-between gap-6 text-sm">
      <div className="flex items-center gap-2 shrink-0">
        <Logo onGreen alt="" className="h-8 w-auto" />
        <span className="font-display font-extrabold text-white tracking-tight"><span className="text-sprout-success">sprout</span><span className="text-sprout-cream">hub</span></span>
      </div>

      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1" aria-label="Footer">
        <Link to="/about" className={footerLink}>About</Link>
        <a href="#" className={footerLink}>FAQ</a>
        <a href="#" className={footerLink}>Contact</a>
        <Link to="/privacy-policy" className={footerLink}>Privacy</Link>
        <Link to="/terms-of-service" className={footerLink}>Terms</Link>
      </nav>

      <p className="text-xs text-white/70 shrink-0">
        © 2025 sprouthub. Made with <span className="text-red-500">♥</span> for plant lovers.
      </p>
    </div>
  </footer>
);

export default Footer;
