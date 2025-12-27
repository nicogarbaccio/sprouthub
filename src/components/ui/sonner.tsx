import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const isMobile = useIsMobile();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={isMobile ? "top-center" : "bottom-right"}
      expand={false}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/50 group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-sm group-[.toaster]:rounded-xl group-[.toaster]:py-4 group-[.toaster]:px-5 group-[.toaster]:gap-3 group-[.toaster]:transition-all group-[.toaster]:duration-300",
          title: "group-[.toast]:font-semibold group-[.toast]:text-base",
          description:
            "group-[.toast]:text-sm group-[.toast]:text-muted-foreground group-[.toast]:mt-1",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:font-medium group-[.toast]:transition-all group-[.toast]:hover:scale-105 group-[.toast]:hover:shadow-md",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:font-medium group-[.toast]:transition-all group-[.toast]:hover:bg-muted/80",
          closeButton:
            "group-[.toast]:bg-background/50 group-[.toast]:border group-[.toast]:border-border/30 group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-background group-[.toast]:hover:text-foreground group-[.toast]:transition-all group-[.toast]:hover:scale-110 group-[.toast]:rounded-lg",
          // Success variant (sprout green)
          success:
            "group-[.toaster]:bg-sprout-success/10 group-[.toaster]:border-sprout-success/30 group-[.toaster]:text-sprout-success dark:group-[.toaster]:bg-sprout-success/20 dark:group-[.toaster]:border-sprout-success/40",
          // Error variant (sprout error red)
          error:
            "group-[.toaster]:bg-sprout-error/10 group-[.toaster]:border-sprout-error/30 group-[.toaster]:text-sprout-error dark:group-[.toaster]:bg-sprout-error/20 dark:group-[.toaster]:border-sprout-error/40",
          // Warning variant (sprout warning orange)
          warning:
            "group-[.toaster]:bg-sprout-warning/10 group-[.toaster]:border-sprout-warning/30 group-[.toaster]:text-sprout-warning dark:group-[.toaster]:bg-sprout-warning/20 dark:group-[.toaster]:border-sprout-warning/40",
          // Info variant (sprout water blue)
          info: "group-[.toaster]:bg-sprout-water/10 group-[.toaster]:border-sprout-water/30 group-[.toaster]:text-sprout-water dark:group-[.toaster]:bg-sprout-water/20 dark:group-[.toaster]:border-sprout-water/40",
        },
        style: {
          // Add subtle shadow for depth
          boxShadow:
            "0 10px 40px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)",
        },
        duration: 4000,
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
