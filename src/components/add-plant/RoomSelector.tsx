import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROOM_OPTIONS, NO_ROOM_VALUE } from "@/utils/rooms";

interface RoomSelectorProps {
  room: string;
  isCustomRoom: boolean;
  customRoom: string;
  onRoomChange: (value: string) => void;
  onCustomRoomToggle: (isCustom: boolean) => void;
  onCustomRoomChange: (value: string) => void;
}

export const RoomSelector = ({
  room,
  isCustomRoom,
  customRoom,
  onRoomChange,
  onCustomRoomToggle,
  onCustomRoomChange,
}: RoomSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label
        htmlFor="room"
        className="text-plant-text dark:text-zinc-200"
      >
        Room (Optional)
      </Label>
      <Select
        value={room}
        onValueChange={(value) => {
          if (value === "custom") {
            onCustomRoomToggle(true);
            onRoomChange(customRoom);
          } else {
            onCustomRoomToggle(false);
            onCustomRoomChange("");
            onRoomChange(value);
          }
        }}
      >
        <SelectTrigger
          className="border-plant-secondary/30 focus:border-plant-primary [&>span]:line-clamp-none"
          data-testid="room-select-trigger"
        >
          <SelectValue placeholder="Select a room or leave empty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_ROOM_VALUE}>No room assigned</SelectItem>
          {ROOM_OPTIONS.map((roomOption) => (
            <SelectItem key={roomOption.value} value={roomOption.value}>
              <span className="flex items-center gap-2 min-w-0">
                <span className="shrink-0">{roomOption.icon}</span>
                <span className="truncate">{roomOption.label}</span>
              </span>
            </SelectItem>
          ))}
          <SelectItem value="custom">🏠 Custom Room</SelectItem>
        </SelectContent>
      </Select>

      {isCustomRoom && (
        <div className="space-y-1">
          <Label
            htmlFor="custom_room"
            className="text-plant-text dark:text-zinc-200 text-sm"
          >
            Custom Room Name
          </Label>
          <Input
            id="custom_room"
            value={customRoom}
            onChange={(e) => {
              onCustomRoomChange(e.target.value);
              onRoomChange(e.target.value);
            }}
            placeholder="Enter custom room name"
            className="border-plant-secondary/30 focus:border-plant-primary"
            data-testid="custom-room-input"
          />
        </div>
      )}
    </div>
  );
};
