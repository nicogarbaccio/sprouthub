import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

/**
 * Invisible placeholder that preserves layout dimensions
 * while the page transitions from loading to ready state.
 */
const PlantDetailPlaceholder = () => {
  return (
    <div className="min-h-dvh bg-background pb-20 lg:pb-0">
      <Navigation />
      <main className="py-4 sm:py-6">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 opacity-0">
          {/* Header placeholder */}
          <div className="text-left mb-4">
            <div className="h-7 sm:h-8 w-3/5 mb-1" />
            <div className="h-5 w-2/5 mb-2" />
            <div className="flex gap-2">
              <div className="h-5 w-16" />
              <div className="h-5 w-24" />
            </div>
          </div>

          {/* Main grid placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="h-[240px] sm:h-[280px] md:h-[360px] lg:h-[320px]" />
            <div className="flex flex-col h-[240px] sm:h-[280px] md:h-[360px] lg:h-[320px] space-y-2">
              <div className="flex-1" />
              <div className="flex-1" />
              <div className="h-10" />
            </div>
          </div>

          {/* Care grid placeholder */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4 p-4">
              <div className="h-16" />
              <div className="h-16" />
              <div className="h-16" />
              <div className="h-16" />
            </div>
          </div>

          {/* Care cards placeholder */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64" />
              <div className="h-64" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PlantDetailPlaceholder;
