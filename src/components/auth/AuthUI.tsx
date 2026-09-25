import { AlertCircle } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

/** Page frame shared by sign in, forgot password and reset password */
export function AuthShell({
  title,
  description,
  children,
}: {
  title?: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background pb-28 lg:pb-0">
      <main className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <Logo className="h-12 w-auto" />
            <h1 className="font-display text-[28px] font-bold tracking-[-0.04em] text-foreground mt-3">
              {title ?? (
                <>
                  <span className="dark:text-sprout-success">sprout</span><span className="dark:text-sprout-cream">hub</span>
                </>
              )}
            </h1>
            <p className="text-[15px] font-medium text-muted-foreground mt-0.5">{description}</p>
          </div>
          <div className="rounded-tile bg-card p-5 sm:p-6 mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}

/** Classes that mark an input as invalid: a terracotta ring instead of red */
export const invalidInputClasses = "ring-2 ring-sprout-warning focus-visible:ring-sprout-warning";

/**
 * A field's validation message. Dark text beside a terracotta icon: terracotta text on the
 * light background doesn't have enough contrast to read.
 */
export function FieldError({ children, testId }: { children: React.ReactNode; testId?: string }) {
  return (
    <p className={cn("flex items-start gap-1.5 text-[13px] font-semibold text-foreground px-1 mt-1.5")} data-testid={testId}>
      <AlertCircle className="w-4 h-4 shrink-0 text-sprout-warning" aria-hidden="true" />
      {children}
    </p>
  );
}
