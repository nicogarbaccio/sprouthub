/**
 * Mock watering history data for pattern detection testing
 * This provides realistic watering patterns for comprehensive testing
 */

export interface MockWateringEvent {
  id: string;
  user_plant_id: string;
  watered_at: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

/**
 * Creates mock watering history for different pattern scenarios
 */
export const createMockWateringHistory = {
  // Early watering pattern - consistently waters 2 days early
  earlyPattern: (plantId: string): MockWateringEvent[] => [
    {
      id: 'watering-early-8',
      user_plant_id: plantId,
      watered_at: '2025-09-08T10:00:00Z', // Most recent
      created_at: '2025-09-08T10:00:00Z',
      updated_at: '2025-09-08T10:00:00Z'
    },
    {
      id: 'watering-early-7',
      user_plant_id: plantId,
      watered_at: '2025-09-01T10:00:00Z', // 5 days early (scheduled for 3rd)
      created_at: '2025-09-01T10:00:00Z',
      updated_at: '2025-09-01T10:00:00Z'
    },
    {
      id: 'watering-early-6',
      user_plant_id: plantId,
      watered_at: '2025-08-25T10:00:00Z', // 2 days early (scheduled for 27th)
      created_at: '2025-08-25T10:00:00Z',
      updated_at: '2025-08-25T10:00:00Z'
    },
    {
      id: 'watering-early-5',
      user_plant_id: plantId,
      watered_at: '2025-08-18T10:00:00Z', // 2 days early (scheduled for 20th)
      created_at: '2025-08-18T10:00:00Z',
      updated_at: '2025-08-18T10:00:00Z'
    },
    {
      id: 'watering-early-4',
      user_plant_id: plantId,
      watered_at: '2025-08-11T10:00:00Z', // 2 days early (scheduled for 13th)
      created_at: '2025-08-11T10:00:00Z',
      updated_at: '2025-08-11T10:00:00Z'
    },
    {
      id: 'watering-early-3',
      user_plant_id: plantId,
      watered_at: '2025-08-04T10:00:00Z', // 2 days early (scheduled for 6th)
      created_at: '2025-08-04T10:00:00Z',
      updated_at: '2025-08-04T10:00:00Z'
    },
    {
      id: 'watering-early-2',
      user_plant_id: plantId,
      watered_at: '2025-07-28T10:00:00Z', // 2 days early (scheduled for 30th)
      created_at: '2025-07-28T10:00:00Z',
      updated_at: '2025-07-28T10:00:00Z'
    },
    {
      id: 'watering-early-1',
      user_plant_id: plantId,
      watered_at: '2025-07-21T10:00:00Z', // Initial watering
      created_at: '2025-07-21T10:00:00Z',
      updated_at: '2025-07-21T10:00:00Z'
    }
  ],

  // Late watering pattern - consistently waters 2-3 days late
  latePattern: (plantId: string): MockWateringEvent[] => [
    {
      id: 'watering-late-8',
      user_plant_id: plantId,
      watered_at: '2025-09-01T10:00:00Z', // Most recent - 2 days late
      created_at: '2025-09-01T10:00:00Z',
      updated_at: '2025-09-01T10:00:00Z'
    },
    {
      id: 'watering-late-7',
      user_plant_id: plantId,
      watered_at: '2025-08-23T10:00:00Z', // 2 days late (scheduled for 21st)
      created_at: '2025-08-23T10:00:00Z',
      updated_at: '2025-08-23T10:00:00Z'
    },
    {
      id: 'watering-late-6',
      user_plant_id: plantId,
      watered_at: '2025-08-17T10:00:00Z', // 3 days late (scheduled for 14th)
      created_at: '2025-08-17T10:00:00Z',
      updated_at: '2025-08-17T10:00:00Z'
    },
    {
      id: 'watering-late-5',
      user_plant_id: plantId,
      watered_at: '2025-08-09T10:00:00Z', // 2 days late (scheduled for 7th)
      created_at: '2025-08-09T10:00:00Z',
      updated_at: '2025-08-09T10:00:00Z'
    },
    {
      id: 'watering-late-4',
      user_plant_id: plantId,
      watered_at: '2025-08-02T10:00:00Z', // 1 day late (scheduled for 1st)
      created_at: '2025-08-02T10:00:00Z',
      updated_at: '2025-08-02T10:00:00Z'
    },
    {
      id: 'watering-late-3',
      user_plant_id: plantId,
      watered_at: '2025-07-27T10:00:00Z', // 2 days late (scheduled for 25th)
      created_at: '2025-07-27T10:00:00Z',
      updated_at: '2025-07-27T10:00:00Z'
    },
    {
      id: 'watering-late-2',
      user_plant_id: plantId,
      watered_at: '2025-07-20T10:00:00Z', // 2 days late (scheduled for 18th)
      created_at: '2025-07-20T10:00:00Z',
      updated_at: '2025-07-20T10:00:00Z'
    },
    {
      id: 'watering-late-1',
      user_plant_id: plantId,
      watered_at: '2025-07-11T10:00:00Z', // Initial watering
      created_at: '2025-07-11T10:00:00Z',
      updated_at: '2025-07-11T10:00:00Z'
    }
  ],

  // Irregular pattern - very inconsistent timing
  irregularPattern: (plantId: string): MockWateringEvent[] => [
    {
      id: 'watering-irregular-8',
      user_plant_id: plantId,
      watered_at: '2025-09-07T10:00:00Z', // 3 days early
      created_at: '2025-09-07T10:00:00Z',
      updated_at: '2025-09-07T10:00:00Z'
    },
    {
      id: 'watering-irregular-7',
      user_plant_id: plantId,
      watered_at: '2025-08-26T10:00:00Z', // 5 days late (very inconsistent)
      created_at: '2025-08-26T10:00:00Z',
      updated_at: '2025-08-26T10:00:00Z'
    },
    {
      id: 'watering-irregular-6',
      user_plant_id: plantId,
      watered_at: '2025-08-14T10:00:00Z', // 2 days early
      created_at: '2025-08-14T10:00:00Z',
      updated_at: '2025-08-14T10:00:00Z'
    },
    {
      id: 'watering-irregular-5',
      user_plant_id: plantId,
      watered_at: '2025-08-11T10:00:00Z', // 4 days late
      created_at: '2025-08-11T10:00:00Z',
      updated_at: '2025-08-11T10:00:00Z'
    },
    {
      id: 'watering-irregular-4',
      user_plant_id: plantId,
      watered_at: '2025-07-31T10:00:00Z', // On time
      created_at: '2025-07-31T10:00:00Z',
      updated_at: '2025-07-31T10:00:00Z'
    },
    {
      id: 'watering-irregular-3',
      user_plant_id: plantId,
      watered_at: '2025-07-20T10:00:00Z', // 4 days early
      created_at: '2025-07-20T10:00:00Z',
      updated_at: '2025-07-20T10:00:00Z'
    },
    {
      id: 'watering-irregular-2',
      user_plant_id: plantId,
      watered_at: '2025-07-19T10:00:00Z', // 6 days late
      created_at: '2025-07-19T10:00:00Z',
      updated_at: '2025-07-19T10:00:00Z'
    },
    {
      id: 'watering-irregular-1',
      user_plant_id: plantId,
      watered_at: '2025-07-06T10:00:00Z', // Initial watering
      created_at: '2025-07-06T10:00:00Z',
      updated_at: '2025-07-06T10:00:00Z'
    }
  ],

  // Consistent pattern - exactly on schedule
  consistentPattern: (plantId: string): MockWateringEvent[] => [
    {
      id: 'watering-consistent-8',
      user_plant_id: plantId,
      watered_at: '2025-09-03T10:00:00Z', // Exactly on time
      created_at: '2025-09-03T10:00:00Z',
      updated_at: '2025-09-03T10:00:00Z'
    },
    {
      id: 'watering-consistent-7',
      user_plant_id: plantId,
      watered_at: '2025-08-27T10:00:00Z', // Exactly on time
      created_at: '2025-08-27T10:00:00Z',
      updated_at: '2025-08-27T10:00:00Z'
    },
    {
      id: 'watering-consistent-6',
      user_plant_id: plantId,
      watered_at: '2025-08-20T10:00:00Z', // Exactly on time
      created_at: '2025-08-20T10:00:00Z',
      updated_at: '2025-08-20T10:00:00Z'
    },
    {
      id: 'watering-consistent-5',
      user_plant_id: plantId,
      watered_at: '2025-08-13T10:00:00Z', // Exactly on time
      created_at: '2025-08-13T10:00:00Z',
      updated_at: '2025-08-13T10:00:00Z'
    },
    {
      id: 'watering-consistent-4',
      user_plant_id: plantId,
      watered_at: '2025-08-06T10:00:00Z', // Exactly on time
      created_at: '2025-08-06T10:00:00Z',
      updated_at: '2025-08-06T10:00:00Z'
    },
    {
      id: 'watering-consistent-3',
      user_plant_id: plantId,
      watered_at: '2025-07-30T10:00:00Z', // Exactly on time
      created_at: '2025-07-30T10:00:00Z',
      updated_at: '2025-07-30T10:00:00Z'
    },
    {
      id: 'watering-consistent-2',
      user_plant_id: plantId,
      watered_at: '2025-07-23T10:00:00Z', // Exactly on time
      created_at: '2025-07-23T10:00:00Z',
      updated_at: '2025-07-23T10:00:00Z'
    },
    {
      id: 'watering-consistent-1',
      user_plant_id: plantId,
      watered_at: '2025-07-16T10:00:00Z', // Initial watering
      created_at: '2025-07-16T10:00:00Z',
      updated_at: '2025-07-16T10:00:00Z'
    }
  ],

  // Insufficient data - only 2 watering events
  insufficientData: (plantId: string): MockWateringEvent[] => [
    {
      id: 'watering-insufficient-2',
      user_plant_id: plantId,
      watered_at: '2025-09-08T10:00:00Z', // Most recent
      created_at: '2025-09-08T10:00:00Z',
      updated_at: '2025-09-08T10:00:00Z'
    },
    {
      id: 'watering-insufficient-1',
      user_plant_id: plantId,
      watered_at: '2025-09-01T10:00:00Z', // Only one other event
      created_at: '2025-09-01T10:00:00Z',
      updated_at: '2025-09-01T10:00:00Z'
    }
  ],

  // Mixed pattern - starts consistent then becomes irregular
  mixedPattern: (plantId: string): MockWateringEvent[] => [
    {
      id: 'watering-mixed-8',
      user_plant_id: plantId,
      watered_at: '2025-09-05T10:00:00Z', // Recent irregular behavior
      created_at: '2025-09-05T10:00:00Z',
      updated_at: '2025-09-05T10:00:00Z'
    },
    {
      id: 'watering-mixed-7',
      user_plant_id: plantId,
      watered_at: '2025-08-24T10:00:00Z', // 3 days late
      created_at: '2025-08-24T10:00:00Z',
      updated_at: '2025-08-24T10:00:00Z'
    },
    {
      id: 'watering-mixed-6',
      user_plant_id: plantId,
      watered_at: '2025-08-19T10:00:00Z', // 5 days late
      created_at: '2025-08-19T10:00:00Z',
      updated_at: '2025-08-19T10:00:00Z'
    },
    {
      id: 'watering-mixed-5',
      user_plant_id: plantId,
      watered_at: '2025-08-07T10:00:00Z', // On time (was consistent before)
      created_at: '2025-08-07T10:00:00Z',
      updated_at: '2025-08-07T10:00:00Z'
    },
    {
      id: 'watering-mixed-4',
      user_plant_id: plantId,
      watered_at: '2025-07-31T10:00:00Z', // On time
      created_at: '2025-07-31T10:00:00Z',
      updated_at: '2025-07-31T10:00:00Z'
    },
    {
      id: 'watering-mixed-3',
      user_plant_id: plantId,
      watered_at: '2025-07-24T10:00:00Z', // On time
      created_at: '2025-07-24T10:00:00Z',
      updated_at: '2025-07-24T10:00:00Z'
    },
    {
      id: 'watering-mixed-2',
      user_plant_id: plantId,
      watered_at: '2025-07-17T10:00:00Z', // On time
      created_at: '2025-07-17T10:00:00Z',
      updated_at: '2025-07-17T10:00:00Z'
    },
    {
      id: 'watering-mixed-1',
      user_plant_id: plantId,
      watered_at: '2025-07-10T10:00:00Z', // Initial watering
      created_at: '2025-07-10T10:00:00Z',
      updated_at: '2025-07-10T10:00:00Z'
    }
  ]
};

/**
 * Helper to setup mock watering history data in Playwright tests
 */
export async function setupMockWateringHistory(
  page: any, 
  plantId: string, 
  patternType: keyof typeof createMockWateringHistory,
  options: { verbose?: boolean } = {}
) {
  const { verbose = false } = options;
  const mockHistory = createMockWateringHistory[patternType](plantId);

  await page.addInitScript((plantId: string, history: MockWateringEvent[], verbose: boolean) => {
    (window as any).__mockWateringHistory = (window as any).__mockWateringHistory || {};
    (window as any).__mockWateringHistory[plantId] = history;
    
    if (verbose) {
      console.log(`🔧 Mock watering history set up for plant ${plantId}:`, {
        events: history.length,
        pattern: history.map(h => h.watered_at).join(', ')
      });
    }
  }, plantId, mockHistory, verbose);

  // Intercept watering records API calls (for useQuickPatternAnalysis hook)
  await page.route('**/rest/v1/watering_records*', async route => {
    const url = route.request().url();
    if (url.includes(`plant_id=eq.${plantId}`) || url.includes(`plant_id.eq.${plantId}`)) {
      if (verbose) console.log(`🔄 Intercepting watering_records request for plant ${plantId}`);
      
      // Transform mock history to match watering_records table structure
      const transformedHistory = mockHistory.map(event => ({
        id: event.id,
        plant_id: event.user_plant_id, // Map user_plant_id to plant_id
        watered_at: event.watered_at,
        notes: event.notes || null
      }));
      
      if (verbose) {
        console.log(`📊 Serving ${transformedHistory.length} watering records for analysis:`, 
          transformedHistory.map(h => h.watered_at).slice(0, 3)
        );
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
        },
        body: JSON.stringify(transformedHistory)
      });
    } else {
      await route.continue();
    }
  });

  // Also intercept user_plants table calls for plant details
  await page.route('**/rest/v1/user_plants*', async route => {
    const url = route.request().url();
    if (url.includes(`id=eq.${plantId}`) || url.includes(`id.eq.${plantId}`)) {
      if (verbose) console.log(`🔄 Intercepting user_plants request for plant ${plantId}`);
      
      // Mock plant details with suggested watering days
      const mockPlant = {
        id: plantId,
        suggested_watering_days: 7 // Default 7-day schedule
      };
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
        },
        body: JSON.stringify(mockPlant)
      });
    } else {
      await route.continue();
    }
  });

  if (verbose) {
    console.log(`💧 Mock watering history setup completed for ${plantId} - ${mockHistory.length} events`);
  }
}