/**
 * Thin wrapper that exposes a loading boolean for use with LoadingTransition.
 *
 * Previously this had a three-state machine (showLoading / showContent / isReady)
 * with minimum-time delays and invisible placeholders.  That complexity is now
 * handled by LoadingTransition's crossfade — this hook just passes through.
 *
 * Kept as a hook (rather than deleted) so call-sites don't need a big refactor
 * and so we have a single place to add future loading-UX logic if needed.
 */
export const useGracefulLoading = (
  isActuallyLoading: boolean,
  _options: Record<string, unknown> = {}
) => {
  return {
    /** true while data is still loading */
    loading: isActuallyLoading,
    // Legacy aliases kept for backward compatibility during migration
    showLoading: isActuallyLoading,
    showContent: !isActuallyLoading,
    isReady: !isActuallyLoading,
  };
};
