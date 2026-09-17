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

// Every card gets the same fixed width per breakpoint so cards never change size between rooms.
// Width = (100% - total gap) / columns, with gap-6 (1.5rem) between cards. Using flex-wrap +
// justify-center (rather than a CSS grid) means an incomplete final row — the leftover cards of a
// room whose count doesn't fill the row — is centered instead of pinned to the left edge, so a
// lonely 5th card sits under the middle of the row rather than orphaned in the corner.
//
// These are literal class strings so Tailwind's JIT actually emits them (interpolated arbitrary
// values like basis-[calc(...)] are otherwise dropped). Underscores are Tailwind's encoding for the
// spaces calc() requires around its operators.
const BASIS: Record<number, string> = {
 1: "basis-full",
 2: "basis-[calc((100%_-_1.5rem)/2)]",
 3: "basis-[calc((100%_-_3rem)/3)]",
 4: "basis-[calc((100%_-_4.5rem)/4)]",
 5: "basis-[calc((100%_-_6rem)/5)]",
 6: "basis-[calc((100%_-_7.5rem)/6)]",
};
const SM_BASIS: Record<number, string> = {
 1: "sm:basis-full",
 2: "sm:basis-[calc((100%_-_1.5rem)/2)]",
 3: "sm:basis-[calc((100%_-_3rem)/3)]",
 4: "sm:basis-[calc((100%_-_4.5rem)/4)]",
 5: "sm:basis-[calc((100%_-_6rem)/5)]",
 6: "sm:basis-[calc((100%_-_7.5rem)/6)]",
};
const MD_BASIS: Record<number, string> = {
 1: "md:basis-full",
 2: "md:basis-[calc((100%_-_1.5rem)/2)]",
 3: "md:basis-[calc((100%_-_3rem)/3)]",
 4: "md:basis-[calc((100%_-_4.5rem)/4)]",
 5: "md:basis-[calc((100%_-_6rem)/5)]",
 6: "md:basis-[calc((100%_-_7.5rem)/6)]",
};
const LG_BASIS: Record<number, string> = {
 1: "lg:basis-full",
 2: "lg:basis-[calc((100%_-_1.5rem)/2)]",
 3: "lg:basis-[calc((100%_-_3rem)/3)]",
 4: "lg:basis-[calc((100%_-_4.5rem)/4)]",
 5: "lg:basis-[calc((100%_-_6rem)/5)]",
 6: "lg:basis-[calc((100%_-_7.5rem)/6)]",
};
const XL_BASIS: Record<number, string> = {
 1: "xl:basis-full",
 2: "xl:basis-[calc((100%_-_1.5rem)/2)]",
 3: "xl:basis-[calc((100%_-_3rem)/3)]",
 4: "xl:basis-[calc((100%_-_4.5rem)/4)]",
 5: "xl:basis-[calc((100%_-_6rem)/5)]",
 6: "xl:basis-[calc((100%_-_7.5rem)/6)]",
};

export function CascadingGrid<T>({
 items,
 renderItem,
 className = "",
 itemDelay = 50,
 cols = { default: 1, md: 2, lg: 3, xl: 4 },
}: CascadingGridProps<T>) {
 // grow-0 keeps a lone card from stretching to fill the row; the basis classes fix its width.
 const itemWidth = cn(
 "grow-0 min-w-0",
 BASIS[cols.default] ?? "basis-full",
 cols.sm && SM_BASIS[cols.sm],
 cols.md && MD_BASIS[cols.md],
 cols.lg && LG_BASIS[cols.lg],
 cols.xl && XL_BASIS[cols.xl]
 );

 return (
 <div className={cn("flex flex-wrap justify-center gap-6", className)}>
  {items.map((item, index) => (
  <CascadingContainer
   key={index}
   delay={index * itemDelay}
   className={itemWidth}
  >
   {renderItem(item, index)}
  </CascadingContainer>
  ))}
 </div>
 );
}
