import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const useHaptics = () => {
  const hapticImpact = async (style = ImpactStyle.Light) => {
    try {
      await Haptics.impact({ style });
    } catch (e) {
      // Fallback for web or errors
      console.debug('Haptics not supported or failed', e);
    }
  };

  const hapticSelection = async () => {
    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
    } catch (e) {
      console.debug('Haptics not supported or failed', e);
    }
  };

  const hapticNotification = async (type: NotificationType) => {
    try {
      await Haptics.notification({ type });
    } catch (e) {
      console.debug('Haptics not supported or failed', e);
    }
  };

  return { hapticImpact, hapticSelection, hapticNotification };
};

