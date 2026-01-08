import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Database types (auto-generated from Supabase)
export type JournalEntry = Tables<'plant_journal_entries'>;
export type JournalEntryInsert = TablesInsert<'plant_journal_entries'>;
export type JournalEntryUpdate = TablesUpdate<'plant_journal_entries'>;

// Mood types for plant health indicators
export type PlantMood = 'healthy' | 'stressed' | 'thriving' | 'declining' | 'neutral';

// UI-specific types
export interface JournalEntryFormData {
  title: string;
  content: string;
  mood: PlantMood | null;
  images: File[]; // Files to be uploaded
  entryDate: Date;
  relatedWateringRecordId?: string;
}

export interface JournalEntryWithPlant extends JournalEntry {
  plant_nickname?: string;
  plant_type?: string;
}

// Filter options for journal entries list
export interface JournalFilterOptions {
  startDate?: Date;
  endDate?: Date;
  mood?: PlantMood;
  searchQuery?: string;
}

// Statistics for journal analytics
export interface JournalStats {
  totalEntries: number;
  entriesThisMonth: number;
  mostCommonMood: PlantMood | null;
  daysWithEntries: number;
}

// Image upload progress tracking
export interface ImageUploadProgress {
  file: File;
  progress: number;
  uploaded: boolean;
  url?: string;
  error?: string;
}

// Mood configuration for UI display
export interface MoodConfig {
  value: PlantMood;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const MOOD_OPTIONS: MoodConfig[] = [
  {
    value: 'healthy',
    label: 'Healthy',
    icon: '😊',
    color: 'text-green-600',
    description: 'Plant is thriving with no visible issues',
  },
  {
    value: 'thriving',
    label: 'Thriving',
    icon: '🌟',
    color: 'text-emerald-600',
    description: 'Plant is doing exceptionally well',
  },
  {
    value: 'neutral',
    label: 'Neutral',
    icon: '😐',
    color: 'text-gray-600',
    description: 'Plant is stable with no major changes',
  },
  {
    value: 'stressed',
    label: 'Stressed',
    icon: '😟',
    color: 'text-yellow-600',
    description: 'Plant showing signs of stress',
  },
  {
    value: 'declining',
    label: 'Declining',
    icon: '😢',
    color: 'text-red-600',
    description: 'Plant health is deteriorating',
  },
];

// Helper function to get mood configuration
export const getMoodConfig = (mood: PlantMood | null): MoodConfig | null => {
  if (!mood) return null;
  return MOOD_OPTIONS.find(option => option.value === mood) || null;
};

// Constants for image handling
export const JOURNAL_IMAGE_CONSTANTS = {
  MAX_IMAGES_PER_ENTRY: 5,
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as string[],
  STORAGE_BUCKET: 'plant-images',
} as const;
