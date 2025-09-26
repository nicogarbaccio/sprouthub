/**
 * Mock data utilities for watering record E2E tests
 * Provides consistent mock data for testing race condition fixes and loading states
 */

export interface MockWateringRecord {
  id: string;
  plant_id: string;
  watered_at: string;
  notes?: string;
  performed_by: string;
  created_at: string;
}

export interface MockPlantWithRecords {
  id: string;
  nickname: string;
  plant_type: string;
  image?: string;
  room?: string;
  suggested_watering_days: number;
  is_outdoor_plant: boolean;
  household_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  watering_records: MockWateringRecord[];
}

// Base test date for consistent testing
export const MOCK_CURRENT_DATE = '2025-01-20T12:00:00Z';
export const MOCK_USER_ID = 'test-user-123';
export const MOCK_HOUSEHOLD_ID = 'test-household-456';

// Mock watering records for testing
export const mockWateringRecords: MockWateringRecord[] = [
  {
    id: 'watering-1',
    plant_id: 'test-plant-1',
    watered_at: '2025-01-18T10:00:00Z',
    notes: 'Regular morning watering',
    performed_by: MOCK_USER_ID,
    created_at: '2025-01-18T10:00:00Z'
  },
  {
    id: 'watering-2',
    plant_id: 'test-plant-1',
    watered_at: '2025-01-15T14:30:00Z',
    notes: 'Deep watering session with fertilizer',
    performed_by: MOCK_USER_ID,
    created_at: '2025-01-15T14:30:00Z'
  },
  {
    id: 'watering-3',
    plant_id: 'test-plant-1',
    watered_at: '2025-01-12T09:15:00Z',
    notes: 'Quick watering before work',
    performed_by: MOCK_USER_ID,
    created_at: '2025-01-12T09:15:00Z'
  },
  {
    id: 'watering-4',
    plant_id: 'test-plant-1',
    watered_at: '2025-01-08T16:45:00Z',
    notes: undefined, // Test record without notes
    performed_by: MOCK_USER_ID,
    created_at: '2025-01-08T16:45:00Z'
  }
];

// Mock plant with watering records for testing
export const mockPlantWithRecords: MockPlantWithRecords = {
  id: 'test-plant-1',
  nickname: 'Test Monstera',
  plant_type: 'Monstera Deliciosa',
  image: 'https://example.com/monstera.jpg',
  room: 'Living Room',
  suggested_watering_days: 7,
  is_outdoor_plant: false,
  household_id: MOCK_HOUSEHOLD_ID,
  user_id: MOCK_USER_ID,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-20T10:00:00Z',
  watering_records: mockWateringRecords
};

// API response builders for consistent mocking
export const buildWateringRecordsResponse = (records: MockWateringRecord[]) => ({
  data: records,
  error: null,
  count: records.length,
  status: 200,
  statusText: 'OK'
});

export const buildDeleteResponse = (success: boolean = true) => ({
  data: null,
  error: success ? null : { message: 'Database error', code: 'DELETE_ERROR' },
  count: success ? 1 : 0,
  status: success ? 200 : 400,
  statusText: success ? 'OK' : 'Bad Request'
});

export const buildInsertResponse = (record: MockWateringRecord, success: boolean = true) => ({
  data: success ? [record] : null,
  error: success ? null : { message: 'Insert error', code: 'INSERT_ERROR' },
  count: success ? 1 : 0,
  status: success ? 201 : 400,
  statusText: success ? 'Created' : 'Bad Request'
});

// Test scenarios for different race condition cases
export const raceConditionScenarios = {
  // Normal scenario - delete completes before refresh
  normal: {
    deleteDelay: 50,
    refreshDelay: 100,
    expectOrder: ['delete-start', 'delete-complete', 'refresh-start', 'refresh-complete', 'toast-shown']
  },

  // Fast scenario - both operations complete quickly
  fast: {
    deleteDelay: 10,
    refreshDelay: 20,
    expectOrder: ['delete-start', 'delete-complete', 'refresh-start', 'refresh-complete', 'toast-shown']
  },

  // Slow scenario - longer delays to test loading states
  slow: {
    deleteDelay: 200,
    refreshDelay: 300,
    expectOrder: ['delete-start', 'delete-complete', 'refresh-start', 'refresh-complete', 'toast-shown']
  },

  // Error scenario - delete fails
  deleteError: {
    deleteDelay: 50,
    refreshDelay: 100,
    deleteSuccess: false,
    expectOrder: ['delete-start', 'delete-error', 'refresh-start', 'refresh-complete', 'error-toast-shown']
  }
};

// Helper function to create a mock watering record
export const createMockWateringRecord = (overrides: Partial<MockWateringRecord> = {}): MockWateringRecord => ({
  id: `watering-${Date.now()}`,
  plant_id: 'test-plant-1',
  watered_at: new Date().toISOString(),
  notes: 'Test watering record',
  performed_by: MOCK_USER_ID,
  created_at: new Date().toISOString(),
  ...overrides
});

// Helper function to simulate API call delays
export const createDelayedResponse = async <T>(
  response: T,
  delay: number
): Promise<T> => {
  await new Promise(resolve => setTimeout(resolve, delay));
  return response;
};

// Mock API route patterns
export const API_ROUTES = {
  WATERING_RECORDS_SELECT: '**/rest/v1/watering_records?select=*',
  WATERING_RECORDS_DELETE: '**/rest/v1/watering_records?*',
  WATERING_RECORDS_INSERT: '**/rest/v1/watering_records'
};

// Helper to filter records by plant ID (simulating DB query)
export const getRecordsByPlantId = (plantId: string): MockWateringRecord[] => {
  return mockWateringRecords
    .filter(record => record.plant_id === plantId)
    .sort((a, b) => new Date(b.watered_at).getTime() - new Date(a.watered_at).getTime());
};

// Helper to remove record by ID (simulating delete operation)
export const removeRecordById = (recordId: string): MockWateringRecord[] => {
  return mockWateringRecords.filter(record => record.id !== recordId);
};

// Mock scenarios for testing different states
export const mockScenarios = {
  // Plant with multiple watering records
  plantWithRecords: {
    plant: mockPlantWithRecords,
    records: mockWateringRecords
  },

  // Plant with no watering records
  plantWithoutRecords: {
    plant: { ...mockPlantWithRecords, watering_records: [] },
    records: []
  },

  // Plant with single record (edge case)
  plantWithSingleRecord: {
    plant: { ...mockPlantWithRecords, watering_records: [mockWateringRecords[0]] },
    records: [mockWateringRecords[0]]
  },

  // Plant with many records (performance test)
  plantWithManyRecords: {
    plant: mockPlantWithRecords,
    records: Array.from({ length: 20 }, (_, index) => createMockWateringRecord({
      id: `watering-bulk-${index}`,
      watered_at: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(),
      notes: `Bulk watering record ${index + 1}`
    }))
  }
};

// Error scenarios for robust testing
export const errorScenarios = {
  networkError: {
    error: { message: 'Network request failed', code: 'NETWORK_ERROR' },
    status: 0,
    statusText: 'Network Error'
  },

  unauthorized: {
    error: { message: 'Unauthorized access', code: 'UNAUTHORIZED' },
    status: 401,
    statusText: 'Unauthorized'
  },

  notFound: {
    error: { message: 'Record not found', code: 'NOT_FOUND' },
    status: 404,
    statusText: 'Not Found'
  },

  serverError: {
    error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    status: 500,
    statusText: 'Internal Server Error'
  }
};