import { useAuth } from '@/contexts/AuthContext';
import { useUserPlants } from '@/hooks/useUserPlants';
import { usePlantNotifications } from '@/hooks/usePlantNotifications';

/**
 * Invisible component that runs plant notification generation globally.
 * Ensures watering notifications persist across all pages, not just Dashboard.
 */
export function GlobalNotifications() {
  const { user } = useAuth();
  const { plants, loading } = useUserPlants();

  usePlantNotifications(plants, !!user && !loading);

  return null;
}
