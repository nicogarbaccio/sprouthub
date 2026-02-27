import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import MyPlantsCollection from "@/components/MyPlantsCollection";
import { Skeleton, SearchFilterBarSkeleton, RoomSectionSkeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";
import { toast } from "@/hooks/use-toast";
import { FeatureErrorBoundary } from "@/components/ui/feature-error-boundary";

const MyPlantsContent = () => {
 const { user, loading } = useAuth();
 const navigate = useNavigate();

 useEffect(() => {
 if (!loading && !user) {
  toast({
  title: "Authentication Required",
  description: "Please sign in to view your plant collection.",
  variant: "default",
  });
  navigate("/");
 }
 }, [user, loading, navigate]);

 if (loading) {
 return (
  <div className="min-h-dvh bg-background pb-20 lg:pb-0 ">
  <Navigation />
  <main>
   <section className="py-8 bg-background min-h-[calc(100vh-4rem)]">
   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Header Skeleton */}
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
    <div>
     <Skeleton className="h-10 w-80 mb-4" />
     <div className="flex flex-wrap gap-4">
     <Skeleton className="h-6 w-20 rounded-full" />
     <Skeleton className="h-6 w-24 rounded-full" />
     <Skeleton className="h-6 w-28 rounded-full" />
     </div>
    </div>
    <div className="flex gap-2 mt-4 md:mt-0">
     <Skeleton className="h-10 w-24 rounded-xl" />
     <Skeleton className="h-10 w-36 rounded-xl" />
    </div>
    </div>

    {/* Search/Filter Bar Skeleton */}
    <div className="mb-6">
     <SearchFilterBarSkeleton />
    </div>

    {/* Room Section Skeletons */}
    <RoomSectionSkeleton cardCount={4} />
    <RoomSectionSkeleton cardCount={3} />
   </div>
   </section>
  </main>
  <Footer />
  </div>
 );
 }

 if (!user) {
 return null;
 }

 return (
 <div className="min-h-dvh bg-background pb-20 lg:pb-0 ">
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
