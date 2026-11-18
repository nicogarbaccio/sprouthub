import type { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";

/**
 * The shadcn-style `toast({ title, description, variant })` call, shown through Sonner.
 *
 * The app only mounts Sonner's <Toaster /> (src/components/ui/sonner.tsx). This module used
 * to be shadcn's own toast store, which no mounted component rendered, so every toast sent
 * through it (account deletion, profile and preference saves, plant action errors) was
 * silently dropped. Keeping the call shape lets the hooks that use it work unchanged; new
 * code can use `sonner` or `@/utils/notifications/toast` directly.
 */

interface ToastOptions {
  title?: ReactNode;
  description?: ReactNode;
  variant?: "default" | "destructive";
}

function toast({ title, description, variant }: ToastOptions) {
  const show = variant === "destructive" ? sonnerToast.error : sonnerToast;
  const id = title ? show(title, { description }) : show(description);
  return { id, dismiss: () => sonnerToast.dismiss(id) };
}

function useToast() {
  return { toast, dismiss: (id?: string | number) => sonnerToast.dismiss(id) };
}

export { useToast, toast };
