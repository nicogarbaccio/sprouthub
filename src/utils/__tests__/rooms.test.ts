import { describe, it, expect } from 'vitest';
import { 
 getRoomLabel, 
 getRoomIcon, 
 getRoomTheme, 
 groupPlantsByRoom,
 ROOM_OPTIONS,
 ROOM_THEMES,
 NO_ROOM_VALUE,
 type RoomTheme
} from '../rooms';

describe('getRoomLabel', () => {
 it('returns correct labels for known room values', () => {
  expect(getRoomLabel('living-room')).toBe('Living Room');
  expect(getRoomLabel('bedroom')).toBe('Bedroom');
  expect(getRoomLabel('kitchen')).toBe('Kitchen');
  expect(getRoomLabel('bathroom')).toBe('Bathroom');
  expect(getRoomLabel('office')).toBe('Office');
  expect(getRoomLabel('dining-room')).toBe('Dining Room');
  expect(getRoomLabel('balcony')).toBe('Balcony');
  expect(getRoomLabel('garden')).toBe('Garden');
  expect(getRoomLabel('greenhouse')).toBe('Greenhouse');
  expect(getRoomLabel('study')).toBe('Study');
 });

 it('returns "Unassigned" for null room value', () => {
  expect(getRoomLabel(null)).toBe('Unassigned');
 });

 it('returns "Unassigned" for undefined room value', () => {
  expect(getRoomLabel(undefined)).toBe('Unassigned');
 });

 it('returns "Unassigned" for empty string', () => {
  expect(getRoomLabel('')).toBe('Unassigned');
 });

 it('formats unknown room values with proper capitalization', () => {
  expect(getRoomLabel('custom-room')).toBe('Custom Room');
  expect(getRoomLabel('my_special_room')).toBe('My Special Room');
  expect(getRoomLabel('outdoor-patio')).toBe('Outdoor Patio');
 });

 it('handles single word room values', () => {
  expect(getRoomLabel('basement')).toBe('Basement');
  expect(getRoomLabel('attic')).toBe('Attic');
 });

 it('handles mixed case in unknown room values', () => {
  expect(getRoomLabel('customRoom')).toBe('CustomRoom');
  expect(getRoomLabel('MyRoom')).toBe('MyRoom');
 });

 it('handles special characters in room values', () => {
  expect(getRoomLabel('room-with-hyphens')).toBe('Room With Hyphens');
  expect(getRoomLabel('room_with_underscores')).toBe('Room With Underscores');
  expect(getRoomLabel('room-mixed_separators')).toBe('Room Mixed Separators');
 });
});

describe('getRoomIcon', () => {
 it('returns correct icons for known room values', () => {
  expect(getRoomIcon('living-room')).toBe('🛋️');
  expect(getRoomIcon('bedroom')).toBe('🛏️');
  expect(getRoomIcon('kitchen')).toBe('🍽️');
  expect(getRoomIcon('bathroom')).toBe('🛁');
  expect(getRoomIcon('office')).toBe('💼');
  expect(getRoomIcon('dining-room')).toBe('🍽️');
  expect(getRoomIcon('balcony')).toBe('🌤️');
  expect(getRoomIcon('garden')).toBe('🌻');
  expect(getRoomIcon('greenhouse')).toBe('🪴');
  expect(getRoomIcon('study')).toBe('📚');
 });

 it('returns default icon for null room value', () => {
  expect(getRoomIcon(null)).toBe('📍');
 });

 it('returns default icon for undefined room value', () => {
  expect(getRoomIcon(undefined)).toBe('📍');
 });

 it('returns default icon for empty string', () => {
  expect(getRoomIcon('')).toBe('📍');
 });

 it('returns fallback icon for unknown room values', () => {
  expect(getRoomIcon('custom-room')).toBe('🏠');
  expect(getRoomIcon('unknown-space')).toBe('🏠');
  expect(getRoomIcon('outdoor-area')).toBe('🏠');
 });

 it('handles case sensitivity consistently', () => {
  expect(getRoomIcon('LIVING-ROOM')).toBe('🏠'); // Not found, returns fallback
  expect(getRoomIcon('Living-Room')).toBe('🏠'); // Not found, returns fallback
 });
});

