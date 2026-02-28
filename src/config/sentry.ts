import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Only runs in production to avoid noise during development
 */
export const initSentry = () => {
  // Only initialize Sentry in production
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,

      // Set environment
      environment: import.meta.env.MODE,

      // Performance Monitoring
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],

      // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
      // We recommend adjusting this value in production (0.1 = 10%)
      tracesSampleRate: 0.1,

      // Capture Replay for 10% of all sessions,
      // plus for 100% of sessions with an error
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Filter out sensitive information before sending to Sentry
      beforeSend(event, _hint) {
        // Don't send events if user is in development mode
        if (import.meta.env.DEV) {
          return null;
        }

        // Filter out non-error console messages
        if (event.level === "log" || event.level === "info") {
          return null;
        }

        // Remove sensitive data from event
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers;
        }

        // Remove user email if present (keep user ID for tracking)
        if (event.user?.email) {
          event.user.email = undefined;
        }

        return event;
      },

      // Ignore certain errors that are not actionable
      ignoreErrors: [
        // Browser extension errors
        "top.GLOBALS",
        "chrome-extension://",
        "moz-extension://",
        // Random network errors
        "NetworkError",
        "Network request failed",
        // Capacitor errors that are expected
        "NotAllowedError",
      ],

      // Blacklist URLs we don't want to track
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^moz-extension:\/\//i,
      ],
    });

    console.log("✅ Sentry initialized for error tracking");
  } else if (import.meta.env.DEV) {
    console.log("ℹ️ Sentry disabled in development mode");
  } else {
    console.warn("⚠️ Sentry DSN not found - error tracking disabled");
  }
};

/**
 * Set user context for Sentry
 * Call this after user logs in
 */
export const setSentryUser = (user: { id: string; email?: string }) => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser({
      id: user.id,
      // Don't send email to protect privacy
      // email: user.email,
    });
  }
};

/**
 * Clear user context from Sentry
 * Call this when user logs out
 */
export const clearSentryUser = () => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(null);
  }
};

/**
 * Manually capture an exception
 * Use this for try-catch blocks where you want to report to Sentry
 */
export const captureException = (error: Error, context?: Record<string, unknown>) => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error("Error (not sent to Sentry):", error, context);
  }
};

/**
 * Manually capture a message
 * Use this for important events or warnings
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = "info") => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`Sentry message (${level}):`, message);
  }
};
