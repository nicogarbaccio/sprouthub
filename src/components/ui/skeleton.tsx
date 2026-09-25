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
  className={cn("rounded-md bg-muted-foreground/[0.12] skeleton-shimmer", className)}
  {...props}
 />
 );
}

/**
 * A catalog plant card: image well, name, type and actions
 */
function PlantCardSkeleton({ className }: { className?: string }) {
 return (
 <div className={cn("bg-card rounded-card p-2", className)}>
  <Skeleton className="w-full h-[148px] md:h-[180px] rounded-well" />
  <div className="px-1.5 pt-2.5 pb-1.5 space-y-2">
  <Skeleton className="h-5 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
  <Skeleton className="h-8 w-full rounded-xl" />
  <Skeleton className="h-8 w-full rounded-xl" />
  <Skeleton className="h-10 w-full rounded-[14px]" />
  </div>
 </div>
 );
}

/**
 * A plant card on My Plants: image well with a status pill, name, type and a water button
 */
function MyPlantCardSkeleton() {
 return (
 <div className="bg-card rounded-card p-2 flex flex-col">
  <Skeleton className="h-[148px] md:h-[170px] w-full rounded-well" />
  <div className="px-1.5 pt-2.5 pb-1 space-y-2">
  <Skeleton className="h-5 w-3/4" />
  <Skeleton className="h-3.5 w-1/2" />
  </div>
  <Skeleton className="h-10 w-full rounded-[14px] mt-2" />
 </div>
 );
}

/**
 * The filter chips row under the My Plants header
 */
function SearchFilterBarSkeleton() {
 return (
 <div className="flex gap-2 overflow-hidden">
  {[64, 88, 96, 80, 104].map((w, i) => (
  <Skeleton key={i} className="h-10 shrink-0 rounded-full" style={{ width: w }} />
  ))}
 </div>
 );
}

/**
 * A room on My Plants: its heading and count pill, then a grid of plant cards
 */
function RoomSectionSkeleton({ cardCount = 3 }: { cardCount?: number }) {
 return (
 <div className="mt-6">
  <div className="flex items-center gap-2.5 px-1.5 lg:px-0">
  <Skeleton className="h-6 w-32 rounded-lg" />
  <Skeleton className="h-6 w-8 rounded-full" />
  </div>
  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-3.5 mt-3">
  {Array.from({ length: cardCount }).map((_, i) => (
   <MyPlantCardSkeleton key={i} />
  ))}
  </div>
 </div>
 );
}

/**
 * A plant's own page: hero photo, name, watering tile and care tiles
 */
function PlantDetailsPageSkeleton({ className }: { className?: string }) {
 return (
 <div className={cn("max-w-4xl mx-auto md:px-6 lg:px-8", className)}>
  <Skeleton className="h-[340px] md:h-[400px] w-full rounded-none rounded-b-[40px] md:rounded-[40px]" />
  <div className="px-[22px] md:px-2 pt-5 space-y-2.5">
  <div className="flex gap-1.5">
   <Skeleton className="h-6 w-20 rounded-full" />
   <Skeleton className="h-6 w-24 rounded-full" />
  </div>
  <Skeleton className="h-10 md:h-12 w-3/5 rounded-xl" />
  <Skeleton className="h-4 w-2/5" />
  </div>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3.5 px-4 md:px-0 pt-[18px]">
  <Skeleton className="col-span-2 md:col-span-4 h-[108px] md:h-[120px] rounded-tile" />
  {Array.from({ length: 4 }).map((_, i) => (
   <Skeleton key={i} className="min-h-[120px] rounded-card" />
  ))}
  <Skeleton className="col-span-2 h-36 rounded-card" />
  <Skeleton className="col-span-2 h-36 rounded-card" />
  </div>
 </div>
 );
}

/**
 * A household's page: back link, name, stat tiles, then the plants and members panels
 */
function HouseholdDetailsSkeleton({ className }: { className?: string }) {
 return (
 <div className={cn(className)}>
  <Skeleton className="h-9 w-28 rounded-full" />
  <div className="mt-3 px-1.5 lg:px-0 space-y-2">
  <Skeleton className="h-9 w-56 rounded-xl" />
  <Skeleton className="h-4 w-72 max-w-full" />
  </div>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3.5 mt-[18px]">
  {Array.from({ length: 4 }).map((_, i) => (
   <Skeleton key={i} className="h-[84px] rounded-card" />
  ))}
  </div>
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
  <div className="lg:col-span-2 rounded-card bg-card p-5 md:p-6 space-y-3">
   <Skeleton className="h-6 w-40 rounded-lg" />
   <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
   {Array.from({ length: 4 }).map((_, i) => (
    <Skeleton key={i} className="h-[72px] rounded-[22px]" />
   ))}
   </div>
  </div>
  <div className="rounded-card bg-card p-5 md:p-6 space-y-3">
   <Skeleton className="h-6 w-28 rounded-lg" />
   {Array.from({ length: 3 }).map((_, i) => (
   <Skeleton key={i} className="h-[60px] rounded-[18px]" />
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
 <div className={cn("rounded-tile bg-card p-5 space-y-4", className)}>
  <div className="flex items-start gap-3">
  <Skeleton className="h-12 w-12 rounded-2xl" />
  <div className="flex-1 space-y-2">
   <Skeleton className="h-6 w-2/3" />
   <Skeleton className="h-4 w-1/2" />
  </div>
  <Skeleton className="h-6 w-16 rounded-full" />
  </div>
  <Skeleton className="h-14 w-full rounded-[18px]" />
  <Skeleton className="h-12 w-full rounded-2xl" />
 </div>
 );
}

/**
 * Skeleton for analytics page cards and charts
 */
function AnalyticsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2.5 md:space-y-3.5", className)}>
      {/* Header */}
      <div className="px-1.5 lg:px-0 pb-2 space-y-2">
        <Skeleton className="h-9 w-44 rounded-2xl" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[132px] md:h-[150px] rounded-card" />
        ))}
      </div>

      {/* Insights */}
      <Skeleton className="h-40 w-full rounded-tile" />

      {/* Two columns of section cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 md:gap-3.5">
        <div className="space-y-2.5 md:space-y-3.5">
          <Skeleton className="h-72 w-full rounded-tile" />
          <Skeleton className="h-48 w-full rounded-tile" />
        </div>
        <div className="space-y-2.5 md:space-y-3.5">
          <Skeleton className="h-72 w-full rounded-tile" />
          <Skeleton className="h-48 w-full rounded-tile" />
        </div>
      </div>
    </div>
  );
}

export {
 Skeleton,
 PlantCardSkeleton,
 SearchFilterBarSkeleton,
 RoomSectionSkeleton,
 PlantDetailsPageSkeleton,
 HouseholdCardSkeleton,
 HouseholdDetailsSkeleton,
 AnalyticsSkeleton,
};
