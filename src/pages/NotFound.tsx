import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const NotFound = () => {
 const location = useLocation();

 useEffect(() => {
  console.error(
   "404 Error: User attempted to access non-existent route:",
   location.pathname
  );
 }, [location.pathname]);

 return (
  <div className="min-h-screen bg-background ">
   <Navigation />
   <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
    <div className="text-center">
     <h1 className="text-4xl font-bold mb-4 text-foreground">404</h1>
     <p className="text-xl text-muted-foreground mb-4">
      Oops! Page not found
     </p>
     <a
      href="/"
      className="text-plant-primary hover:text-plant-primary/80 underline"
     >
      Return to Home
     </a>
    </div>
   </div>
   <Footer />
  </div>
 );
};

export default NotFound;
