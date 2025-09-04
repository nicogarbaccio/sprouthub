import { Plus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlantInfoSectionProps {
 name: string;
 botanicalName: string;
 description: string;
 careLevel: string;
 toxicity: string;
 onAddToCollection: () => void;
 isAuthenticated?: boolean;
 onSignInToAdd?: () => void;
}

const PlantInfoSection = ({
 name,
 botanicalName,
 description,
 careLevel,
 toxicity,
 onAddToCollection,
 isAuthenticated = false,
 onSignInToAdd,
}: PlantInfoSectionProps) => {
 const getCareColor = (level: string) => {
  switch (level) {
   case "Easy":
    return "bg-sprout-success/20 text-sprout-success border-sprout-success/30";
   case "Medium":
    return "bg-sprout-warning/20 text-sprout-warning border-sprout-warning/30";
   case "Hard":
    return "bg-sprout-warning/40 text-sprout-dark border-sprout-warning/50";
   default:
    return "bg-neutral-light text-neutral-dark border-neutral-medium/30";
  }
 };

 return (
  <div className="space-y-6">
   <div>
    <div className="flex items-center gap-3 mb-2">
     <h1 className="text-3xl font-bold text-foreground ">
      {name}
     </h1>
     <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${getCareColor(
       careLevel
      )}`}
     >
      {careLevel}
     </span>
    </div>
    <p className="text-lg text-muted-foreground italic mb-4">
     {botanicalName}
    </p>
    <p className="text-foreground leading-relaxed">{description}</p>
   </div>

   {isAuthenticated ? (
    <Button
     onClick={onAddToCollection}
     className="w-full bg-sprout-success hover:bg-sprout-success/90 text-white rounded-xl font-medium py-3"
     size="lg"
    >
     <Plus className="w-5 h-5 mr-2" />
     Add to My Collection
    </Button>
   ) : (
    <Button
     onClick={onSignInToAdd}
     className="w-full bg-sprout-success hover:bg-sprout-success/90 text-white rounded-xl font-medium py-3"
     size="lg"
    >
     <LogIn className="w-5 h-5 mr-2" />
     Sign in to Add to Collection
    </Button>
   )}

   <div className="p-3 bg-sprout-warning/10 rounded-lg border border-sprout-warning/30">
    <p className="text-sm text-sprout-warning">
     <strong>Pet Safety:</strong> {toxicity}
    </p>
   </div>
  </div>
 );
};

export default PlantInfoSection;
