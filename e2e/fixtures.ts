/**
 * The data seed.setup.ts gives the e2e account before every run. Specs reference these
 * instead of assuming whatever plants an account happens to have, so a test only breaks
 * when the app does.
 */

export const TEST_PROFILE = {
  firstName: 'Ellie',
  lastName: 'Tester',
  username: 'e2e_tester',
} as const;

export const TEST_HOUSEHOLD_NAME = 'E2E Greenhouse';

export interface SeedPlant {
  nickname: string;
  plantType: string;
  /** Stored value, as in ROOM_OPTIONS (src/utils/rooms.ts) */
  room: string;
  /** What the app shows for it */
  roomLabel: string;
  /** Days between waterings */
  scheduleDays: number;
  /** Last watered this many days ago; with scheduleDays this sets the plant's status */
  lastWateredDaysAgo: number;
  inHousehold?: boolean;
}

export const SEED_PLANTS = {
  // Watered 2 of 7 days ago
  onSchedule: {
    nickname: 'Monty',
    plantType: 'Monstera Deliciosa',
    room: 'living-room',
    roomLabel: 'Living Room',
    scheduleDays: 7,
    lastWateredDaysAgo: 2,
  },
  // 2 days past its 7-day schedule
  overdue: {
    nickname: 'Disco',
    plantType: 'Pothos',
    room: 'living-room',
    roomLabel: 'Living Room',
    scheduleDays: 7,
    lastWateredDaysAgo: 9,
  },
  // Exactly at its 14-day schedule
  dueToday: {
    nickname: 'Snakey',
    plantType: 'Snake Plant',
    room: 'bedroom',
    roomLabel: 'Bedroom',
    scheduleDays: 14,
    lastWateredDaysAgo: 14,
  },
  // Shared with the test household
  household: {
    nickname: 'Fernando',
    plantType: 'Boston Fern',
    room: 'kitchen',
    roomLabel: 'Kitchen',
    scheduleDays: 5,
    lastWateredDaysAgo: 1,
    inHousehold: true,
  },
} satisfies Record<string, SeedPlant>;

export const SEED_PLANT_LIST: SeedPlant[] = Object.values(SEED_PLANTS);

/** Room labels as the app shows them */
export const SEED_ROOM_LABELS = [...new Set(SEED_PLANT_LIST.map((p) => p.roomLabel))];
