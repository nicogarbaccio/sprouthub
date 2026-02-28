import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptionCardProps<T extends string> {
  value: T;
  currentValue: T | undefined;
  onClick: (value: T) => void;
  label: string;
  description?: string;
  testId?: string;
}

export function OptionCard<T extends string>({
  value,
  currentValue,
  onClick,
  label,
  description,
  testId,
}: OptionCardProps<T>) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md border-2 bg-sprout-primary text-sprout-white border-sprout-medium",
        currentValue === value
          ? "border-sprout-success bg-sprout-success/20"
          : "border-sprout-medium hover:border-sprout-success/50"
      )}
      onClick={() => onClick(value)}
      data-testid={testId}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-sprout-white">{label}</h4>
            {description && (
              <p className="text-sm text-sprout-light mt-1">{description}</p>
            )}
          </div>
          {currentValue === value && (
            <CheckCircle className="w-5 h-5 text-sprout-success flex-shrink-0 ml-2" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
