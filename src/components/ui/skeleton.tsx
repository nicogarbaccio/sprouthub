import { cn } from "@/lib/utils";

function Skeleton({
 className,
 "aria-label": ariaLabel = "Loading...",
 ...props
}: React.HTMLAttributes<HTMLDivElement>) {
 return (
 <div
  role="status"
  aria-label={ariaLabel}
  aria-live="polite"
  className={cn("animate-pulse rounded-md bg-muted-foreground/[0.12]", className)}
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
  "bg-primary/5 rounded-2xl shadow-md overflow-hidden border border-border",
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
  "bg-primary/5 rounded-2xl shadow-md overflow-hidden border border-border",
  className
  )}
 >
  {/* Image with overlay skeleton */}
  <div className="relative">
  <Skeleton className="w-full h-48" />
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
  className={cn("bg-primary/5 border border-border rounded-lg p-6", className)}
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
    "flex items-center justify-between p-3 bg-primary/5 border border-border rounded-lg",
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
    "flex items-center space-x-3 p-3 bg-primary/5 border border-border rounded-lg",
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

/**
 * Skeleton for plant details page - matches the actual MyPlantDetails layout
 */
function PlantDetailsPageSkeleton({ className }: { className?: string }) {
 return (
 <div className={cn("max-w-4xl mx-auto px-3 sm:px-4 lg:px-8", className)}>
  {/* Breadcrumbs skeleton */}
  <div className="flex items-center gap-1.5 mb-4">
   <Skeleton className="h-4 w-16" />
   <Skeleton className="h-4 w-2" />
   <Skeleton className="h-4 w-24" />
  </div>

  {/* Plant header skeleton */}
  <div className="text-left mb-4">
   <Skeleton className="h-7 sm:h-8 w-3/5 mb-1" />
   <Skeleton className="h-5 w-2/5 mb-2" />
   <div className="flex flex-wrap gap-2">
    <Skeleton className="h-5 w-16 rounded-full" />
    <Skeleton className="h-5 w-24 rounded-full" />
   </div>
  </div>

  {/* Main grid: image + info cards */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
   {/* Image skeleton */}
   <Skeleton className="w-full h-[240px] sm:h-[280px] lg:h-[320px] rounded-lg" />

   {/* Right column: cards + action button */}
   <div className="flex flex-col h-[240px] sm:h-[280px] lg:h-[320px] space-y-2">
    {/* Watering Schedule card skeleton */}
    <div className="flex-1 border rounded-lg px-3 sm:px-4 pt-3 pb-3">
     <Skeleton className="h-3.5 w-28 mb-3" />
     <div className="space-y-2">
      <div className="flex justify-between">
       <Skeleton className="h-3.5 w-20" />
       <Skeleton className="h-3.5 w-24" />
      </div>
      <div className="flex justify-between">
       <Skeleton className="h-3.5 w-16" />
       <Skeleton className="h-3.5 w-20" />
      </div>
      <div className="flex justify-between">
       <Skeleton className="h-3.5 w-16" />
       <Skeleton className="h-3.5 w-14" />
      </div>
     </div>
    </div>

    {/* Plant Info card skeleton */}
    <div className="flex-1 border rounded-lg px-3 sm:px-4 pt-3 pb-3">
     <Skeleton className="h-3.5 w-20 mb-3" />
     <div className="space-y-2">
      <div className="flex justify-between">
       <Skeleton className="h-3.5 w-12" />
       <Skeleton className="h-3.5 w-24" />
      </div>
      <div className="flex justify-between">
       <Skeleton className="h-3.5 w-16" />
       <Skeleton className="h-3.5 w-20" />
      </div>
     </div>
    </div>

    {/* Actions button skeleton */}
    <Skeleton className="h-10 w-full rounded-xl" />
   </div>
  </div>

  {/* Care grid skeleton */}
  <div className="mb-6">
   <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border-2 border-border">
    {Array.from({ length: 4 }).map((_, i) => (
     <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-primary/5">
      <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
      <div className="space-y-1.5">
       <Skeleton className="h-3 w-14" />
       <Skeleton className="h-3.5 w-20" />
      </div>
     </div>
    ))}
   </div>
  </div>

  {/* Care cards skeleton */}
  <div className="mb-6">
   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {Array.from({ length: 2 }).map((_, i) => (
     <div key={i} className="border rounded-lg">
      <div className="p-6">
       <Skeleton className="h-6 w-36 mb-4" />
       <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, j) => (
         <div key={j} className="flex items-start space-x-2">
          <Skeleton className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" />
          <Skeleton className="h-4 w-full" />
         </div>
        ))}
       </div>
      </div>
     </div>
    ))}
   </div>
  </div>
 </div>
 );
}

/**
 * Skeleton for household card in households list
 */
