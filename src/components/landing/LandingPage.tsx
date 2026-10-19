import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Clock,
  CloudRain,
  Droplets,
  Lightbulb,
  Snowflake,
  TriangleAlert,
  Users,
} from "lucide-react";
import PlantImage from "@/components/ui/plant-image";
import { plants } from "@/data/plantData";
import { homepagePlants } from "@/data/homepagePlants";
import { cn } from "@/lib/utils";

const SIGN_UP_PATH = "/auth?mode=sign-up";
// Rounded down to the nearest ten ("80+"), so it stays true as the catalog grows
const GUIDE_COUNT = `${Math.floor(plants.length / 10) * 10}+`;
const STRIP_PLANTS = homepagePlants.slice(0, 6);

const plantPath = (name: string) => `/plant-details/${name.toLowerCase().replace(/\s+/g, "-")}`;

/** Signed-out home: what sprouthub does, shown with the app's own tiles, in about three screens */
const LandingPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-3.5 lg:pt-7 space-y-2.5 md:space-y-3.5" data-testid="landing-page">
      <Hero />
      <Features />
      <GuideStrip />
      <ClosingCta />
    </div>
  );
};

/* ─── Hero ────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-2.5 md:gap-3.5" data-testid="hero-section">
      <div className="rounded-tile bg-sprout-cream text-sprout-dark p-6 md:p-10 relative overflow-clip flex flex-col justify-center">
        <div aria-hidden="true" className="absolute -right-20 -bottom-28 w-80 h-80 rounded-full bg-sprout-dark opacity-[0.07]" />
        <h1
          className="relative font-display text-[42px] md:text-[64px] font-extrabold leading-[0.92] tracking-[-0.05em]"
          data-testid="hero-title"
        >
          Know exactly when to water.
        </h1>
        <p className="relative text-base md:text-lg font-medium mt-4 max-w-xl text-pretty">
          sprouthub tells you when each plant is due, learns from how you actually water, and suggests changes
          as the seasons turn, so every plant gets its own schedule instead of a guess.
        </p>
        <div className="relative flex flex-wrap gap-2 mt-6">
          <Link
            to={SIGN_UP_PATH}
            className="h-14 px-6 rounded-[20px] bg-sprout-dark text-sprout-cream font-display font-bold inline-flex items-center gap-2 transition-[background-color,transform] hover:bg-sprout-dark/90 active:scale-95"
            data-testid="start-growing-button"
          >
            Sign up free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/plant-catalog"
            className="h-14 px-6 rounded-[20px] border-2 border-sprout-dark/25 font-display font-bold inline-flex items-center transition-colors hover:bg-sprout-dark/10"
          >
            Browse {GUIDE_COUNT} plant guides
          </Link>
        </div>
      </div>

      <AppPreview />
    </section>
  );
}

/**
 * A still of the dashboard built from the same tiles the app uses, so the pitch shows the real
 * product rather than an illustration. Purely visual: nothing in it is interactive.
 */