describe('getRoomTheme', () => {
 it('returns correct themes for known room values', () => {
  const livingRoomTheme = getRoomTheme('living-room');
  expect(livingRoomTheme).toEqual(ROOM_THEMES['living-room']);
  
  const bedroomTheme = getRoomTheme('bedroom');
  expect(bedroomTheme).toEqual(ROOM_THEMES['bedroom']);
  
  const kitchenTheme = getRoomTheme('kitchen');
  expect(kitchenTheme).toEqual(ROOM_THEMES['kitchen']);
 });

 it('returns unassigned theme for null room value', () => {
  const theme = getRoomTheme(null);
  expect(theme).toEqual(ROOM_THEMES.unassigned);
 });

 it('returns unassigned theme for undefined room value', () => {
  const theme = getRoomTheme(undefined);
  expect(theme).toEqual(ROOM_THEMES.unassigned);
 });

 it('returns unassigned theme for empty string', () => {
  const theme = getRoomTheme('');
  expect(theme).toEqual(ROOM_THEMES.unassigned);
 });

 it('returns fallback theme for unknown room values', () => {
  const theme = getRoomTheme('custom-room');
  const expectedTheme: RoomTheme = {
   background: 'bg-neutral-light dark:bg-neutral-dark/20',
   border: 'border-neutral-medium/40 dark:border-neutral-medium/20',
   iconBg: 'bg-neutral-medium/20 dark:bg-neutral-medium/10',
   accent: 'text-neutral-dark dark:text-neutral-light'
  };
  expect(theme).toEqual(expectedTheme);
 });

 it('ensures all theme objects have required properties', () => {
  const theme = getRoomTheme('living-room');
  expect(theme).toHaveProperty('background');
  expect(theme).toHaveProperty('border');
  expect(theme).toHaveProperty('iconBg');
  expect(theme).toHaveProperty('accent');
  
  expect(typeof theme.background).toBe('string');
  expect(typeof theme.border).toBe('string');
  expect(typeof theme.iconBg).toBe('string');
  expect(typeof theme.accent).toBe('string');
 });

 it('validates all predefined room themes exist', () => {
  ROOM_OPTIONS.forEach(room => {
   const theme = getRoomTheme(room.value);
   expect(theme).toBeDefined();
   expect(theme).toHaveProperty('background');
   expect(theme).toHaveProperty('border');
   expect(theme).toHaveProperty('iconBg');
   expect(theme).toHaveProperty('accent');
  });
 });
});

