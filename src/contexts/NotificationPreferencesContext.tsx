import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '@/utils/storage';

export interface NotificationPreferences {
  // Enable/disable notification generation
  enabled: boolean;

  // Specific notification types
  overdueWatering: boolean;
  dueTodayWatering: boolean;
  overwateringRisk: boolean;

  // Success notifications
  wateringSuccess: boolean;
  bulkActions: boolean;

  // Pattern insights
  patternInsights: boolean;

  // Frequency settings
  checkFrequency: 'realtime' | 'hourly' | 'daily';
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  overdueWatering: true,
  dueTodayWatering: true,
  overwateringRisk: true,
  wateringSuccess: true,
  bulkActions: true,
  patternInsights: true,
  checkFrequency: 'hourly',
};

interface NotificationPreferencesContextType {
  preferences: NotificationPreferences;
  updatePreferences: (updates: Partial<NotificationPreferences>) => void;
  resetToDefaults: () => void;
}

const NotificationPreferencesContext = createContext<NotificationPreferencesContextType | undefined>(undefined);

const STORAGE_KEY = 'sprouthub_notification_preferences';
const STORAGE_VERSION = 1;

export const NotificationPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  // Load preferences from storage on mount
  useEffect(() => {
    const stored = storage.getItem<NotificationPreferences>(STORAGE_KEY, {
      version: STORAGE_VERSION,
      validate: (data) => typeof data === 'object' && data !== null,
    });

    if (stored) {
      setPreferences({ ...DEFAULT_PREFERENCES, ...stored });
    }
  }, []);

  // Save preferences to storage whenever they change
  useEffect(() => {
    storage.setItem(STORAGE_KEY, preferences, {
      version: STORAGE_VERSION,
    });
  }, [preferences]);

  const updatePreferences = (updates: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  const resetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  return (
    <NotificationPreferencesContext.Provider
      value={{
        preferences,
        updatePreferences,
        resetToDefaults,
      }}
    >
      {children}
    </NotificationPreferencesContext.Provider>
  );
};

export const useNotificationPreferences = () => {
  const context = useContext(NotificationPreferencesContext);
  if (!context) {
    throw new Error('useNotificationPreferences must be used within NotificationPreferencesProvider');
  }
  return context;
};
