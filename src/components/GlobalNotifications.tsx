import { useAuth } from '@/contexts/AuthContext';
import { useUserPlants } from '@/hooks/useUserPlants';
import { usePlantNotifications } from '@/hooks/usePlantNotifications';
import { useRainDelay } from '@/hooks/useRainDelay';

/**
 * Invisible component that runs plant notification generation globally.
 * Ensures watering notifications persist across all pages, not just Dashboard.
 *
 * Rain delay advice is resolved here too, so a due outdoor plant with rain forecast is
 * annotated in the notification center rather than reported as plainly overdue while the
 * Dashboard says rain is coming. Rain delay never suppresses a notification — the plant is
 * genuinely still due — it only adds the context needed to decide.
 */
export function GlobalNotifications() {
  const { user } = useAuth();
  const { plants, loading } = useUserPlants();
  const { rainDelayByPlantId } = useRainDelay(plants);

  usePlantNotifications(plants, !!user && !loading, rainDelayByPlantId);

  return null;
}
