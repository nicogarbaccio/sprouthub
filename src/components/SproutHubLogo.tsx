import React from "react";

const SproutHubLogo = ({
 className = "",
 size = "lg",
}: {
 className?: string;
 size?: "sm" | "md" | "lg";
}) => {
 const sizeClasses = {
 sm: "w-32 h-8",
 md: "w-48 h-12",
 lg: "w-64 h-16",
 };

 const iconSizes = {
 sm: "w-6 h-6",
 md: "w-8 h-8",
 lg: "w-10 h-10",
 };

 const textSizes = {
 sm: "text-lg",
 md: "text-2xl",
 lg: "text-3xl",
 };

 return (
 <div
  className={`${sizeClasses[size]} ${className} flex items-center justify-center gap-3`}
 >
  {/* Full, lush plant icon 🪴 */}
  <div
  className={`${iconSizes[size]} text-sprout-secondary dark:text-sprout-secondary`}
  >
  <svg
   viewBox="0 0 24 24"
   fill="none"
   xmlns="http://www.w3.org/2000/svg"
   className="w-full h-full"
  >
   {/* Main stem */}
   <path
   d="M12 19V10"
   stroke="currentColor"
   strokeWidth="1.5"
   strokeLinecap="round"
   />

   {/* Back layer leaves - larger, positioned behind */}
   <ellipse
   cx="8"
   cy="12"
   rx="2.8"
   ry="2.2"
   fill="currentColor"
   transform="rotate(-25 8 12)"
   fillOpacity="0.7"
   />

   <ellipse
   cx="16"
   cy="11"
   rx="2.8"
   ry="2.2"
   fill="currentColor"
   transform="rotate(25 16 11)"
   fillOpacity="0.7"
   />

   {/* Main large leaves - prominent front layer */}
   <ellipse
   cx="9.5"
   cy="9.5"
   rx="3.2"
   ry="2.8"
   fill="currentColor"
   transform="rotate(-15 9.5 9.5)"
   fillOpacity="0.95"
   />

   <ellipse
   cx="14.5"
   cy="8.5"
   rx="3.2"
   ry="2.8"
   fill="currentColor"
   transform="rotate(15 14.5 8.5)"
   fillOpacity="0.95"
   />

   {/* Center top leaf */}
   <ellipse
   cx="12"
   cy="7"
   rx="2"
   ry="2.5"
   fill="currentColor"
   fillOpacity="1"
   />

   {/* Small side leaves for fullness */}
   <ellipse
   cx="10"
   cy="13"
   rx="1.8"
   ry="1.5"
   fill="currentColor"
   transform="rotate(-30 10 13)"
   fillOpacity="0.8"
   />

   <ellipse
   cx="14"
   cy="12.5"
   rx="1.8"
   ry="1.5"
   fill="currentColor"
   transform="rotate(30 14 12.5)"
   fillOpacity="0.8"
   />

   {/* Small emerging leaves near base */}
   <ellipse
   cx="11"
   cy="16"
   rx="1.2"
   ry="1"
   fill="currentColor"
   transform="rotate(-10 11 16)"
   fillOpacity="0.6"
   />

   <ellipse
   cx="13"
   cy="16.5"
   rx="1.2"
   ry="1"
   fill="currentColor"
   transform="rotate(10 13 16.5)"
   fillOpacity="0.6"
   />

   {/* Larger terracotta pot - better proportioned */}
   <path
   d="M7.5 19H16.5L15.5 22.5C15.5 23 15 23 12 23C9 23 8.5 23 8.5 22.5L7.5 19Z"
   fill="#CD7F32"
   fillOpacity="0.8"
   />

   {/* Pot rim */}
   <ellipse
   cx="12"
   cy="19"
   rx="4.5"
   ry="1"
   fill="#B8671F"
   fillOpacity="0.9"
   />

   {/* Soil/dirt surface */}
   <ellipse
   cx="12"
   cy="19.3"
   rx="4"
   ry="0.6"
   fill="#8B4513"
   fillOpacity="0.7"
   />

   {/* Small plant sprout details */}
   <circle
   cx="10"
   cy="18.8"
   r="0.3"
   fill="currentColor"
   fillOpacity="0.6"
   />
   <circle
   cx="14"
   cy="18.9"
   r="0.2"
   fill="currentColor"
   fillOpacity="0.6"
   />
   <circle
   cx="11.8"
   cy="18.7"
   r="0.2"
   fill="currentColor"
   fillOpacity="0.5"
   />
   <circle
   cx="12.5"
   cy="18.9"
   r="0.15"
   fill="currentColor"
   fillOpacity="0.5"
   />
  </svg>
  </div>

  {/* Text logo */}
  <span
  className={`${textSizes[size]} font-bold text-sprout-primary dark:text-sprout-secondary group-hover:text-sprout-primary/90 dark:group-hover:text-sprout-secondary transition-colors duration-200`}
  >
  SproutHub
  </span>
 </div>
 );
};

export default SproutHubLogo;
