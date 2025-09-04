import { Button } from "@/components/ui/button";
import { Plus, Lightbulb } from "lucide-react";
import { getRoomIcon, getRoomLabel, getRoomTheme } from "@/utils/rooms";

interface EmptyRoomStateProps {
 roomKey: string;
 onAddPlant: () => void;
}

const EmptyRoomState = ({ roomKey, onAddPlant }: EmptyRoomStateProps) => {
 const roomLabel = getRoomLabel(roomKey);
 const roomIcon = getRoomIcon(roomKey);
 const roomTheme = getRoomTheme(roomKey);

 // Room-specific plant suggestions
 const getRoomSuggestions = (roomKey: string) => {
  const suggestions: Record<string, string[]> = {
   "living-room": [
    "Snake Plant",
    "Fiddle Leaf Fig",
    "Monstera",
    "Peace Lily",
   ],
   bedroom: ["Snake Plant", "ZZ Plant", "Pothos", "Lavender"],
   kitchen: ["Herbs (Basil, Mint)", "Spider Plant", "Pothos", "Aloe Vera"],
   bathroom: ["ZZ Plant", "Air Plant", "Boston Fern", "Bamboo"],
   office: ["ZZ Plant", "Snake Plant", "Pothos", "Peace Lily"],
   "dining-room": [
    "Fiddle Leaf Fig",
    "Rubber Plant",
    "Peace Lily",
    "Monstera",
   ],
   balcony: ["Succulents", "Herbs", "Geraniums", "Ivy"],
   garden: ["Tomatoes", "Herbs", "Flowers", "Vegetables"],
   greenhouse: ["Tropical Plants", "Orchids", "Seedlings", "Rare Plants"],
   study: ["ZZ Plant", "Snake Plant", "Desk Plants", "Air Plants"],
   unassigned: ["Snake Plant", "Pothos", "ZZ Plant", "Spider Plant"],
  };

  return suggestions[roomKey] || suggestions["unassigned"];
 };

 const suggestions = getRoomSuggestions(roomKey);

 return (
  <div
   className={`${roomTheme.background} ${roomTheme.border} border-2 rounded-2xl p-8 text-center`}
  >
   <div
    className={`${roomTheme.iconBg} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4`}
   >
    <span className="text-4xl">{roomIcon}</span>
   </div>

   <h3 className="text-xl font-semibold text-plant-text mb-2 ">
    No plants in {roomLabel} yet
   </h3>

   <p className="text-plant-text/60 mb-6 max-w-md mx-auto">
    {roomKey === "unassigned"
     ? "These plants haven't been assigned to a room yet. Edit them to organize your collection!"
     : `Add some plants to brighten up your ${roomLabel.toLowerCase()}. Plants improve air quality and add natural beauty to any space.`}
   </p>

   {/* Plant Suggestions */}
   <div className="mb-6">
    <div className="flex items-center justify-center gap-2 mb-3">
     <Lightbulb className="w-4 h-4 text-plant-primary" />
     <span className="text-sm font-medium text-plant-primary">
      Great plants for {roomLabel.toLowerCase()}:
     </span>
    </div>
    <div className="flex flex-wrap justify-center gap-2">
     {suggestions.slice(0, 4).map((plant, index) => (
      <span
       key={index}
       className={`px-3 py-1 ${roomTheme.iconBg} ${roomTheme.accent} text-xs rounded-full font-medium`}
      >
       {plant}
      </span>
     ))}
    </div>
   </div>

   <Button
    onClick={onAddPlant}
    className="bg-plant-primary hover:bg-plant-primary/90 text-white rounded-xl"
   >
    <Plus className="w-4 h-4 mr-2" />
    Add Plant to {roomLabel}
   </Button>
  </div>
 );
};

export default EmptyRoomState;