function AppPreview() {
  const [monstera, snake] = [plantByName("Monstera Deliciosa"), plantByName("Snake Plant")];

  return (
    <div
      role="img"
      aria-label="Example of the sprouthub home screen with sample plants: a Monstera due today, a watering schedule suggestion, and a rain heads-up for outdoor plants"
      className="rounded-tile bg-card p-3 md:p-4 grid grid-cols-2 gap-2 md:gap-2.5 content-center"
    >
      {/* So nobody reads the sample plants as their own schedule */}
      <div className="col-span-2 px-1.5 pb-0.5 flex items-center gap-2 text-xs font-bold text-muted-foreground">
        <span className="px-2 py-0.5 rounded-full bg-field text-foreground">Example</span>
        Sample plants. Yours will show here once you add them.
      </div>
      <div className="col-span-2 rounded-card bg-sprout-water text-sprout-dark p-4 flex items-center gap-3">
        {monstera && <PlantImage src={monstera.image} alt="" className="w-14 h-14 rounded-[16px] shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold tracking-[0.8px] uppercase opacity-80">Due today</div>
          <div className="font-display text-xl font-bold tracking-[-0.02em] truncate">Monstera</div>
        </div>
        <span className="h-11 px-4 rounded-[16px] bg-sprout-dark text-sprout-water font-bold text-sm inline-flex items-center gap-1.5">
          <Droplets className="w-4 h-4" />
          Water
        </span>
      </div>

      <div className="rounded-card bg-sprout-cream text-sprout-dark p-4 flex flex-col justify-between gap-3 min-h-[132px]">
        <div className="w-9 h-9 rounded-[12px] bg-sprout-dark text-sprout-cream flex items-center justify-center">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[13px] font-semibold opacity-80">Pothos</div>
          <div className="font-display text-lg font-bold leading-tight tracking-[-0.02em]">Every 7 → 9 days?</div>
        </div>
      </div>

      <div className="rounded-card bg-sprout-primary text-sprout-cream p-4 flex flex-col justify-between gap-3 min-h-[132px]">
        <div className="w-9 h-9 rounded-[12px] bg-sprout-cream/15 flex items-center justify-center">
          <CloudRain className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[13px] font-semibold opacity-80">Outdoor plants</div>
          <div className="font-display text-lg font-bold leading-tight tracking-[-0.02em]">Rain tomorrow, hold off</div>
        </div>
      </div>

      <div className="col-span-2 rounded-card bg-field p-3 flex items-center gap-3">
        {snake && <PlantImage src={snake.image} alt="" className="w-11 h-11 rounded-[14px] shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold text-foreground truncate">Snake Plant</div>
          <div className="text-[13px] font-medium text-muted-foreground">
            Every {snake?.suggestedWateringDays ?? 14} days
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-card text-foreground">In 9 days</span>
      </div>
    </div>
  );
}

/* ─── Features ────────────────────────────────────────────────────────────── */

const FEATURES: Array<{
  icon: typeof Bell;
  title: string;
  body: string;
  tile: string;
  iconWell: string;
  span?: string;
  /** A small mock of the feature in the app, for the wide tiles */
  extra?: React.ReactNode;
}> = [
  {
    icon: Bell,
    title: "Reminders for each plant",
    body: "A notification when a plant is due or overdue, not a blanket \"water everything Sunday\". Not home? Push it to tomorrow in one tap.",
    tile: "bg-sprout-water text-sprout-dark",
    iconWell: "bg-sprout-dark text-sprout-water",
    span: "sm:col-span-2",
    extra: (
      <div aria-hidden="true" className="flex flex-wrap items-center gap-2">
        <span className="h-10 px-3.5 rounded-[14px] bg-sprout-dark text-sprout-cream text-sm font-bold inline-flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Monstera is due today
        </span>
        <span className="h-10 px-3.5 rounded-[14px] border-2 border-sprout-dark/30 text-sm font-bold inline-flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Push to tomorrow
        </span>
      </div>
    ),
  },
  {
    icon: Lightbulb,
    title: "Learns your rhythm",
    body: "Always watering a few days late? sprouthub notices and suggests a schedule that fits.",
    tile: "bg-sprout-cream text-sprout-dark",
    iconWell: "bg-sprout-dark text-sprout-cream",
  },
  {
    icon: Snowflake,
    title: "Seasons and rain",
    body: "When the season turns, sprouthub suggests a slower or faster schedule, and outdoor plants get a heads-up when rain is coming.",
    tile: "bg-sprout-primary text-sprout-cream",
    iconWell: "bg-sprout-cream/15 text-sprout-cream",
  },
  {
    icon: TriangleAlert,
    title: "Flags overwatering",
    body: "Watering too often? You'll see it on the plant before the leaves show it.",
    tile: "bg-sprout-warning text-sprout-dark",
    iconWell: "bg-sprout-dark text-sprout-warning",
  },
  {
    icon: Users,
    title: "Share the watering",
    body: "Add your household so everyone sees one schedule and nobody waters twice.",
    tile: "bg-card text-foreground",
    iconWell: "bg-field text-foreground",
  },
  {
    icon: BookOpen,
    title: "A journal for every plant",
    body: "Note new leaves, repots and pest scares with photos. Waterings and feedings are logged for you.",
    tile: "bg-card text-foreground",
    iconWell: "bg-field text-foreground",
    span: "sm:col-span-2",
    extra: (
      <div aria-hidden="true" className="rounded-[20px] bg-field p-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-display font-bold tracking-[-0.02em]">New leaf unfurling</span>
          <span className="text-xs font-bold text-muted-foreground">Oct 12</span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">Third one this month, and it's already splitting.</p>
      </div>
    ),
  },
];

function Features() {
  return (
    <section aria-labelledby="landing-features-title" className="pt-6 md:pt-8">
      <h2
        id="landing-features-title"
        className="px-1.5 lg:px-0 font-display text-2xl md:text-[32px] font-bold tracking-[-0.03em] text-foreground"
      >
        Care that keeps up with you
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3.5 mt-3 md:mt-4">
        {FEATURES.map(({ icon: Icon, title, body, tile, iconWell, span, extra }) => (
          // Phones: icon beside the text to keep six tiles short. Wider: icon on top.
          <div key={title} className={cn("rounded-card p-4 sm:p-5 md:p-6 flex sm:flex-col gap-3.5 sm:gap-3", tile, span)}>
            <div className={cn("w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-[14px] flex items-center justify-center", iconWell)}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg md:text-xl font-bold tracking-[-0.02em] leading-tight">{title}</h3>
              <p className="text-[15px] leading-relaxed mt-1 opacity-85 text-pretty">{body}</p>
            </div>
            {extra && <div className="hidden sm:block mt-auto pt-1">{extra}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Plant guides ────────────────────────────────────────────────────────── */

function GuideStrip() {
  return (
    <section aria-labelledby="landing-guides-title" className="pt-6 md:pt-8">
      <div className="px-1.5 lg:px-0 flex items-end justify-between gap-4">
        <div>
          <h2
            id="landing-guides-title"
            className="font-display text-2xl md:text-[32px] font-bold tracking-[-0.03em] text-foreground"
          >
            {GUIDE_COUNT} plant care guides
          </h2>
          <p className="text-[15px] font-medium text-muted-foreground mt-1">
            Watering, light and common problems for the plants people actually own.
          </p>
        </div>
        <Link to="/plant-catalog" className="shrink-0 text-sm font-bold text-link hover:underline underline-offset-4">
          Browse all
        </Link>
      </div>

      {/* Scrolls sideways on phones instead of stacking six cards */}
      <div className="mt-3 md:mt-4 -mx-4 px-4 lg:mx-0 lg:px-0 flex lg:grid lg:grid-cols-6 gap-2.5 md:gap-3.5 overflow-x-auto lg:overflow-visible snap-x scrollbar-none">
        {STRIP_PLANTS.map((plant) => (
          <Link
            key={plant.name}
            to={plantPath(plant.name)}
            className="group snap-start shrink-0 w-[150px] lg:w-auto rounded-card bg-card p-2 pb-3.5 transition-transform hover:-translate-y-0.5"
          >
            <div className="aspect-square rounded-[20px] overflow-hidden">
              <PlantImage src={plant.image} alt={plant.name} className="w-full h-full" />
            </div>
            <div className="px-1.5 mt-2.5">
              <div className="text-[15px] font-bold text-foreground truncate group-hover:underline underline-offset-4">
                {plant.name}
              </div>
              <div className="text-[13px] font-medium text-muted-foreground flex items-center gap-1 mt-0.5">
                <Droplets className="w-3.5 h-3.5 text-sprout-water" />
                Every {plant.suggestedWateringDays} days
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─── Closing CTA ─────────────────────────────────────────────────────────── */

function ClosingCta() {
  return (
    <section className="pt-6 md:pt-8 pb-6">
      <div className="rounded-tile bg-sprout-cream text-sprout-dark p-6 md:p-10 relative overflow-clip flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
        <div aria-hidden="true" className="absolute -left-16 -top-24 w-72 h-72 rounded-full bg-sprout-dark opacity-[0.07]" />
        <div className="relative flex-1">
          <h2 className="font-display text-[28px] md:text-[40px] font-extrabold leading-none tracking-[-0.04em]">
            Start with the plants you have.
          </h2>
          <p className="text-[15px] md:text-base font-medium mt-2 opacity-80">
            Add a plant in under a minute. Its schedule comes from its care guide.
          </p>
        </div>
        <Link
          to={SIGN_UP_PATH}
          className="relative self-start md:self-auto h-14 px-6 rounded-[20px] bg-sprout-dark text-sprout-cream font-display font-bold inline-flex items-center gap-2 transition-[background-color,transform] hover:bg-sprout-dark/90 active:scale-95"
        >
          Sign up free
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}

function plantByName(name: string) {
  return plants.find((plant) => plant.name === name);
}

export default LandingPage;
