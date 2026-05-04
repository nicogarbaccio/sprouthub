import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface PageHeroStat {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  variant?: "default" | "warning" | "info";
}

interface PageHeroProps {
  icon: LucideIcon;
  title: string | ReactNode;
  subtitle: string;
  stats?: PageHeroStat[];
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHero({
  icon: Icon,
  title,
  subtitle,
  stats,
  actions,
  children,
}: PageHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sprout-dark via-sprout-primary to-sprout-medium p-6 sm:p-8 mb-8">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-sprout-light/10 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-sprout-cream/10 rounded-full translate-y-1/2 -translate-x-1/4" />
      <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-sprout-water/10 rounded-full" />

      <div className="relative z-10">
        {children || (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {typeof title === "string" ? (
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      {title}
                    </h1>
                  ) : (
                    title
                  )}
                </div>
                <p className="text-white/80 text-sm sm:text-base max-w-xl mt-1">
                  {subtitle}
                </p>
              </div>
              {actions && <div className="flex gap-2">{actions}</div>}
            </div>

            {stats && stats.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-5">
                {stats.map((stat) => {
                  const variantClasses =
                    stat.variant === "warning"
                      ? "bg-sprout-warning/20 text-sprout-cream"
                      : stat.variant === "info"
                        ? "bg-sprout-water/20 text-sprout-water"
                        : "bg-white/10 text-white/90";

                  return (
                    <div
                      key={stat.label}
                      className={`flex items-center gap-2 backdrop-blur-sm rounded-lg px-3 py-2 text-sm ${variantClasses}`}
                    >
                      {stat.icon && <stat.icon className="w-4 h-4" />}
                      <span className="font-medium">{stat.value}</span>{" "}
                      {stat.label}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
