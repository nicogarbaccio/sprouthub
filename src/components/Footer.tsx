import React from "react";
import { Link } from "react-router-dom";

/**
 * Site-wide footer for SproutHub.
 * @returns {JSX.Element}
 */
const Footer: React.FC = () => (
 <footer className="bg-sprout-medium text-sprout-white py-6">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <div className="text-center">
  {/* Cream-colored logo */}
  <img
   src="/LogoDark.svg"
   alt="SproutHub Logo"
   className="h-8 w-auto mx-auto mb-2"
  />

  <h3 className="text-xl text-sprout-cream font-bold mb-2">
   sprouthub
  </h3>
  <p className="text-white/90 text-sm mb-3">Your personal plant care assistant</p>
  
  {/* Navigation Links */}
  <div className="flex items-center justify-center gap-4 mb-3 text-sm">
   <Link to="/about" className="text-white/80 hover:text-white transition-colors">
    About
   </Link>
   <span className="text-white/40">•</span>
   <a href="#" className="text-white/80 hover:text-white transition-colors">
    FAQ
   </a>
   <span className="text-white/40">•</span>
   <a href="#" className="text-white/80 hover:text-white transition-colors">
    Contact
   </a>
   <span className="text-white/40">•</span>
   <a href="#" className="text-white/80 hover:text-white transition-colors">
    Privacy
   </a>
  </div>
  
  <p className="text-xs text-white/70">
   © 2025 SproutHub. Made with <span className="text-red-500">♥</span>{" "}
   for plant lovers everywhere.
  </p>
  </div>
 </div>
 </footer>
);

export default Footer;
