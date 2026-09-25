import { Plus, Lightbulb } from "lucide-react";
import { getRoomIcon, getRoomLabel } from "@/utils/rooms";

interface EmptyRoomStateProps {
 roomKey: string;
 onAddPlant: () => void;
}

const EmptyRoomState = ({ roomKey, onAddPlant }: EmptyRoomStateProps) => {
 const roomLabel = getRoomLabel(roomKey);
 const roomIcon = getRoomIcon(roomKey);

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
 <div className="rounded-tile bg-card p-6 md:p-8 text-center">
  <div className="w-16 h-16 rounded-full bg-field flex items-center justify-center mx-auto mb-4">
  <span className="text-3xl" aria-hidden="true">{roomIcon}</span>
  </div>

  <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-foreground">
  No plants in {roomLabel} yet
  </h3>

  <p className="text-[15px] text-muted-foreground mt-1.5 mb-5 max-w-md mx-auto">
  {roomKey === "unassigned"
   ? "These plants haven't been assigned to a room yet. Edit them to organize your collection!"
   : `Add some plants to brighten up your ${roomLabel.toLowerCase()}. Plants improve air quality and add natural beauty to any space.`}
  </p>

  {/* Plant suggestions */}
  <div className="mb-6">
  <div className="flex items-center justify-center gap-1.5 mb-2.5 text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground">
   <Lightbulb className="w-4 h-4" />
   Great for {roomLabel.toLowerCase()}
  </div>
  <div className="flex flex-wrap justify-center gap-1.5">
   {suggestions.slice(0, 4).map((plant) => (
   <span key={plant} className="px-3 py-1.5 rounded-full bg-field text-foreground text-[13px] font-bold">
    {plant}
   </span>
   ))}
  </div>
  </div>

  <button
  type="button"
  onClick={onAddPlant}
  className="h-12 px-5 rounded-[18px] bg-sprout-cream text-sprout-dark font-bold text-[15px] inline-flex items-center gap-2"
  >
  <Plus className="w-5 h-5" strokeWidth={2.5} />
  Add Plant to {roomLabel}
  </button>
 </div>
 );
};

export default EmptyRoomState;
