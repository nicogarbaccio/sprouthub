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
}

export function CascadingGrid<T>({
 items,
 renderItem,
 className = "",
 itemDelay = 50,
 cols = { default: 1, md: 2, lg: 3, xl: 4 },
}: CascadingGridProps<T>) {
 const gridCols = cn(
  `grid gap-6`,
  cols.default === 1 ? "grid-cols-1" : `grid-cols-${cols.default}`,
  cols.sm && `sm:grid-cols-${cols.sm}`,
  cols.md && `md:grid-cols-${cols.md}`,
  cols.lg && `lg:grid-cols-${cols.lg}`,
  cols.xl && `xl:grid-cols-${cols.xl}`,
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