function HouseholdCardSkeleton({ className }: { className?: string }) {
 return (
 <div className={cn("bg-primary/5 border border-border rounded-lg shadow-sm", className)}>
  <div className="p-6">
  <div className="flex items-center justify-between mb-2">
   <Skeleton className="h-6 w-3/4" />
   <Skeleton className="h-6 w-16 rounded-full" />
  </div>
  <Skeleton className="h-4 w-full mb-4" />
  <div className="space-y-3">
   <div className="flex items-center">
   <Skeleton className="h-4 w-4 mr-2" />
   <Skeleton className="h-4 w-24" />
   </div>
   <div className="flex gap-2 pt-4 border-t">
   <Skeleton className="h-8 w-20" />
   <Skeleton className="h-8 w-20" />
   </div>
  </div>
  </div>
 </div>
 );
}

/**
 * Skeleton for profile header section
 */
function ProfileHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("text-center mb-8", className)}>
      <Skeleton className="h-9 w-64 mx-auto mb-2" />
      <Skeleton className="h-5 w-96 mx-auto" />
    </div>
  );
}

/**
 * Skeleton for profile information card
 */
function ProfileInformationSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-primary/5 border border-border rounded-lg", className)}>
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-2">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-4 w-64 mb-6" />

        <div className="space-y-6">
          {/* Avatar section */}
          <div className="flex justify-center mb-6">
            <Skeleton className="w-24 h-24 rounded-full" />
          </div>

          {/* Name inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-4 w-48" />
          </div>

          {/* Button */}
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for security settings card
 */
function SecuritySettingsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-primary/5 border border-border rounded-lg", className)}>
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-2">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-4 w-64 mb-6" />

        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for danger zone card
 */
function DangerZoneSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-primary/5 border border-border rounded-lg", className)}>
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-2">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-64 mb-6" />

        <Skeleton className="h-10 w-full rounded-md mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}


/**
 * Skeleton for household management details page
 */
function HouseholdDetailsSkeleton({ className }: { className?: string }) {
 return (
 <div className={cn("space-y-6", className)}>
  {/* Header skeleton */}
  <div className="flex items-center gap-4">
  <Skeleton className="h-10 w-10" />
  <div className="flex-1">
   <Skeleton className="h-8 w-64 mb-2" />
   <Skeleton className="h-4 w-96" />
  </div>
  <Skeleton className="h-6 w-20 rounded-full" />
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  {/* Main content skeleton */}
  <div className="lg:col-span-2 space-y-6">
   {/* Members card skeleton */}
   <div className="bg-primary/5 border border-border rounded-lg p-6">
   <div className="flex items-center justify-between mb-4">
    <Skeleton className="h-6 w-32" />
    <Skeleton className="h-8 w-32" />
   </div>
   <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
     <div className="flex items-center gap-3">
     <Skeleton className="h-10 w-10 rounded-full" />
     <div>
      <Skeleton className="h-4 w-32 mb-1" />
      <Skeleton className="h-3 w-20" />
     </div>
     </div>
     <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    ))}
   </div>
   </div>

   {/* Plants card skeleton */}
   <div className="bg-primary/5 border border-border rounded-lg p-6">
   <div className="flex items-center justify-between mb-4">
    <div>
    <Skeleton className="h-6 w-40 mb-2" />
    <Skeleton className="h-4 w-32" />
    </div>
    <Skeleton className="h-8 w-24" />
   </div>
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="border rounded-lg p-4">
     <Skeleton className="h-6 w-3/4 mb-2" />
     <Skeleton className="h-4 w-1/2 mb-4" />
     <div className="space-y-2">
     <Skeleton className="h-4 w-full" />
     <Skeleton className="h-4 w-full" />
     </div>
     <Skeleton className="h-10 w-full mt-4" />
    </div>
    ))}
   </div>
   </div>
  </div>

  {/* Sidebar skeleton */}
  <div className="space-y-6">
   <div className="bg-primary/5 border border-border rounded-lg p-6">
   <Skeleton className="h-6 w-24 mb-4" />
   <div className="space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
   </div>
   </div>
  </div>
  </div>
 </div>
 );
}

/**
 * Skeleton for analytics page cards and charts
 */
function AnalyticsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Insights banner skeleton */}
      <Skeleton className="h-32 w-full rounded-xl" />

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-primary/5 border border-border rounded-lg p-6">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Plant Health Overview skeleton */}
      <div className="bg-primary/5 border border-border rounded-lg p-6">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Charts skeleton */}
      <div className="bg-primary/5 border border-border rounded-lg p-6">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 flex-1 rounded-r-full" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
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
  PlantDetailsPageSkeleton,
  HouseholdCardSkeleton,
  ProfileHeaderSkeleton,
  ProfileInformationSkeleton,
  SecuritySettingsSkeleton,
  DangerZoneSkeleton,
  HouseholdDetailsSkeleton,
  AnalyticsSkeleton,
};
