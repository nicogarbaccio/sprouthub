export interface RoomOption {
 value: string;
 label: string;
 icon: string;
}

// Constant for unassigned/no room value
export const NO_ROOM_VALUE = "__no_room__";

export interface RoomTheme {
 background: string;
 border: string;
 iconBg: string;
 accent: string;
}

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
export const ROOM_THEMES: Record<string, RoomTheme> = {
 'living-room': {
 background: 'bg-sprout-cream/20 dark:bg-sprout-cream/10',
 border: 'border-sprout-cream/40 dark:border-sprout-cream/20',
 iconBg: 'bg-sprout-cream/30 dark:bg-sprout-cream/15',
 accent: 'text-sprout-dark dark:text-sprout-light'
 },
 'bedroom': {
 background: 'bg-sprout-pale dark:bg-sprout-medium/10',
 border: 'border-sprout-light/40 dark:border-sprout-medium/20',
 iconBg: 'bg-sprout-light/30 dark:bg-sprout-medium/15',
 accent: 'text-sprout-dark dark:text-sprout-light'
 },
 'kitchen': {
 background: 'bg-sprout-warning/10 dark:bg-sprout-warning/5',
 border: 'border-sprout-warning/30 dark:border-sprout-warning/15',
 iconBg: 'bg-sprout-warning/20 dark:bg-sprout-warning/10',
 accent: 'text-sprout-dark dark:text-sprout-cream'
 },
 'bathroom': {
 background: 'bg-sprout-water/10 dark:bg-sprout-water/5',
 border: 'border-sprout-water/30 dark:border-sprout-water/15',
 iconBg: 'bg-sprout-water/20 dark:bg-sprout-water/10',
 accent: 'text-sprout-dark dark:text-sprout-water'
 },
 'office': {
 background: 'bg-neutral-light dark:bg-sprout-dark/30',
 border: 'border-neutral-medium/40 dark:border-sprout-medium/20',
 iconBg: 'bg-neutral-medium/20 dark:bg-sprout-medium/15',
 accent: 'text-neutral-dark dark:text-neutral-light'
 },
 'dining-room': {
 background: 'bg-sprout-cream/15 dark:bg-sprout-cream/8',
 border: 'border-sprout-cream/35 dark:border-sprout-cream/18',
 iconBg: 'bg-sprout-cream/25 dark:bg-sprout-cream/12',
 accent: 'text-sprout-dark dark:text-sprout-cream'
 },
 'balcony': {
 background: 'bg-sprout-water/15 dark:bg-sprout-water/8',
 border: 'border-sprout-water/35 dark:border-sprout-water/18',
 iconBg: 'bg-sprout-water/25 dark:bg-sprout-water/12',
 accent: 'text-sprout-dark dark:text-sprout-water'
 },
 'garden': {
 background: 'bg-sprout-success/10 dark:bg-sprout-success/5',
 border: 'border-sprout-success/30 dark:border-sprout-success/15',
 iconBg: 'bg-sprout-success/20 dark:bg-sprout-success/10',
 accent: 'text-sprout-dark dark:text-sprout-success'
 },
 'greenhouse': {
 background: 'bg-sprout-light/20 dark:bg-sprout-primary/10',
 border: 'border-sprout-light/40 dark:border-sprout-primary/20',
 iconBg: 'bg-sprout-light/30 dark:bg-sprout-primary/15',
 accent: 'text-sprout-dark dark:text-sprout-light'
 },
 'study': {
 background: 'bg-sprout-medium/10 dark:bg-sprout-medium/5',
 border: 'border-sprout-medium/30 dark:border-sprout-medium/15',
 iconBg: 'bg-sprout-medium/20 dark:bg-sprout-medium/10',
 accent: 'text-sprout-dark dark:text-sprout-light'
 },
 'unassigned': {
 background: 'bg-neutral-light dark:bg-neutral-dark/20',
 border: 'border-neutral-medium/40 dark:border-neutral-medium/20',
 iconBg: 'bg-neutral-medium/20 dark:bg-neutral-medium/10',
 accent: 'text-neutral-dark dark:text-neutral-light'
 }
};

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

export const getRoomTheme = (roomValue?: string | null): RoomTheme => {
 if (!roomValue) return ROOM_THEMES.unassigned;
 
 return ROOM_THEMES[roomValue] || {
 background: 'bg-neutral-light dark:bg-neutral-dark/20',
 border: 'border-neutral-medium/40 dark:border-neutral-medium/20',
 iconBg: 'bg-neutral-medium/20 dark:bg-neutral-medium/10',
 accent: 'text-neutral-dark dark:text-neutral-light'
 };
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