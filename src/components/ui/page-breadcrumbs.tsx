import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

/**
 * Smart breadcrumb component that can work in two modes:
 * 1. Auto mode: Automatically generates breadcrumbs from URL path
 * 2. Manual mode: Uses provided items array
 */
export const PageBreadcrumbs: React.FC<PageBreadcrumbsProps> = ({
  items,
  className,
}) => {
  const location = useLocation();

  // If items are provided, use them. Otherwise, auto-generate from path
  const breadcrumbItems = items || generateBreadcrumbsFromPath(location.pathname);

  // Don't show breadcrumbs on home page or if only one item
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {/* Always show home as first item */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span className="sr-only">Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <React.Fragment key={index}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

/**
 * Auto-generate breadcrumbs from URL path
 * This is a fallback when custom items aren't provided
 */
function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  segments.forEach((segment, index) => {
    // Build the href for this segment
    const href = "/" + segments.slice(0, index + 1).join("/");

    // Format the label (capitalize and replace hyphens)
    const label = formatSegmentLabel(segment);

    breadcrumbs.push({ label, href });
  });

  return breadcrumbs;
}

/**
 * Format a URL segment into a readable label
 */
function formatSegmentLabel(segment: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    "my-plants": "My Plants",
    "plant-catalog": "Plant Catalog",
    "plant-details": "Plant Details",
    households: "Households",
    settings: "Settings",
    profile: "Profile",
    about: "About",
  };

  if (specialCases[segment.toLowerCase()]) {
    return specialCases[segment.toLowerCase()];
  }

  // Default formatting: capitalize words and replace hyphens/underscores
  return segment
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
