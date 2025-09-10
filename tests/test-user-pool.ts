/**
 * Test user pool management - alternative to creating new users every test
 */

export interface TestUser {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Pre-defined test users that can be reused across tests
 * These users would be created once and cleaned up periodically
 */
export const TEST_USER_POOL: TestUser[] = [
  {
    firstName: 'Test',
    lastName: 'User1',
    username: 'e2etest1',
    email: 'e2etest1@sprouthub-test.local',
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!'
  },
  {
    firstName: 'Plant',
    lastName: 'Manager1',
    username: 'planttest1',
    email: 'planttest1@sprouthub-test.local',
    password: 'PlantTest123!',
    confirmPassword: 'PlantTest123!'
  },
  {
    firstName: 'Auth',
    lastName: 'Tester',
    username: 'authtest1',
    email: 'authtest1@sprouthub-test.local',
    password: 'AuthTest123!',
    confirmPassword: 'AuthTest123!'
  },
  {
    firstName: 'Garden',
    lastName: 'User',
    username: 'gardentest1',
    email: 'gardentest1@sprouthub-test.local',
    password: 'GardenTest123!',
    confirmPassword: 'GardenTest123!'
  }
];

/**
 * Get a test user from the pool (round-robin)
 * This avoids creating new users for every test
 */
export function getTestUser(testName?: string): TestUser {
  // Use test name hash or random index to distribute users
  const index = testName 
    ? Math.abs(hashString(testName)) % TEST_USER_POOL.length
    : Math.floor(Math.random() * TEST_USER_POOL.length);
    
  return TEST_USER_POOL[index];
}

/**
 * Create a unique test user (fallback for tests that need isolation)
 */
export function createUniqueTestUser(prefix = 'test'): TestUser {
  const timestamp = Date.now();
  return {
    firstName: 'Test',
    lastName: 'User',
    username: `${prefix}${timestamp}`,
    email: `${prefix}-${timestamp}@sprouthub-test.local`,
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!'
  };
}

// Simple hash function for consistent user selection
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}