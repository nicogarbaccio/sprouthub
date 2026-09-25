export interface RoomOption {
 value: string;
 label: string;
 icon: string;
}

// Constant for unassigned/no room value
export const NO_ROOM_VALUE = "__no_room__";

export const ROOM_OPTIONS: RoomOption[] = [
 { value: 'living-room', label: 'Living Room', icon: '🛋️' },
 { value: 'bedroom', label: 'Bedroom', icon: '🛏️' },
 { value: 'kitchen', label: 'Kitchen', icon: '🍽️' },
 { value: 'bathroom', label: 'Bathroom', icon: '🛁' },
 { value: 'office', label: 'Office', icon: '💼' },
 { value: 'dining-room', label: 'Dining Room', icon: '🍽️' },
 { value: 'balcony', label: 'Balcony', icon: '🌤️' },
 { value: 'garden', label: 'Garden', icon: '🌻' },
 { value: 'greenhouse', label: 'Greenhouse', icon: '🪴' },
 { value: 'study', label: 'Study', icon: '📚' },
];

// Room themes for enhanced visual design with dark mode support

export const getRoomLabel = (roomValue?: string | null): string => {
 if (!roomValue) return 'Unassigned';
 
 const room = ROOM_OPTIONS.find(option => option.value === roomValue);
 return room ? room.label : roomValue.split(/[-_]/).map(word => 
 word.charAt(0).toUpperCase() + word.slice(1)
 ).join(' ');
};

export const getRoomIcon = (roomValue?: string | null): string => {
 if (!roomValue) return '📍';
 
 const room = ROOM_OPTIONS.find(option => option.value === roomValue);
 return room ? room.icon : '🏠'; // Default icon for custom rooms
};

export const groupPlantsByRoom = <T extends { room?: string | null }>(plants: T[]) => {
 const grouped = plants.reduce((acc, plant) => {
 const room = plant.room && plant.room !== NO_ROOM_VALUE ? plant.room : 'unassigned';
 if (!acc[room]) acc[room] = [];
 acc[room].push(plant);
 return acc;
 }, {} as Record<string, T[]>);
 
 // Sort rooms alphabetically, but keep 'unassigned' last
 const sortedRooms = Object.keys(grouped).sort((a, b) => {
 if (a === 'unassigned') return 1;
 if (b === 'unassigned') return -1;
 return getRoomLabel(a).localeCompare(getRoomLabel(b));
 });

 const sortedGrouped: Record<string, T[]> = {};
 sortedRooms.forEach(room => {
 sortedGrouped[room] = grouped[room];
 });

 return sortedGrouped;
}; 