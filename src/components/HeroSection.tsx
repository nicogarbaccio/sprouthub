import { Button } from "@/components/ui/button";
import { ArrowRight, Droplets, Calendar, Camera } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
 return (
  <section
   className="bg-background dark:bg-sprout-dark py-12 sm:py-16 lg:py-20 dark:shadow-lg dark:shadow-sprout-cream/20"
   data-testid="hero-section"
  >
   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
     <div className="text-center lg:text-left mb-6 sm:mb-8 lg:mb-0 lg:pt-8">
      <h1
       className="text-4xl md:text-5xl lg:text-6xl font-medium text-foreground dark:text-sprout-white mb-6 leading-tight"
       data-testid="hero-title"
      >
       Your plants deserve the
       <span className="text-sprout-success dark:text-sprout-cream">
        {" "}
        best care
       </span>
      </h1>
      <p className="text-lg text-sprout-neutral-dark/80 dark:text-sprout-neutral mb-8 max-w-2xl mx-auto lg:mx-0 font-light">
       Never forget to water your plants again. Track care schedules,
       browse plant guides, and build your perfect indoor garden with{" "}
       <span className="text-sprout-success dark:text-sprout-cream font-bold">
        sprouthub
       </span>
       .
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
       <Link to="/plant-catalog">
        <Button
         className="bg-sprout-dark hover:bg-sprout-primary dark:bg-sprout-cream dark:hover:bg-sprout-cream/90 text-sprout-white dark:text-sprout-dark px-8 py-3 rounded-xl font-medium text-lg"
         data-testid="start-growing-button"
        >
         Start Growing
         <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
       </Link>
      </div>
     </div>

     <div className="relative hidden lg:block lg:flex lg:justify-center">
      <div className="bg-card dark:bg-sprout-dark rounded-3xl shadow-xl dark:shadow-none dark:border dark:border-sprout-cream/30 p-4 sm:p-6 relative overflow-hidden mx-auto lg:mx-0 w-full max-w-sm sm:max-w-md lg:min-w-[400px]">
       <div className="absolute inset-0 bg-gradient-to-br from-plant-secondary/5 to-plant-primary/5 rounded-3xl"></div>
       <div className="relative">
        <img
         src="https://ufhjudswppdqupjbqbwm.supabase.co/storage/v1/object/public/other/sprouthub%20hero.png"
         alt="Person watering a plant"
         className="w-full h-64 sm:h-72 lg:h-64 object-contain rounded-3xl mb-4"
         data-testid="hero-image"
        />
        <div className="space-y-3">
         <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-sprout-dark rounded-xl flex items-center justify-center">
           <Droplets className="w-5 h-5 text-sprout-white" />
          </div>
          <div>
           <p className="font-medium text-sprout-neutral-dark dark:text-white">
            Smart Watering Reminders
           </p>
           <p className="text-sm text-sprout-neutral-dark/70 dark:text-white/80">
            Never miss watering again
           </p>
          </div>
         </div>
         <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-sprout-dark rounded-xl flex items-center justify-center">
           <Calendar className="w-5 h-5 text-sprout-white" />
          </div>
          <div>
           <p className="font-medium text-sprout-neutral-dark dark:text-white">
            Care Tracking
           </p>
           <p className="text-sm text-sprout-neutral-dark/70 dark:text-white/80">
            Log and monitor plant health
           </p>
          </div>
         </div>
         <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-sprout-dark rounded-xl flex items-center justify-center">
           <Camera className="w-5 h-5 text-sprout-white" />
          </div>
          <div>
           <p className="font-medium text-sprout-neutral-dark dark:text-white">
            Plant Library
           </p>
           <p className="text-sm text-sprout-neutral-dark/70 dark:text-white/80">
            Extensive care guides
           </p>
          </div>
         </div>
        </div>
       </div>
      </div>
     </div>
    </div>

    {/* Feature Icons - Tablet Only (hidden on mobile) */}
    <div className="hidden sm:block lg:hidden mt-12">
     <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
      <div className="flex flex-col items-center text-center space-y-3">
       <div className="w-16 h-16 bg-sprout-dark dark:bg-sprout-cream rounded-2xl flex items-center justify-center">
        <Droplets className="w-8 h-8 text-sprout-white dark:text-sprout-dark" />
       </div>
       <div>
        <p className="font-semibold text-sprout-neutral-dark dark:text-white">
         Smart Watering Reminders
        </p>
        <p className="text-sm text-sprout-neutral-dark/70 dark:text-white/80">
         Never miss watering again
        </p>
       </div>
      </div>
      <div className="flex flex-col items-center text-center space-y-3">
       <div className="w-16 h-16 bg-sprout-dark dark:bg-sprout-cream rounded-2xl flex items-center justify-center">
        <Calendar className="w-8 h-8 text-sprout-white dark:text-sprout-dark" />
       </div>
       <div>
        <p className="font-semibold text-sprout-neutral-dark dark:text-white">
         Care Tracking
        </p>
        <p className="text-sm text-sprout-neutral-dark/70 dark:text-white/80">
         Log and monitor plant health
        </p>
       </div>
      </div>
      <div className="flex flex-col items-center text-center space-y-3">
       <div className="w-16 h-16 bg-sprout-dark dark:bg-sprout-cream rounded-2xl flex items-center justify-center">
        <Camera className="w-8 h-8 text-sprout-white dark:text-sprout-dark" />
       </div>
       <div>
        <p className="font-semibold text-sprout-neutral-dark dark:text-white">
         Plant Library
        </p>
        <p className="text-sm text-sprout-neutral-dark/70 dark:text-white/80">
         Extensive care guides
        </p>
       </div>
      </div>
     </div>
    </div>
   </div>
  </section>
 );
};

export default HeroSection;
