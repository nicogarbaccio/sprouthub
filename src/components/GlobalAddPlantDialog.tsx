import { lazy, Suspense, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { USER_PLANTS_QUERY_KEY } from "@/hooks/useUserPlants";
import { OPEN_ADD_PLANT_EVENT } from "@/utils/appEvents";

const AddPlantDialog = lazy(() => import("@/components/AddPlantDialog"));

/**
 * Add Plant dialog that any screen can open with `openAddPlant()`, e.g. the "+" in the bottom
 * bar. It mounts on first open so pages that never use it don't pay for the form.
 */
export function GlobalAddPlantDialog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleOpen = () => {
      setMounted(true);
      setIsOpen(true);
    };
    window.addEventListener(OPEN_ADD_PLANT_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_ADD_PLANT_EVENT, handleOpen);
  }, []);

  if (!user || !mounted) return null;

  return (
    <Suspense fallback={null}>
      <AddPlantDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onPlantAdded={() =>
          queryClient.invalidateQueries({ queryKey: [USER_PLANTS_QUERY_KEY] })
        }
      />
    </Suspense>
  );
}
