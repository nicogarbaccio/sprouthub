import { ArrowRight, Droplets, Calendar, Camera } from "lucide-react";
import { Link } from "react-router-dom";

const HIGHLIGHTS = [
  { icon: Droplets, title: "Smart Watering Reminders", body: "Never miss watering again", classes: "bg-sprout-water text-sprout-dark" },
  { icon: Calendar, title: "Care Tracking", body: "Log and monitor plant health", classes: "bg-card text-foreground" },
  { icon: Camera, title: "Plant Library", body: "Extensive care guides", classes: "bg-sprout-primary text-sprout-cream" },
];

/** Signed-out home: the pitch, a way in, and three reasons to stay */
const HeroSection = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 lg:px-8 pt-3.5 lg:pt-7" data-testid="hero-section">
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-2.5 md:gap-3.5">
        <div className="rounded-tile bg-sprout-cream text-sprout-dark p-6 md:p-10 relative overflow-clip flex flex-col justify-center min-h-[320px]">
          <div aria-hidden="true" className="absolute -right-16 -bottom-24 w-80 h-80 rounded-full bg-sprout-dark opacity-[0.07]" />
          <h1
            className="relative font-display text-[40px] md:text-6xl font-extrabold leading-[0.95] tracking-[-0.05em]"
            data-testid="hero-title"
          >
            Your plants deserve the best care
          </h1>
          <p className="relative text-base md:text-lg font-medium mt-4 max-w-xl">
            Never forget to water your plants again. Track care schedules, browse plant guides, and build your
            perfect indoor garden with <span className="font-bold">sprouthub</span>.
          </p>
          <Link
            to="/plant-catalog"
            className="relative self-start mt-6 h-14 px-6 rounded-[20px] bg-sprout-dark text-sprout-cream font-display font-bold inline-flex items-center gap-2"
            data-testid="start-growing-button"
          >
            Start Growing
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="hidden lg:flex rounded-tile bg-card p-4 items-center justify-center">
          <img
            src="https://ufhjudswppdqupjbqbwm.supabase.co/storage/v1/object/public/other/sprouthub%20hero.png"
            alt="Person watering a plant"
            className="w-full h-72 object-contain rounded-well"
            data-testid="hero-image"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 md:gap-3.5 mt-2.5 md:mt-3.5">
        {HIGHLIGHTS.map(({ icon: Icon, title, body, classes }) => (
          <div key={title} className={`rounded-card p-5 flex items-center gap-3.5 ${classes}`}>
            <div className="w-11 h-11 shrink-0 rounded-[14px] bg-sprout-dark/10 flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold">{title}</p>
              <p className="text-sm font-medium opacity-80">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
