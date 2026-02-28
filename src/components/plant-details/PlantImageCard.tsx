import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Lightbulb } from "lucide-react";
import PlantImage from "@/components/ui/plant-image";
import type { OverwateringRisk } from "@/utils/plants/overwatering";

interface BadgeInfo {
  text: string;
  colorClass: string;
  description: string;
}

interface PlantImageCardProps {
  imageSrc: string;
  plantNickname: string;
  overwatering?: OverwateringRisk;
  badgeInfo: BadgeInfo | null;
  onImageClick: () => void;
  onSmartTipsClick: () => void;
}

const PlantImageCard = ({
  imageSrc,
  plantNickname,
  overwatering,
  badgeInfo,
  onImageClick,
  onSmartTipsClick,
}: PlantImageCardProps) => {
  return (
    <div className="relative w-full">
      <div
        className="cursor-pointer group"
        onClick={onImageClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onImageClick();
          }
        }}
        aria-label={`View ${plantNickname} image in fullscreen`}
      >
        <PlantImage
          src={imageSrc}
          alt={plantNickname}
          className="w-full h-[240px] sm:h-[280px] md:h-[360px] lg:h-[320px] object-cover rounded-lg shadow-md"
        />
      </div>

      {/* Overwatering Warning */}
      {overwatering && overwatering.level !== "none" && (
        <Badge
          className={`absolute top-3 left-3 text-xs ${
            overwatering.level === "high"
              ? "bg-red-600 text-white border-red-600"
              : "bg-orange-500 text-white border-orange-500"
          }`}
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          {overwatering.level === "high"
            ? "Overwatering Risk"
            : "Watch Watering"}
        </Badge>
      )}

      {/* Smart Suggestions Badge */}
      {badgeInfo && (
        <Badge
          className={`absolute bottom-3 left-3 cursor-pointer transition-all duration-200 text-xs ${badgeInfo.colorClass}`}
          onClick={onSmartTipsClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSmartTipsClick();
            }
          }}
          aria-label={badgeInfo.description}
        >
          <Lightbulb className="w-3 h-3 mr-1" />
          {badgeInfo.text}
        </Badge>
      )}
    </div>
  );
};

export default PlantImageCard;
