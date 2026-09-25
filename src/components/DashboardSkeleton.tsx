import { Skeleton } from "@/components/ui/skeleton";

/**
 * Home while it loads: the same header, tile grid and "Up next" rows as the real page, so the
 * content settles into place instead of jumping. Grid classes mirror HomeTiles.
 */
export const DashboardSkeleton = () => {
  return (
    <div className="pt-3.5 pb-32 lg:pt-7 lg:pb-10 bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Header: date, greeting, bell */}
        <div className="flex items-center gap-3.5 px-1.5 lg:px-0">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 lg:h-10 w-44 rounded-xl" />
          </div>
          <Skeleton className="w-12 h-12 lg:w-[52px] lg:h-[52px] rounded-2xl lg:rounded-[18px]" />
        </div>

        {/* Tiles: weather, care streak, due today + attention */}
        <div className="mt-[18px] lg:mt-6 grid grid-cols-2 gap-2.5 md:gap-3.5 md:grid-cols-4 md:auto-rows-[170px]">
          <Skeleton className="col-span-2 md:row-span-2 min-h-[196px] rounded-tile" />
          <Skeleton className="md:row-span-2 min-h-[190px] rounded-tile" />
          <div className="flex flex-col gap-2.5 md:gap-3.5 md:row-span-2 min-w-0">
            <Skeleton className="flex-1 min-h-[110px] rounded-tile" />
            <Skeleton className="h-[62px] md:h-auto md:flex-1 rounded-3xl md:rounded-[32px]" />
          </div>
        </div>

        {/* Up next */}
        <div className="mt-[26px] lg:mt-7">
          <div className="flex items-baseline justify-between px-1.5 md:px-1">
            <Skeleton className="h-6 w-24 rounded-lg" />
            <Skeleton className="h-4 w-14" />
          </div>
          <Skeleton className="h-3 w-12 mt-4 mb-2 mx-1.5 md:mx-1" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-[22px] bg-card">
                <Skeleton className="w-12 h-12 shrink-0 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="w-11 h-11 shrink-0 rounded-2xl" />
              </div>
            ))}
          </div>
        </div>

        {/* Plant health */}
        <div className="mt-8">
          <div className="px-1.5 md:px-1 space-y-2">
            <Skeleton className="h-6 w-32 rounded-lg" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3.5 mt-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="min-h-[120px] rounded-card" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
