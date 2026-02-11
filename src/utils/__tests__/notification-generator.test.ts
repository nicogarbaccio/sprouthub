/**
 * Unit tests for notification generator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generatePlantNotifications,
  createWelcomeNotification,
  createWateringSuccessNotification,
  createBulkWateringNotification,
  createPatternInsightNotification,
  setNotificationNavigate
} from '../notification-generator';
import type { UserPlant } from '@/hooks/useUserPlants';

// Mock the dependencies
vi.mock('../watering-schedule', () => ({
  calculateWateringSchedule: vi.fn((plant) => {
    // Mock implementation based on plant data
    const lastWateredDate = plant.last_watered_date ? new Date(plant.last_watered_date) : new Date();
    const daysSinceWatering = Math.floor((Date.now() - lastWateredDate.getTime()) / (1000 * 60 * 60 * 24));
    const wateringDays = plant.suggested_watering_days || 7;
    const daysUntilWatering = wateringDays - daysSinceWatering;

    return {
      daysUntilWatering,
      isOverdue: daysUntilWatering < 0,
      isDueToday: daysUntilWatering === 0,
      isDueSoon: daysUntilWatering > 0 && daysUntilWatering <= 2
    };
  })
}));

vi.mock('../overwatering', () => ({
  shouldShowOverwateringWarning: vi.fn(() => false)
}));

describe('notification-generator', () => {
  const createMockPlant = (overrides: Partial<UserPlant> = {}): UserPlant => ({
    id: '1',
    user_id: 'user1',
    nickname: 'Test Plant',
    scientific_name: null,
    light_requirements: 'medium',
    suggested_watering_days: 7,
    soil_type: 'standard',
    plant_size: 'medium',
    last_watered_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notes: null,
    image_url: null,
    is_outdoor_plant: false,
    room: null,
    household_id: null,
    days_since_watering: 0,
    care_difficulty: 'easy',
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generatePlantNotifications', () => {
    it('should return empty array for no plants', () => {
      const notifications = generatePlantNotifications([]);
      expect(notifications).toHaveLength(0);
    });

    it('should create notification for overdue plant', () => {
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 10); // 10 days ago

      const plant = createMockPlant({
        id: '1',
        nickname: 'Overdue Plant',
        last_watered_date: overdueDate.toISOString(),
        suggested_watering_days: 7
      });

      const notifications = generatePlantNotifications([plant]);

      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('overdue_watering');
      expect(notifications[0].priority).toBe('high');
      expect(notifications[0].title).toBe('Plant Overdue');
      expect(notifications[0].message).toContain('Overdue Plant');
      expect(notifications[0].message).toContain('3 days overdue');
    });

    it('should create notification for plant due today', () => {
      const todayDate = new Date();
      todayDate.setDate(todayDate.getDate() - 7); // Exactly 7 days ago

      const plant = createMockPlant({
        id: '2',
        nickname: 'Due Today',
        last_watered_date: todayDate.toISOString(),
        suggested_watering_days: 7
      });

      const notifications = generatePlantNotifications([plant]);

      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('due_today');
      expect(notifications[0].priority).toBe('medium');
      expect(notifications[0].title).toBe('Plant Due Today');
      expect(notifications[0].message).toContain('Due Today');
      expect(notifications[0].message).toContain('should be watered today');
    });

    it('should not create notifications for plants not due', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 3); // 3 days ago, not due for 7-day cycle

      const plant = createMockPlant({
        id: '3',
        nickname: 'Not Due Yet',
        last_watered_date: recentDate.toISOString(),
        suggested_watering_days: 7
      });

      const notifications = generatePlantNotifications([plant]);

      expect(notifications).toHaveLength(0);
    });

    it('should create multiple notifications for multiple plants', () => {
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 10);

      const todayDate = new Date();
      todayDate.setDate(todayDate.getDate() - 7);

      const plants = [
        createMockPlant({
          id: '1',
          nickname: 'Plant 1',
          last_watered_date: overdueDate.toISOString(),
          suggested_watering_days: 7
        }),
        createMockPlant({
          id: '2',
          nickname: 'Plant 2',
          last_watered_date: todayDate.toISOString(),
          suggested_watering_days: 7
        })
      ];

      const notifications = generatePlantNotifications(plants);

      expect(notifications).toHaveLength(2);
      expect(notifications[0].metadata?.plantId).toBe('1');
      expect(notifications[1].metadata?.plantId).toBe('2');
    });

    it('should include plant metadata in notifications', () => {
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 10);

      const plant = createMockPlant({
        id: 'plant123',
        nickname: 'Monstera',
        last_watered_date: overdueDate.toISOString(),
        suggested_watering_days: 7
      });

      const notifications = generatePlantNotifications([plant]);

      expect(notifications[0].metadata).toEqual({
        plantId: 'plant123',
        plantName: 'Monstera'
      });
    });

    it('should include Water Now action with plantId', () => {
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 10);

      const plant = createMockPlant({
        id: 'abc123',
        nickname: 'Test',
        last_watered_date: overdueDate.toISOString(),
        suggested_watering_days: 7
      });

      const notifications = generatePlantNotifications([plant]);

      expect(notifications[0].actions).toHaveLength(1);
      expect(notifications[0].actions![0].label).toBe('Water Now');
      expect(notifications[0].actions![0].plantId).toBe('abc123');
      expect(notifications[0].actions![0].variant).toBe('default');
    });

    it('should use singular "day" for 1 day overdue', () => {
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 8); // 1 day overdue for 7-day cycle

      const plant = createMockPlant({
        id: '1',
        nickname: 'Plant',
        last_watered_date: overdueDate.toISOString(),
        suggested_watering_days: 7
      });

      const notifications = generatePlantNotifications([plant]);

      expect(notifications[0].message).toContain('1 day overdue');
      expect(notifications[0].message).not.toContain('1 days');
    });

    it('should use plural "days" for multiple days overdue', () => {
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 12); // 5 days overdue for 7-day cycle

      const plant = createMockPlant({
        id: '1',
        nickname: 'Plant',
        last_watered_date: overdueDate.toISOString(),
        suggested_watering_days: 7
      });

      const notifications = generatePlantNotifications([plant]);

      expect(notifications[0].message).toContain('5 days overdue');
    });

    it('should handle errors gracefully', () => {
      // Mock console.error to suppress error output in tests
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Pass invalid data to trigger error
      const notifications = generatePlantNotifications(null as any);

      expect(notifications).toHaveLength(0);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle plants with missing suggested_watering_days', () => {
      const plant = createMockPlant({
        id: '1',
        nickname: 'Test',
        suggested_watering_days: undefined as any
      });

      // Should not throw
      expect(() => generatePlantNotifications([plant])).not.toThrow();
    });

    it('should handle plants with null last_watered_date', () => {
      const plant = createMockPlant({
        id: '1',
        nickname: 'New Plant',
        last_watered_date: null as any
      });

      // Should not throw
      expect(() => generatePlantNotifications([plant])).not.toThrow();
    });
  });

  describe('createWelcomeNotification', () => {
    it('should create a welcome notification', () => {
      const notification = createWelcomeNotification();

      expect(notification.type).toBe('info');
      expect(notification.priority).toBe('low');
      expect(notification.title).toBe('Welcome to sprouthub!');
      expect(notification.message).toContain('Start by adding your first plant');
    });

    it('should include Add Plant action', () => {
      const notification = createWelcomeNotification();

      expect(notification.actions).toHaveLength(1);
      expect(notification.actions![0].label).toBe('Add Plant');
      expect(notification.actions![0].variant).toBe('default');
      expect(notification.actions![0].onClick).toBeDefined();
    });

    it('should navigate to plants page when action clicked', () => {
      const mockNavigate = vi.fn();
      setNotificationNavigate(mockNavigate);

      const notification = createWelcomeNotification();
      notification.actions![0].onClick!();

      expect(mockNavigate).toHaveBeenCalledWith('/my-plants');
    });

    it('should fallback to window.location when navigate not set', () => {
      setNotificationNavigate(null as any);

      // Mock window.location
      delete (window as any).location;
      window.location = { href: '' } as any;

      const notification = createWelcomeNotification();
      notification.actions![0].onClick!();

      expect(window.location.href).toBe('/my-plants');
    });
  });

  describe('createWateringSuccessNotification', () => {
    it('should create success notification with plant name', () => {
      const notification = createWateringSuccessNotification('Monstera');

      expect(notification.type).toBe('success');
      expect(notification.priority).toBe('low');
      expect(notification.title).toBe('Plant Watered');
      expect(notification.message).toBe('Monstera has been watered successfully');
    });

    it('should include plant name in metadata', () => {
      const notification = createWateringSuccessNotification('Fiddle Leaf Fig');

      expect(notification.metadata).toEqual({
        plantName: 'Fiddle Leaf Fig'
      });
    });

    it('should not include actions', () => {
      const notification = createWateringSuccessNotification('Test Plant');

      expect(notification.actions).toBeUndefined();
    });

    it('should handle empty plant name', () => {
      const notification = createWateringSuccessNotification('');

      expect(notification.message).toBe(' has been watered successfully');
    });

    it('should handle special characters in plant name', () => {
      const notification = createWateringSuccessNotification('Plant & Friends™');

      expect(notification.message).toContain('Plant & Friends™');
    });
  });

  describe('createBulkWateringNotification', () => {
    it('should create notification for single plant', () => {
      const notification = createBulkWateringNotification(1);

      expect(notification.type).toBe('success');
      expect(notification.priority).toBe('low');
      expect(notification.title).toBe('Plants Watered');
      expect(notification.message).toBe('Successfully watered 1 plant');
    });

    it('should create notification for multiple plants', () => {
      const notification = createBulkWateringNotification(5);

      expect(notification.type).toBe('success');
      expect(notification.message).toBe('Successfully watered 5 plants');
    });

    it('should use correct pluralization for 0 plants', () => {
      const notification = createBulkWateringNotification(0);

      expect(notification.message).toBe('Successfully watered 0 plant');
    });

    it('should use correct pluralization for 2 plants', () => {
      const notification = createBulkWateringNotification(2);

      expect(notification.message).toBe('Successfully watered 2 plants');
    });

    it('should include count in metadata', () => {
      const notification = createBulkWateringNotification(10);

      expect(notification.metadata).toEqual({
        count: 10
      });
    });

    it('should handle large numbers', () => {
      const notification = createBulkWateringNotification(100);

      expect(notification.message).toBe('Successfully watered 100 plants');
      expect(notification.metadata?.count).toBe(100);
    });

    it('should not include actions', () => {
      const notification = createBulkWateringNotification(3);

      expect(notification.actions).toBeUndefined();
    });
  });

  describe('createPatternInsightNotification', () => {
    it('should create pattern insight notification', () => {
      const notification = createPatternInsightNotification(
        'Monstera',
        'Watering frequency is consistent'
      );

      expect(notification.type).toBe('pattern_insight');
      expect(notification.priority).toBe('low');
      expect(notification.title).toBe('Watering Pattern Insight');
      expect(notification.message).toBe('Monstera: Watering frequency is consistent');
    });

    it('should include plant name in metadata', () => {
      const notification = createPatternInsightNotification(
        'Fern',
        'Consider reducing watering frequency'
      );

      expect(notification.metadata).toEqual({
        plantName: 'Fern'
      });
    });

    it('should format message with plant name and insight', () => {
      const plantName = 'Snake Plant';
      const insight = 'Great job maintaining schedule!';
      const notification = createPatternInsightNotification(plantName, insight);

      expect(notification.message).toBe(`${plantName}: ${insight}`);
    });

    it('should not include actions', () => {
      const notification = createPatternInsightNotification('Plant', 'Insight');

      expect(notification.actions).toBeUndefined();
    });

    it('should handle empty insight', () => {
      const notification = createPatternInsightNotification('Plant', '');

      expect(notification.message).toBe('Plant: ');
    });

    it('should handle long insights', () => {
      const longInsight = 'This is a very long insight message that provides detailed information about the watering pattern and suggests multiple improvements.';
      const notification = createPatternInsightNotification('Plant', longInsight);

      expect(notification.message).toContain(longInsight);
    });

    it('should handle special characters in insight', () => {
      const notification = createPatternInsightNotification(
        'Plant',
        'Adjust watering by 20% (was 7 days, now 5-6 days)'
      );

      expect(notification.message).toContain('20%');
      expect(notification.message).toContain('5-6 days');
    });
  });

  describe('setNotificationNavigate', () => {
    it('should set the navigate function', () => {
      const mockNavigate = vi.fn();
      setNotificationNavigate(mockNavigate);

      const notification = createWelcomeNotification();
      notification.actions![0].onClick!();

      expect(mockNavigate).toHaveBeenCalled();
    });

    it('should replace previous navigate function', () => {
      const firstNavigate = vi.fn();
      const secondNavigate = vi.fn();

      setNotificationNavigate(firstNavigate);
      setNotificationNavigate(secondNavigate);

      const notification = createWelcomeNotification();
      notification.actions![0].onClick!();

      expect(firstNavigate).not.toHaveBeenCalled();
      expect(secondNavigate).toHaveBeenCalled();
    });

    it('should handle navigation errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const errorNavigate = vi.fn(() => {
        throw new Error('Navigation failed');
      });

      setNotificationNavigate(errorNavigate);

      const notification = createWelcomeNotification();

      // Should not throw
      expect(() => notification.actions![0].onClick!()).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('notification structure', () => {
    it('should omit id, timestamp, read, and dismissed fields', () => {
      const notification = createWelcomeNotification();

      expect(notification).not.toHaveProperty('id');
      expect(notification).not.toHaveProperty('timestamp');
      expect(notification).not.toHaveProperty('read');
      expect(notification).not.toHaveProperty('dismissed');
    });

    it('should include required notification fields', () => {
      const notification = createWateringSuccessNotification('Test');

      expect(notification).toHaveProperty('type');
      expect(notification).toHaveProperty('priority');
      expect(notification).toHaveProperty('title');
      expect(notification).toHaveProperty('message');
    });
  });
});
