import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  validatePassword,
  PasswordValidationResult,
} from "@/utils/auth/password";
import { hookLogger } from "@/utils/hookLogging";
import { pushNotificationService } from "@/services/pushNotificationService";
import { oneSignalWebService } from "@/services/oneSignalWebService";
import { Capacitor } from "@capacitor/core";
import { setSentryUser, clearSentryUser } from "@/config/sentry";

const CONTEXT_NAME = 'AuthContext';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    username: string
  ) => Promise<{ error: AuthError | { message: string } | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  verifyResetToken: (
    email: string,
    token: string,
    newPassword: string
  ) => Promise<{ error: AuthError | null }>;
  validatePasswordStrength: (password: string) => PasswordValidationResult;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let initialLoadComplete = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      // Prevent auto-login for password recovery sessions
      if (event === "PASSWORD_RECOVERY") {
        // Don't set user/session for recovery - require manual password reset
        hookLogger.debug(CONTEXT_NAME, "Password recovery detected - preventing auto-login");
        setLoading(false);
        return;
      }

      // Only update user/session if we have a valid session, or on explicit sign-out.
      // This prevents transient auth events (e.g., token refresh) from briefly
      // setting user to null and causing UI flicker.
      // Use functional updates to preserve object references when the underlying
      // data hasn't changed — prevents unnecessary re-renders of useAuth() consumers.
      if (session) {
        setSession(prev => prev?.access_token === session.access_token ? prev : session);
        setUser(prev => prev?.id === session.user?.id ? prev : session.user);
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
      }

      // Only set loading to false if initial load is complete
      // This prevents the auth state change callback from hiding the loading skeleton
      if (initialLoadComplete) {
        setLoading(false);
      }

      // Set Sentry user context on sign in/out
      if (event === "SIGNED_IN" && session?.user) {
        setSentryUser({ id: session.user.id, email: session.user.email });
      } else if (event === "SIGNED_OUT") {
        clearSentryUser();
      }

      // Initialize push notifications on sign in
      if (event === "SIGNED_IN" && session?.user) {
        hookLogger.debug(CONTEXT_NAME, "User signed in - initializing push notifications");

        // Use OneSignal Web for browsers, Capacitor for native apps
        const pushService = Capacitor.isNativePlatform()
          ? pushNotificationService
          : oneSignalWebService;

        pushService.initialize().catch((error) => {
          hookLogger.warn(CONTEXT_NAME, "Failed to initialize push notifications", { error });
        });
      }

      // Disable push notifications on sign out
      if (event === "SIGNED_OUT") {
        hookLogger.debug(CONTEXT_NAME, "User signed out - disabling push notifications");

        const pushService = Capacitor.isNativePlatform()
          ? pushNotificationService
          : oneSignalWebService;

        pushService.disable().catch((error) => {
          hookLogger.warn(CONTEXT_NAME, "Failed to disable push notifications", { error });
        });
      }
    });

    // Set a fallback timeout to prevent hanging on slow networks
    timeoutId = setTimeout(() => {
      if (isMounted) {
        hookLogger.warn(CONTEXT_NAME, "Auth loading timeout - proceeding without auth");
        initialLoadComplete = true;
        setLoading(false);
      }
    }, 3000);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          initialLoadComplete = true;
          setLoading(false);
          // Clear timeout since we got a response
          if (timeoutId) clearTimeout(timeoutId);

          // Initialize push notifications for existing session
          if (session?.user) {
            hookLogger.debug(CONTEXT_NAME, "Existing session found - initializing push notifications");

            const pushService = Capacitor.isNativePlatform()
              ? pushNotificationService
              : oneSignalWebService;

            pushService.initialize().catch((error) => {
              hookLogger.warn(CONTEXT_NAME, "Failed to initialize push notifications", { error });
            });
          }
        }
      })
      .catch((error) => {
        if (isMounted) {
          hookLogger.warn(CONTEXT_NAME, "Auth session error", { error });
          initialLoadComplete = true;
          setLoading(false);
          // Clear timeout since we got a response (even if error)
          if (timeoutId) clearTimeout(timeoutId);
        }
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    username: string
  ) => {
    try {
      // Validate password strength before attempting signup
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return {
          error: {
            message: passwordValidation.errors.join(". ") + ".",
          },
        };
      }

      // Check if username is available using RPC function (bypasses RLS for anon users)
      const { data: isAvailable, error: checkError } = await supabase
        .rpc("check_username_available", { p_username: username });

      if (checkError) {
        hookLogger.warn(CONTEXT_NAME, "Username availability check failed", checkError);
        // Don't block sign-up; the database unique constraint will catch actual duplicates
      }

      if (isAvailable === false) {
        return {
          error: {
            message:
              "Username already exists. Please choose a different username.",
          },
        };
      }

      // Check if email already exists by attempting to sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            username: username,
          },
        },
      });

      if (error) {
        // Handle specific Supabase auth errors
        if (
          error.message.includes("User already registered") ||
          error.message.includes("already been registered")
        ) {
          return {
            error: {
              message:
                "An account with this email already exists. Please sign in instead.",
            },
          };
        }
        return { error };
      }

      // If signup was successful but user is null, it means email confirmation is required
      if (data.user && !data.user.email_confirmed_at) {
        return { error: null };
      }

      return { error: null };
    } catch (err) {
      hookLogger.error(CONTEXT_NAME, "Signup error", err);
      return {
        error: {
          message: "An unexpected error occurred. Please try again.",
        },
      };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (err) {
      hookLogger.error(CONTEXT_NAME, "Sign in error", err);
      return {
        error: {
          message: "An unexpected error occurred during sign in. Please try again.",
        } as AuthError,
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      hookLogger.debug(CONTEXT_NAME, "Starting sign out");

      // Clear local state immediately
      setSession(null);
      setUser(null);

      // Try to sign out from Supabase
      await supabase.auth.signOut({ scope: "local" });

      hookLogger.debug(CONTEXT_NAME, "Sign out completed");
    } catch (error) {
      hookLogger.warn(CONTEXT_NAME, "Sign out error (but local state cleared)", { error });
      // Local state is already cleared, so this is still a successful sign out from user perspective
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    // Send OTP to email for password reset
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  }, []);

  const verifyResetToken = useCallback(async (
    email: string,
    token: string,
    newPassword: string
  ) => {
    try {
      // Validate new password strength
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return {
          error: {
            message: passwordValidation.errors.join(". ") + ".",
          } as AuthError,
        };
      }

      // First verify the OTP token
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "recovery",
      });

      if (verifyError) {
        return { error: verifyError };
      }

      // If OTP is valid, update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        return { error: updateError };
      }

      // Sign out after password reset to prevent auto-login
      await supabase.auth.signOut();

      return { error: null };
    } catch (err) {
      hookLogger.error(CONTEXT_NAME, "Password reset error", err);
      return {
        error: {
          message: "An unexpected error occurred. Please try again.",
        } as AuthError,
      };
    }
  }, []);

  const value: AuthContextType = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    verifyResetToken,
    validatePasswordStrength: validatePassword,
  }), [user, session, loading, signUp, signIn, signOut, resetPassword, verifyResetToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
