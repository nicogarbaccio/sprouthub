import React from "react";
import {
 PlantCardSkeleton,
 MyPlantCardSkeleton,
 DashboardMetricSkeleton,
 DashboardTaskSkeleton,
 DashboardActivitySkeleton,
 FormInputSkeleton,
 FormSectionSkeleton,
 WateringRecordSkeleton,
 ImageUploadSkeleton,
 Skeleton,
} from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const SkeletonDemo = () => {
 return (
  <div className="min-h-screen bg-background ">
   <Navigation />
   <div className="pt-16 py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
     <div className="text-center mb-12">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 ">
       Skeleton Loading States Demo
      </h1>
      <p className="text-muted-foreground text-lg">
       All skeleton components used throughout the SproutHub application
      </p>
     </div>

     <div className="space-y-12">
      {/* Plant Cards Section */}
      <section>
       <h2 className="text-2xl font-bold text-plant-text mb-6">
        Plant Cards
       </h2>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <PlantCardSkeleton />
        <PlantCardSkeleton />
        <PlantCardSkeleton />
        <PlantCardSkeleton />
       </div>
      </section>

      {/* My Plant Cards Section */}
      <section>
       <h2 className="text-2xl font-bold text-plant-text mb-6">
        My Plant Cards
       </h2>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <MyPlantCardSkeleton />
        <MyPlantCardSkeleton />
        <MyPlantCardSkeleton />
        <MyPlantCardSkeleton />
       </div>
      </section>

      {/* Dashboard Components Section */}
      <section>
       <h2 className="text-2xl font-bold text-foreground mb-6">
        Dashboard Components
       </h2>

       {/* Metrics */}
       <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">
         Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <DashboardMetricSkeleton />
         <DashboardMetricSkeleton />
         <DashboardMetricSkeleton />
         <DashboardMetricSkeleton />
        </div>
       </div>

       {/* Tasks and Activities */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
         <CardHeader>
          <CardTitle>Today's Tasks</CardTitle>
         </CardHeader>
         <CardContent>
          <div className="space-y-3">
           <DashboardTaskSkeleton />
           <DashboardTaskSkeleton />
           <DashboardTaskSkeleton />
          </div>
         </CardContent>
        </Card>

        <Card>
         <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
         </CardHeader>
         <CardContent>
          <div className="space-y-3">
           <DashboardActivitySkeleton />
           <DashboardActivitySkeleton />
           <DashboardActivitySkeleton />
          </div>
         </CardContent>
        </Card>
       </div>
      </section>

      {/* Form Components Section */}
      <section>
       <h2 className="text-2xl font-bold text-foreground mb-6">
        Form Components
       </h2>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
         <CardHeader>
          <CardTitle>Form Inputs</CardTitle>
         </CardHeader>
         <CardContent>
          <div className="space-y-4">
           <FormInputSkeleton />
           <FormInputSkeleton />
           <FormInputSkeleton />
          </div>
         </CardContent>
        </Card>

        <Card>
         <CardHeader>
          <CardTitle>Form Section</CardTitle>
         </CardHeader>
         <CardContent>
          <FormSectionSkeleton />
         </CardContent>
        </Card>
       </div>
      </section>

      {/* Other Components Section */}
      <section>
       <h2 className="text-2xl font-bold text-foreground mb-6">
        Other Components
       </h2>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
         <CardHeader>
          <CardTitle>Watering Records</CardTitle>
         </CardHeader>
         <CardContent>
          <div className="space-y-3">
           <WateringRecordSkeleton />
           <WateringRecordSkeleton />
           <WateringRecordSkeleton />
          </div>
         </CardContent>
        </Card>

        <Card>
         <CardHeader>
          <CardTitle>Image Upload</CardTitle>
         </CardHeader>
         <CardContent>
          <ImageUploadSkeleton />
         </CardContent>
        </Card>
       </div>
      </section>

      {/* Basic Skeleton Variations */}
      <section>
       <h2 className="text-2xl font-bold text-foreground mb-6">
        Basic Skeleton Variations
       </h2>

       <Card>
        <CardHeader>
         <CardTitle>Different Sizes and Shapes</CardTitle>
        </CardHeader>
        <CardContent>
         <div className="space-y-4">
          <div className="space-y-2">
           <p className="text-sm font-medium">Text Lines</p>
           <Skeleton className="h-4 w-full" />
           <Skeleton className="h-4 w-3/4" />
           <Skeleton className="h-4 w-1/2" />
          </div>

          <div className="space-y-2">
           <p className="text-sm font-medium">Avatars</p>
           <div className="flex space-x-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
           </div>
          </div>

          <div className="space-y-2">
           <p className="text-sm font-medium">Buttons</p>
           <div className="flex space-x-2">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-8 w-8 rounded-md" />
           </div>
          </div>
         </div>
        </CardContent>
       </Card>
      </section>
     </div>
    </div>
   </div>
   <Footer />
  </div>
 );
};

export default SkeletonDemo;
