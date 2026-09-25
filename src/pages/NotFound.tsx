import { Link, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import { useEffect } from "react";

const NotFound = () => {
 const location = useLocation();

 useEffect(() => {
 console.error(
  "404 Error: User attempted to access non-existent route:",
  location.pathname
 );
 }, [location.pathname]);

 return (
 <div className="bg-background pb-32 lg:pb-10">
  <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4">
  <div className="w-full max-w-md rounded-tile bg-sprout-cream text-sprout-dark p-6 md:p-8 relative overflow-clip">
   <div aria-hidden="true" className="absolute -right-12 -bottom-16 w-52 h-52 rounded-full bg-sprout-dark opacity-[0.07]" />
   <div className="relative font-display text-[76px] font-extrabold leading-none tracking-[-0.05em]">404</div>
   <h1 className="relative font-display text-2xl font-bold tracking-[-0.03em] mt-3">This page wandered off</h1>
   <p className="relative text-[15px] font-medium mt-1">We couldn't find the page you were looking for.</p>
   <Link
   to="/"
   className="relative mt-5 h-12 px-5 rounded-[18px] bg-sprout-dark text-sprout-cream font-bold text-[15px] inline-flex items-center gap-2"
   >
   <Home className="w-5 h-5" />
   Return to Home
   </Link>
  </div>
  </div>
 </div>
 );
};

export default NotFound;
