import React from "react";
import { Link } from "react-router-dom";

/**
 * Site-wide footer for SproutHub.
 * @returns {JSX.Element}
 */
const Footer: React.FC = () => (
  <footer className="bg-sprout-medium text-sprout-white py-4 sm:py-6">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        {/* Cream-colored logo */}
        <img
          src="/LogoDark.svg"
          alt="sprouthub Logo"
          className="h-6 sm:h-8 w-auto mx-auto mb-1 sm:mb-2"
        />

        <h3 className="text-lg sm:text-xl text-sprout-cream font-bold mb-1 sm:mb-2">sprouthub</h3>
        <p className="text-white/90 text-xs sm:text-sm mb-2 sm:mb-3">
          Your personal plant care assistant
        </p>

        {/* Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-x-4 mb-2 sm:mb-3 text-xs sm:text-sm">
          <Link
            to="/about"
            className="text-white/80 hover:text-white transition-colors"
          >
            About
          </Link>
          <a
            href="#"
            className="text-white/80 hover:text-white transition-colors"
          >
            FAQ
          </a>
          <a
            href="#"
            className="text-white/80 hover:text-white transition-colors"
          >
            Contact
          </a>
          <Link
            to="/privacy-policy"
            className="text-white/80 hover:text-white transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/terms-of-service"
            className="text-white/80 hover:text-white transition-colors"
          >
            Terms
          </Link>
        </div>

        <p className="text-xs text-white/70">
          © 2025 sprouthub. Made with <span className="text-red-500">♥</span>{" "}
          for plant lovers everywhere.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
