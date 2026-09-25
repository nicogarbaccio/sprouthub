import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROOM_OPTIONS, NO_ROOM_VALUE } from "@/utils/rooms";
import { cn } from "@/lib/utils";

interface RoomSelectorProps {
  room: string;
  isCustomRoom: boolean;
  customRoom: string;
  onRoomChange: (value: string) => void;
  onCustomRoomToggle: (isCustom: boolean) => void;
  onCustomRoomChange: (value: string) => void;
}

/** A swipeable row of room chips, with "Custom" revealing a name field. */
export const RoomSelector = ({
  room,
  isCustomRoom,
  customRoom,
  onRoomChange,
  onCustomRoomToggle,
  onCustomRoomChange,
}: RoomSelectorProps) => {
  const chipClass = (selected: boolean) =>
    cn(
      "flex-none h-11 px-3.5 rounded-full flex items-center font-bold text-sm transition-colors",
      selected ? "bg-foreground text-background" : "bg-card text-foreground"
    );

  const pick = (value: string) => {
    onCustomRoomToggle(false);
    onCustomRoomChange("");
    onRoomChange(value);
  };

  return (
    <div className="space-y-2" data-testid="room-select-trigger">
      <div className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground px-1.5">
        Room
      </div>
      <div
        role="radiogroup"
        aria-label="Room"
        className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6"
      >
        {ROOM_OPTIONS.map((option) => {
          const selected = !isCustomRoom && room === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={chipClass(selected)}
              onClick={() => pick(option.value)}
            >
              {option.label}
            </button>
          );
        })}
        <button
          type="button"
          role="radio"
          aria-checked={isCustomRoom}
          className={chipClass(isCustomRoom)}
          onClick={() => {
            onCustomRoomToggle(true);
            onRoomChange(customRoom);
          }}
        >
          Custom
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={!isCustomRoom && room === NO_ROOM_VALUE}
          className={chipClass(!isCustomRoom && room === NO_ROOM_VALUE)}
          onClick={() => pick(NO_ROOM_VALUE)}
        >
          No room
        </button>
      </div>

      {isCustomRoom && (
        <div className="rounded-3xl bg-card p-4 space-y-1.5">
          <Label
            htmlFor="custom_room"
            className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground"
          >
            Custom room name
          </Label>
          <Input
            id="custom_room"
            value={customRoom}
            onChange={(e) => {
              onCustomRoomChange(e.target.value);
              onRoomChange(e.target.value);
            }}
            placeholder="e.g. Sunroom"
            className="h-11 rounded-2xl border-0 bg-field text-[15px] font-semibold"
            data-testid="custom-room-input"
            autoFocus
          />
        </div>
      )}
    </div>
  );
};
