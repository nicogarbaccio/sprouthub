import { Toaster as Sonner, toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toasts in the bento style: a rounded card with a coloured icon square, matching the
 * notification center. Error and warning share terracotta; the app doesn't use red.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  // The app's own theme (not the OS), so toasts match the page when they differ
  const { actualTheme } = useTheme();
  const isMobile = useIsMobile();

  return (
    <Sonner
      theme={actualTheme}
      className="toaster group"
      position={isMobile ? "top-center" : "bottom-right"}
      expand={false}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-0 group-[.toaster]:rounded-[22px] group-[.toaster]:py-3.5 group-[.toaster]:pl-3.5 group-[.toaster]:pr-5 group-[.toaster]:gap-3 group-[.toaster]:items-center group-[.toaster]:shadow-[0_12px_40px_rgba(29,60,40,0.18)]",
          icon:
            "!w-10 !h-10 !m-0 shrink-0 rounded-[14px] bg-field text-foreground flex items-center justify-center [&>svg]:!w-5 [&>svg]:!h-5",
          content: "gap-0.5",
          title: "group-[.toast]:font-bold group-[.toast]:text-[15px] group-[.toast]:text-foreground",
          description: "group-[.toast]:text-[13px] group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:!bg-sprout-dark group-[.toast]:!text-sprout-cream group-[.toast]:!rounded-[12px] group-[.toast]:!h-9 group-[.toast]:!px-3.5 group-[.toast]:!font-bold group-[.toast]:!text-[13px]",
          cancelButton:
            "group-[.toast]:!bg-field group-[.toast]:!text-foreground group-[.toast]:!rounded-[12px] group-[.toast]:!h-9 group-[.toast]:!px-3.5 group-[.toast]:!font-bold group-[.toast]:!text-[13px]",
          closeButton:
            "group-[.toast]:!bg-card group-[.toast]:!border-0 group-[.toast]:!text-muted-foreground group-[.toast]:hover:!text-foreground group-[.toast]:!shadow-md",
          // The icon square is coloured per type. Written out in full so Tailwind generates them.
          success: "[&_[data-icon]]:!bg-sprout-success [&_[data-icon]]:!text-sprout-dark",
          error: "[&_[data-icon]]:!bg-sprout-warning [&_[data-icon]]:!text-sprout-dark",
          warning: "[&_[data-icon]]:!bg-sprout-warning [&_[data-icon]]:!text-sprout-dark",
          info: "[&_[data-icon]]:!bg-sprout-water [&_[data-icon]]:!text-sprout-dark",
        },
        duration: 4000,
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
