import { Card, CardContent } from "@/components/ui/card";
import { Sprout, ChevronDown } from "lucide-react";

interface RepottingGuideCardProps {
  plantNickname: string;
  onClick: () => void;
}

const RepottingGuideCard = ({
  plantNickname,
  onClick,
}: RepottingGuideCardProps) => {
  return (
    <Card
      className="mb-6 cursor-pointer hover:border-plant-primary/50 transition-colors"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent className="flex items-center justify-between py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-plant-primary/10 flex items-center justify-center">
            <Sprout className="w-5 h-5 text-plant-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Repotting Guide
            </p>
            <p className="text-xs text-muted-foreground">
              Tips for repotting {plantNickname}
            </p>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90" />
      </CardContent>
    </Card>
  );
};

export default RepottingGuideCard;
