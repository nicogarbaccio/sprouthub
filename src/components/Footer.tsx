import React from "react";

/**
 * Site-wide footer for SproutHub.
 * @returns {JSX.Element}
 */
const Footer: React.FC = () => (
 <footer className="bg-sprout-medium text-sprout-white py-12">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
   <div className="text-center">
    {/* Cream-colored logo */}
    <img
     src="/LogoDark.svg"
     alt="SproutHub Logo"
     className="h-12 w-auto mx-auto mb-4"
    />

    <h3 className="text-2xl text-sprout-cream font-bold mb-4 ">
     sprouthub
    </h3>
    <p className="text-white mb-6">Your personal plant care assistant</p>
    <p className="text-sm text-white/80">
     © 2025 SproutHub. Made with <span className="text-red-500">♥</span>{" "}
     for plant lovers everywhere.
    </p>
   </div>
  </div>
 </footer>
);

export default Footer;
