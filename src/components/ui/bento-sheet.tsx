/**
 * Shared look for bento-style modals: a bottom sheet on phones and a rounded, centered panel
 * from `sm` up. The positioning overrides live here rather than in the shared Dialog and
 * AlertDialog so dialogs that haven't moved over keep their look.
 */

/** Pins the dialog to the bottom of the screen on phones and slides it up, like a sheet */
export const phoneSheetClasses =
  "max-sm:top-auto max-sm:bottom-0 max-sm:translate-y-0 max-sm:rounded-t-[36px] max-sm:rounded-b-none " +
  "max-sm:data-[state=open]:slide-in-from-bottom-full max-sm:data-[state=closed]:slide-out-to-bottom-full " +
  "max-sm:data-[state=open]:zoom-in-100 max-sm:data-[state=closed]:zoom-out-100 " +
  "max-sm:pb-[max(env(safe-area-inset-bottom),24px)]";

/**
 * Bottom sheet on phones, centered panel from `sm` up. For AlertDialogContent.
 * `grid-cols-1` sizes the dialog's grid column as minmax(0, 1fr); without it a sideways-scrolling
 * chip row (filters, tabs, rooms) stretches the whole sheet past the edge of the screen.
 */
export const sheetClasses =
  "border-0 bg-background gap-0 grid-cols-1 p-4 pt-2.5 sm:p-6 sm:rounded-[32px] max-h-[92dvh] overflow-y-auto " +
  phoneSheetClasses;

/**
 * The same sheet for DialogContent. The last child is the dialog's built-in close button,
 * hidden here so the header can carry its own (see `sheetIconButtonClasses`).
 */
export const dialogSheetClasses = `${sheetClasses} [&>button:last-child]:hidden`;

/** Drag handle shown at the top of the sheet on phones */
export function SheetGrabber() {
  return <div className="w-11 h-[5px] rounded-full bg-muted-foreground/40 mx-auto sm:hidden" aria-hidden="true" />;
}

/** Header row: icon or thumbnail, title block, then a close or back button */
export const sheetHeaderClasses = "flex flex-row items-center gap-3 space-y-0 mt-[18px] sm:mt-0 px-1.5 text-left";

/** Square close / back button in the sheet header */
export const sheetIconButtonClasses =
  "w-11 h-11 shrink-0 rounded-2xl bg-card text-foreground flex items-center justify-center hover:bg-card/80";

export const sheetTitleClasses = "font-display text-2xl font-bold tracking-[-0.03em] text-foreground";

/** The one filled action at the bottom of a sheet */
export const sheetPrimaryButtonClasses =
  "w-full h-[60px] rounded-[22px] bg-sprout-dark text-sprout-cream flex items-center justify-center gap-2 font-bold text-base " +
  "shadow-[inset_0_0_0_2px_#dfc490] hover:bg-sprout-dark/90 disabled:opacity-50 disabled:shadow-none transition-opacity";

/** A quieter action next to or under the primary one */
export const sheetSecondaryButtonClasses =
  "w-full h-[60px] rounded-[22px] bg-card text-foreground flex items-center justify-center gap-2 font-bold text-[15px] " +
  "hover:bg-card/80 disabled:opacity-50";