describe('groupPlantsByRoom', () => {
 // Mock plant objects for testing
 interface MockPlant {
  id: string;
  name: string;
  room?: string | null;
 }

 const createMockPlant = (id: string, name: string, room?: string | null): MockPlant => ({
  id,
  name,
  room
 });

 it('groups plants by room correctly', () => {
  const plants = [
   createMockPlant('1', 'Snake Plant', 'living-room'),
   createMockPlant('2', 'Pothos', 'bedroom'),
   createMockPlant('3', 'Fiddle Leaf Fig', 'living-room'),
   createMockPlant('4', 'Spider Plant', 'kitchen')
  ];

  const grouped = groupPlantsByRoom(plants);

  expect(grouped['living-room']).toHaveLength(2);
  expect(grouped['living-room']).toEqual([
   expect.objectContaining({ name: 'Snake Plant' }),
   expect.objectContaining({ name: 'Fiddle Leaf Fig' })
  ]);
  expect(grouped['bedroom']).toHaveLength(1);
  expect(grouped['bedroom']).toEqual([
   expect.objectContaining({ name: 'Pothos' })
  ]);
  expect(grouped['kitchen']).toHaveLength(1);
  expect(grouped['kitchen']).toEqual([
   expect.objectContaining({ name: 'Spider Plant' })
  ]);
 });

 it('handles plants with null room values', () => {
  const plants = [
   createMockPlant('1', 'Plant 1', 'living-room'),
   createMockPlant('2', 'Plant 2', null),
   createMockPlant('3', 'Plant 3', undefined)
  ];

  const grouped = groupPlantsByRoom(plants);

  expect(grouped['living-room']).toHaveLength(1);
  expect(grouped['unassigned']).toHaveLength(2);
  expect(grouped['unassigned']).toEqual([
   expect.objectContaining({ name: 'Plant 2' }),
   expect.objectContaining({ name: 'Plant 3' })
  ]);
 });

 it('handles plants with NO_ROOM_VALUE constant', () => {
  const plants = [
   createMockPlant('1', 'Plant 1', 'bedroom'),
   createMockPlant('2', 'Plant 2', NO_ROOM_VALUE),
   createMockPlant('3', 'Plant 3', 'kitchen')
  ];

  const grouped = groupPlantsByRoom(plants);

  expect(grouped['bedroom']).toHaveLength(1);
  expect(grouped['kitchen']).toHaveLength(1);
  expect(grouped['unassigned']).toHaveLength(1);
  expect(grouped['unassigned']).toEqual([
   expect.objectContaining({ name: 'Plant 2' })
  ]);
 });

 it('sorts rooms alphabetically with unassigned last', () => {
  const plants = [
   createMockPlant('1', 'Plant 1', 'kitchen'),
   createMockPlant('2', 'Plant 2', null),
   createMockPlant('3', 'Plant 3', 'bedroom'),
   createMockPlant('4', 'Plant 4', 'bathroom')
  ];

  const grouped = groupPlantsByRoom(plants);
  const roomKeys = Object.keys(grouped);

  // Should be alphabetical by room label, with unassigned last
  expect(roomKeys).toEqual(['bathroom', 'bedroom', 'kitchen', 'unassigned']);
 });

 it('sorts custom room names alphabetically', () => {
  const plants = [
   createMockPlant('1', 'Plant 1', 'zebra-room'),
   createMockPlant('2', 'Plant 2', 'alpha-room'),
   createMockPlant('3', 'Plant 3', null),
   createMockPlant('4', 'Plant 4', 'beta-room')
  ];

  const grouped = groupPlantsByRoom(plants);
  const roomKeys = Object.keys(grouped);

  expect(roomKeys).toEqual(['alpha-room', 'beta-room', 'zebra-room', 'unassigned']);
 });

 it('handles empty plant array', () => {
  const plants: MockPlant[] = [];
  const grouped = groupPlantsByRoom(plants);

  expect(grouped).toEqual({});
  expect(Object.keys(grouped)).toHaveLength(0);
 });

 it('handles array with only unassigned plants', () => {
  const plants = [
   createMockPlant('1', 'Plant 1', null),
   createMockPlant('2', 'Plant 2', undefined),
   createMockPlant('3', 'Plant 3', NO_ROOM_VALUE)
  ];

  const grouped = groupPlantsByRoom(plants);

  expect(Object.keys(grouped)).toEqual(['unassigned']);
  expect(grouped['unassigned']).toHaveLength(3);
 });

 it('handles array with plants in single room', () => {
  const plants = [
   createMockPlant('1', 'Plant 1', 'living-room'),
   createMockPlant('2', 'Plant 2', 'living-room'),
   createMockPlant('3', 'Plant 3', 'living-room')
  ];

  const grouped = groupPlantsByRoom(plants);

  expect(Object.keys(grouped)).toEqual(['living-room']);
  expect(grouped['living-room']).toHaveLength(3);
 });

 it('preserves original plant objects', () => {
  const originalPlant = createMockPlant('1', 'Test Plant', 'bedroom');
  const plants = [originalPlant];

  const grouped = groupPlantsByRoom(plants);

  expect(grouped['bedroom'][0]).toBe(originalPlant);
  expect(grouped['bedroom'][0]).toEqual(originalPlant);
 });

 it('handles mixed known and custom room values', () => {
  const plants = [
   createMockPlant('1', 'Plant 1', 'living-room'), // Known room
   createMockPlant('2', 'Plant 2', 'custom-space'), // Custom room
   createMockPlant('3', 'Plant 3', 'bedroom'), // Known room
   createMockPlant('4', 'Plant 4', 'another-custom'), // Custom room
   createMockPlant('5', 'Plant 5', null) // Unassigned
  ];

  const grouped = groupPlantsByRoom(plants);
  const roomKeys = Object.keys(grouped);

  expect(roomKeys).toContain('living-room');
  expect(roomKeys).toContain('bedroom');
  expect(roomKeys).toContain('custom-space');
  expect(roomKeys).toContain('another-custom');
  expect(roomKeys).toContain('unassigned');
  
  // Unassigned should be last
  expect(roomKeys[roomKeys.length - 1]).toBe('unassigned');
 });

 it('works with generic plant objects', () => {
  interface GenericPlant {
   plantId: number;
   species: string;
   room?: string | null;
   other: boolean;
  }

  const genericPlants: GenericPlant[] = [
   { plantId: 1, species: 'Rose', room: 'garden', other: true },
   { plantId: 2, species: 'Fern', room: null, other: false }
  ];

  const grouped = groupPlantsByRoom(genericPlants);

  expect(grouped['garden']).toHaveLength(1);
  expect(grouped['unassigned']).toHaveLength(1);
  expect(grouped['garden'][0].species).toBe('Rose');
  expect(grouped['unassigned'][0].species).toBe('Fern');
 });
});
