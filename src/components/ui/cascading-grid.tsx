import React from "react";
import { CascadingContainer } from "./cascading-container";
import { cn } from "@/lib/utils";

interface CascadingGridProps<T> {
 items: T[];
 renderItem: (item: T, index: number) => React.ReactNode;
 className?: string;
 itemDelay?: number;
 cols?: {
 default: number;
 sm?: number;
 md?: number;
 lg?: number;
 xl?: number;
 };
 /**
  * When true, treat each breakpoint's `cols` value as a *maximum* and reduce it so the items
  * split into even rows — avoiding a lonely orphan card on the last line (e.g. 5 items render
  * 3+2 instead of 4+1). Rooms that fit in a single row are left untouched. Off by default so
  * existing fixed-column layouts are unaffected.
  */
 balance?: boolean;
}

/**
 * Fewest columns that keep `n` items in the minimum number of rows for `maxCols`, giving the most
 * even row distribution. Single-row layouts (n <= maxCols) are returned as-is so under-filled rooms
 * keep their standard card size rather than stretching to fill the width.
 */
function balanceCols(n: number, maxCols: number): number {
 if (n <= 0 || n <= maxCols) return maxCols;
 const rows = Math.ceil(n / maxCols);
 return Math.ceil(n / rows);
}

// Literal class maps so Tailwind's JIT actually emits every column class we can produce. Building
// these via string interpolation (`md:grid-cols-${n}`) silently fails for any class not already
// present verbatim elsewhere in the source (e.g. xl:grid-cols-3), leaving the grid unstyled.
const DEFAULT_COLS: Record<number, string> = {
 1: "grid-cols-1",
 2: "grid-cols-2",
 3: "grid-cols-3",
 4: "grid-cols-4",
 5: "grid-cols-5",
 6: "grid-cols-6",
};
const SM_COLS: Record<number, string> = {
 1: "sm:grid-cols-1",
 2: "sm:grid-cols-2",
 3: "sm:grid-cols-3",
 4: "sm:grid-cols-4",
 5: "sm:grid-cols-5",
 6: "sm:grid-cols-6",
};
const MD_COLS: Record<number, string> = {
 1: "md:grid-cols-1",
 2: "md:grid-cols-2",
 3: "md:grid-cols-3",
 4: "md:grid-cols-4",
 5: "md:grid-cols-5",
 6: "md:grid-cols-6",
};
const LG_COLS: Record<number, string> = {
 1: "lg:grid-cols-1",
 2: "lg:grid-cols-2",
 3: "lg:grid-cols-3",
 4: "lg:grid-cols-4",
 5: "lg:grid-cols-5",
 6: "lg:grid-cols-6",
};
const XL_COLS: Record<number, string> = {
 1: "xl:grid-cols-1",
 2: "xl:grid-cols-2",
 3: "xl:grid-cols-3",
 4: "xl:grid-cols-4",
 5: "xl:grid-cols-5",
 6: "xl:grid-cols-6",
};

export function CascadingGrid<T>({
 items,
 renderItem,
 className = "",
 itemDelay = 50,
 cols = { default: 1, md: 2, lg: 3, xl: 4 },
 balance = false,
}: CascadingGridProps<T>) {
 const resolve = (value: number) =>
 balance ? balanceCols(items.length, value) : value;

 const gridCols = cn(
 `grid gap-6`,
 DEFAULT_COLS[resolve(cols.default)] ?? "grid-cols-1",
 cols.sm && SM_COLS[resolve(cols.sm)],
 cols.md && MD_COLS[resolve(cols.md)],
 cols.lg && LG_COLS[resolve(cols.lg)],
 cols.xl && XL_COLS[resolve(cols.xl)],
 className
 );

 return (
 <div className={gridCols}>
  {items.map((item, index) => (
  <CascadingContainer key={index} delay={index * itemDelay}>
   {renderItem(item, index)}
  </CascadingContainer>
  ))}
 </div>
 );
}
