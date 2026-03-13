import {
  Droplets,
  BookOpen,
  Camera,
  Bell,
  BarChart,
  Users,
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Plant Encyclopedia",
      description:
        "Browse hundreds of plants with detailed care instructions, botanical names, and growing tips.",
    },
    {
      icon: Droplets,
      title: "Smart Watering",
      description:
        "Get personalized watering schedules based on your plants specific needs and environment.",
    },
    {
      icon: Camera,
      title: "Photo Collections",
      description:
        "Track your plants growth with photos and create beautiful visual journals of your garden.",
    },
    {
      icon: Bell,
      title: "Care Reminders",
      description:
        "Never miss watering, fertilizing, or repotting with intelligent notifications.",
    },
    {
      icon: BarChart,
      title: "Growth Tracking",
      description:
        "Monitor your plant's health and growth patterns with detailed care logs and analytics.",
    },
    {
      icon: Users,
      title: "Households",
      description:
        "Share your plant collection with family or roommates and delegate care responsibilities together.",
    },
  ];

  return (
    <section className="py-20 bg-sprout-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-sprout-white mb-4 ">
            Everything you need to grow
          </h2>
          <p className="text-lg text-white max-w-2xl mx-auto ">
            From beginners to expert gardeners, sprouthub provides all the tools
            and knowledge you need to keep your plants thriving.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group">
              <div className="bg-sprout-primary border border-sprout-cream/30 rounded-2xl p-8 h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-sprout-cream/50">
                <div className="w-12 h-12 bg-sprout-primary border-2 border-sprout-cream rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 p-2">
                  <feature.icon className="w-6 h-6 text-sprout-white" />
                </div>
                <h3 className="text-xl font-semibold text-sprout-white mb-3 ">
                  {feature.title}
                </h3>
                <p className="text-sprout-white/80 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
