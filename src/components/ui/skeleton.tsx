import { cn } from "@/lib/utils";

function Skeleton({
 className,
 ...props
}: React.HTMLAttributes<HTMLDivElement>) {
 return (
 <div
  className={cn("animate-pulse rounded-md bg-muted/60", className)}
  {...props}
 />
 );
}

/**
 * Skeleton for plant card components - includes image, text, and button areas
 * Note: Plant cards have green backgrounds, so we keep the green styling here
 */
function PlantCardSkeleton({ className }: { className?: string }) {
 return (
 <div
  className={cn(
  "bg-card rounded-2xl shadow-md overflow-hidden border border-border",
  className
  )}
 >
  {/* Image skeleton */}
  <Skeleton className="w-full h-48" />

  <div className="p-6">
  {/* Title skeleton */}
  <Skeleton className="h-6 w-3/4 mb-2" />
  {/* Subtitle skeleton */}
  <Skeleton className="h-4 w-1/2 mb-4" />

  {/* Plant details skeleton */}
  <div className="space-y-3 mb-4">
   <div className="flex items-center space-x-2">
   <Skeleton className="h-4 w-4 rounded-full" />
   <Skeleton className="h-4 w-20" />
   </div>
   <div className="flex items-center space-x-2">
   <Skeleton className="h-4 w-4 rounded-full" />
   <Skeleton className="h-4 w-16" />
   </div>
  </div>

  {/* Buttons skeleton */}
  <div className="space-y-2">
   <Skeleton className="h-10 w-full rounded-xl" />
   <Skeleton className="h-10 w-full rounded-xl" />
  </div>
  </div>
 </div>
 );
}

/**
 * Skeleton for my plant card components - includes status badge and single button
 * Note: My plant cards have green backgrounds, so we keep the green styling here
 */
function MyPlantCardSkeleton({ className }: { className?: string }) {
 return (
 <div
  className={cn(
  "bg-card rounded-2xl shadow-md overflow-hidden border border-border",
  className
  )}
 >
  {/* Image with overlay skeleton */}
  <div className="relative">
  <Skeleton className="w-full h-40" />
  {/* Status badge skeleton */}
  <div className="absolute top-3 right-3">
   <Skeleton className="h-6 w-20 rounded-full" />
  </div>
  {/* Edit button skeleton */}
  <div className="absolute bottom-3 right-3">
   <Skeleton className="h-8 w-8 rounded-md" />
  </div>
  </div>

  <div className="p-5">
  {/* Title skeleton */}
  <Skeleton className="h-6 w-3/4 mb-1" />
  {/* Plant type skeleton */}
  <Skeleton className="h-4 w-1/2 mb-4" />

  {/* Details skeleton */}
  <div className="space-y-2 mb-4">
   <div className="flex items-center justify-between">
   <Skeleton className="h-4 w-20" />
   <Skeleton className="h-4 w-16" />
   </div>
   <div className="flex items-center justify-between">
   <Skeleton className="h-4 w-24" />
   <Skeleton className="h-4 w-20" />
   </div>
  </div>

  {/* Water button skeleton */}
  <Skeleton className="h-10 w-full rounded-xl" />
  </div>
 </div>
 );
}

/**
 * Skeleton for dashboard metric cards
 */
function DashboardMetricSkeleton({ className }: { className?: string }) {
 return (
 <div
  className={cn("bg-card border border-border rounded-lg p-6", className)}
 >
  <div className="flex items-center justify-between">
  <div className="space-y-2">
   <Skeleton className="h-4 w-20" />
   <Skeleton className="h-8 w-12" />
  </div>
  <Skeleton className="w-12 h-12 rounded-full" />
  </div>
 </div>
 );
}

/**
 * Skeleton for dashboard task items
 */
function DashboardTaskSkeleton({ className }: { className?: string }) {
 return (
 <div
  className={cn(
  "flex items-center justify-between p-3 bg-muted/30 rounded-lg",
  className
  )}
 >
  <div className="flex items-center space-x-3">
  <Skeleton className="w-10 h-10 rounded-full" />
  <div className="space-y-1">
   <Skeleton className="h-4 w-24" />
   <Skeleton className="h-3 w-16" />
  </div>
  </div>
  <div className="flex items-center space-x-2">
  <Skeleton className="h-6 w-16 rounded-full" />
  <Skeleton className="h-8 w-8 rounded" />
  </div>
 </div>
 );
}

/**
 * Skeleton for dashboard activity items
 */
function DashboardActivitySkeleton({ className }: { className?: string }) {
 return (
 <div
  className={cn(
  "flex items-center space-x-3 p-3 bg-muted/30 rounded-lg",
  className
  )}
 >
  <Skeleton className="w-8 h-8 rounded-full" />
  <div className="flex-1 space-y-1">
  <Skeleton className="h-4 w-32" />
  <Skeleton className="h-3 w-20" />
  </div>
  <Skeleton className="w-4 h-4" />
 </div>
 );
}

/**
 * Skeleton for form inputs - includes label and input field
 */
function FormInputSkeleton({ className }: { className?: string }) {
 return (
 <div className={cn("space-y-2", className)}>
  <Skeleton className="h-4 w-20" />
  <Skeleton className="h-10 w-full rounded-md" />
 </div>
 );
}

/**
 * Skeleton for form sections with title and description
 */
function FormSectionSkeleton({ className }: { className?: string }) {
 return (
 <div className={cn("space-y-4", className)}>
  <div>
  <Skeleton className="h-6 w-32 mb-2" />
  <Skeleton className="h-4 w-48" />
  </div>
  <FormInputSkeleton />
  <FormInputSkeleton />
  <FormInputSkeleton />
  <Skeleton className="h-10 w-24 rounded-md" />
 </div>
 );
}

/**
 * Skeleton for watering record items
 */
function WateringRecordSkeleton({ className }: { className?: string }) {
 return (
 <div
  className={cn(
  "flex items-center justify-between p-3 border border-border rounded-md",
  className
  )}
 >
  <div className="space-y-1">
  <Skeleton className="h-4 w-24" />
  <Skeleton className="h-3 w-32" />
  </div>
  <Skeleton className="h-8 w-8 rounded-md" />
 </div>
 );
}

/**
 * Skeleton for image upload component
 */
function ImageUploadSkeleton({ className }: { className?: string }) {
 return (
 <div className={cn("space-y-2", className)}>
  <Skeleton className="h-4 w-16" />
  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
  <Skeleton className="w-12 h-12 rounded-full mx-auto mb-3" />
  <Skeleton className="h-4 w-32 mx-auto mb-2" />
  <Skeleton className="h-3 w-48 mx-auto" />
  </div>
 </div>
 );
}

export {
 Skeleton,
 PlantCardSkeleton,
 MyPlantCardSkeleton,
 DashboardMetricSkeleton,
 DashboardTaskSkeleton,
 DashboardActivitySkeleton,
 FormInputSkeleton,
 FormSectionSkeleton,
 WateringRecordSkeleton,
 ImageUploadSkeleton,
};
