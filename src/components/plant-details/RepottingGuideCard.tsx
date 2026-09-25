import { ChevronRight, Sprout } from "lucide-react";

interface RepottingGuideCardProps {
  plantNickname: string;
  onClick: () => void;
}

/** Row that opens the repotting guide, styled like the Journal tile above it */
const RepottingGuideCard = ({ plantNickname, onClick }: RepottingGuideCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-card bg-card p-[18px] flex items-center gap-3.5 text-left"
    >
      <div className="w-11 h-11 shrink-0 rounded-[14px] bg-sprout-primary text-sprout-cream flex items-center justify-center">
        <Sprout className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-foreground">Repotting Guide</p>
        <p className="text-sm text-muted-foreground truncate">Tips for repotting {plantNickname}</p>
      </div>
      <ChevronRight className="w-5 h-5 shrink-0 text-muted-foreground" />
    </button>
  );
};

export default RepottingGuideCard;
