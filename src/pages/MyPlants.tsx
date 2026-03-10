import Navigation from "@/components/Navigation";
import MyPlantsCollection from "@/components/MyPlantsCollection";
import Footer from "@/components/Footer";
import { FeatureErrorBoundary } from "@/components/ui/feature-error-boundary";

const MyPlantsContent = () => {
 return (
 <div className="min-h-dvh bg-background pb-28 lg:pb-0 ">
  <Navigation />
  <main>
  <MyPlantsCollection />
  </main>
  <Footer />
 </div>
 );
};

const MyPlants = () => {
 return (
 <FeatureErrorBoundary featureName="My Plants">
  <MyPlantsContent />
 </FeatureErrorBoundary>
 );
};

export default MyPlants;
