import MyPlantsCollection from "@/components/MyPlantsCollection";
import { FeatureErrorBoundary } from "@/components/ui/feature-error-boundary";

const MyPlantsContent = () => {
 return (
 <div className="min-h-[calc(100dvh-4rem)] bg-background pb-28 lg:pb-0 ">
  <main>
  <MyPlantsCollection />
  </main>
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
