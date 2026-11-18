import { createClient } from '@supabase/supabase-js';
import { expect, type Page, type Locator } from '@playwright/test';

// ── Toast helper ──────────────────────────────────────────────────────
/**
 * Returns a locator for a toast notification matching the given text.
 * Works with Sonner toasts which render with role="status".
 */
export function getToast(page: Page, text: string | RegExp): Locator {
  return page.getByRole('status').filter({ hasText: text });
}

// ── Sign-up helper used by onboarding tests ────────────────────────────

interface SignUpParams {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

/**
 * Fill the sign-up form, submit, wait for the Supabase response,
 * and assert we've landed on /onboarding.
 */
export async function signUpAndReachOnboarding(page: Page, params: SignUpParams) {
  await page.goto('/auth');
  await page.getByTestId('sign-up-trigger').click();

  await page.getByTestId('first-name-input').fill(params.firstName);
  await page.getByTestId('last-name-input').fill(params.lastName);
  await page.getByTestId('username-input').fill(params.username);
  await page.getByTestId('sign-up-email').fill(params.email);
  await page.getByTestId('signup-password').fill(params.password);
  await page.getByTestId('confirmPassword').fill(params.password);

  await page.getByTestId('sign-up-button').click();

  // The URL assertion retries with a generous timeout, covering the Supabase round-trip
  await expect(page).toHaveURL('/onboarding', { timeout: 15000 });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://ufhjudswppdqupjbqbwm.supabase.co";
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export const getSupabaseAdmin = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * An auth user's id by email. listUsers is paginated (50 per page by default), so walk the
 * pages: checking only the first one silently missed newer users once the project grew,
 * which is how throwaway sign-up users leaked.
 */
export const findAuthUserId = async (
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  email: string
): Promise<string | null> => {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const users: { id: string; email?: string }[] = data.users;
    const match = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (users.length < 1000) return null;
  }
};

export const deleteUserByEmail = async (email: string) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn('Skipping user cleanup - no admin client available.');
    return;
  }

  const userId = await findAuthUserId(supabase, email);
  if (!userId) return;

  // user_plants doesn't cascade from auth.users, so a user who owns plants can't be deleted first
  const { error: plantsError } = await supabase.from('user_plants').delete().eq('user_id', userId);
  if (plantsError) throw plantsError;

  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteError) throw deleteError;
  console.log(`Deleted test user: ${email}`);
};

/**
 * Delete plants by nickname pattern (useful for test cleanup)
 * @param nicknamePattern - Pattern to match plant nicknames (supports SQL LIKE syntax)
 * @param userEmail - Email of the user whose plants to delete
 */
export const deletePlantsByPattern = async (nicknamePattern: string, userEmail: string) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn('Skipping plant cleanup - no admin client available.');
    return;
  }

  try {
    // Get user ID from profiles table using email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (profileError || !profile) {
      console.warn(`User profile not found for email: ${userEmail}`, profileError);
      return;
    }

    // Delete plants matching the pattern for this user
    const { data: deletedPlants, error: deleteError } = await supabase
      .from('user_plants')
      .delete()
      .eq('user_id', profile.id)
      .like('nickname', nicknamePattern)
      .select();

    if (deleteError) {
      console.error('Error deleting plants:', deleteError);
    } else if (deletedPlants && deletedPlants.length > 0) {
      console.log(`Deleted ${deletedPlants.length} test plant(s) matching pattern: ${nicknamePattern}`);
    } else {
      console.log(`No plants found matching pattern: ${nicknamePattern}`);
    }
  } catch (error) {
    console.error('Unexpected error during plant cleanup:', error);
  }
};

/**
 * Delete all plants for a user (use with caution!)
 * @param userEmail - Email of the user whose plants to delete
 */
export const deleteAllPlantsForUser = async (userEmail: string) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn('Skipping plant cleanup - no admin client available.');
    return;
  }

  try {
    // Get user ID from profiles table using email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (profileError || !profile) {
      console.warn(`User profile not found for email: ${userEmail}`, profileError);
      return;
    }

    // Delete all plants for this user
    const { data: deletedPlants, error: deleteError } = await supabase
      .from('user_plants')
      .delete()
      .eq('user_id', profile.id)
      .select();

    if (deleteError) {
      console.error('Error deleting all plants:', deleteError);
    } else if (deletedPlants && deletedPlants.length > 0) {
      console.log(`Deleted all ${deletedPlants.length} plant(s) for user: ${userEmail}`);
    } else {
      console.log(`No plants found for user: ${userEmail}`);
    }
  } catch (error) {
    console.error('Unexpected error during plant cleanup:', error);
  }
};

/**
 * Delete all hidden articles for a user (test cleanup)
 * @param userEmail - Email of the user whose hidden articles to delete
 */
export const deleteAllHiddenForUser = async (userEmail: string) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn('Skipping hidden articles cleanup - no admin client available.');
    return;
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (profileError || !profile) {
      console.warn(`User profile not found for email: ${userEmail}`, profileError);
      return;
    }

    const { data: deleted, error: deleteError } = await supabase
      .from('hidden_articles')
      .delete()
      .eq('user_id', profile.id)
      .select();

    if (deleteError) {
      console.error('Error deleting hidden articles:', deleteError);
    } else if (deleted && deleted.length > 0) {
      console.log(`Deleted ${deleted.length} hidden article(s) for user: ${userEmail}`);
    }
  } catch (error) {
    console.error('Unexpected error during hidden articles cleanup:', error);
  }
};

/**
 * Make every one of a user's plants "never fertilized" again, so the fertilization banner
 * lists them all. Throws on failure: a silent no-op here only shows up later as a confusing
 * banner assertion.
 */
export const resetFertilizationDates = async (userEmail: string) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('resetFertilizationDates needs the service role key');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', userEmail)
    .single();
  if (profileError || !profile) throw profileError ?? new Error(`No profile for ${userEmail}`);

  // Last-fertilized dates come from fertilization_records (via plants_with_watering_info)
  const { data: plants, error: plantsError } = await supabase
    .from('user_plants')
    .select('id')
    .eq('user_id', profile.id);
  if (plantsError) throw plantsError;

  const { error: deleteError } = await supabase
    .from('fertilization_records')
    .delete()
    .in('plant_id', (plants ?? []).map((p) => p.id));
  if (deleteError) throw deleteError;
};

/**
 * Clear fertilization banner dismissals/snoozes for a user (test cleanup)
 * Removes notification_acknowledgements rows with notification_type starting with 'spring_fertilization'.
 * @param userEmail - Email of the user
 */
export const clearFertilizationDismissals = async (userEmail: string) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn('Skipping fertilization dismissal cleanup - no admin client available.');
    return;
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (profileError || !profile) {
      console.warn(`User profile not found for email: ${userEmail}`, profileError);
      return;
    }

    const { data: deleted, error: deleteError } = await supabase
      .from('notification_acknowledgements')
      .delete()
      .eq('user_id', profile.id)
      .like('notification_type', 'spring_fertilization%')
      .select();

    if (deleteError) {
      console.error('Error clearing fertilization dismissals:', deleteError);
    } else if (deleted && deleted.length > 0) {
      console.log(`Cleared ${deleted.length} fertilization dismissal(s) for user: ${userEmail}`);
    }
  } catch (error) {
    console.error('Unexpected error during fertilization dismissal cleanup:', error);
  }
};

/**
 * Delete test households by name pattern (useful for test cleanup).
 * Removes households whose name matches the given SQL LIKE pattern.
 * Associated household_members rows are cascade-deleted by the FK constraint.
 * @param namePattern - Pattern to match household names (supports SQL LIKE syntax, e.g. 'Test Household%')
 */
export const deleteTestHouseholds = async (
  namePattern: string = 'Test Household%',
  userEmail: string = process.env.TEST_USER_EMAIL ?? ''
) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn('Skipping household cleanup - no admin client available.');
    return;
  }

  try {
    // Only the test account's households: a name pattern alone would match other users' too
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();
    if (profileError || !profile) {
      console.warn(`User profile not found for email: ${userEmail}`, profileError);
      return;
    }

    const { data: deleted, error } = await supabase
      .from('households')
      .delete()
      .eq('created_by', profile.id)
      .like('name', namePattern)
      .select();

    if (error) {
      console.error('Error deleting test households:', error);
    } else if (deleted && deleted.length > 0) {
      console.log(`Deleted ${deleted.length} test household(s) matching pattern: ${namePattern}`);
    } else {
      console.log(`No households found matching pattern: ${namePattern}`);
    }
  } catch (error) {
    console.error('Unexpected error during household cleanup:', error);
  }
};

/**
 * Delete journal entries by title pattern (useful for test cleanup)
 * @param titlePattern - Pattern to match entry titles (supports SQL LIKE syntax)
 * @param userEmail - Email of the user whose entries to delete
 */
export const deleteJournalEntriesByPattern = async (titlePattern: string, userEmail: string) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn('Skipping journal entry cleanup - no admin client available.');
    return;
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (profileError || !profile) {
      console.warn(`User profile not found for email: ${userEmail}`, profileError);
      return;
    }

    // Get user's plants to find their journal entries
    const { data: plants } = await supabase
      .from('user_plants')
      .select('id')
      .eq('user_id', profile.id);

    if (!plants || plants.length === 0) return;

    const plantIds = plants.map((p) => p.id);

    const { data: deleted, error: deleteError } = await supabase
      .from('plant_journal_entries')
      .delete()
      .in('plant_id', plantIds)
      .like('title', titlePattern)
      .select();

    if (deleteError) {
      console.error('Error deleting journal entries:', deleteError);
    } else if (deleted && deleted.length > 0) {
      console.log(`Deleted ${deleted.length} journal entry/entries matching pattern: ${titlePattern}`);
    }
  } catch (error) {
    console.error('Unexpected error during journal entry cleanup:', error);
  }
};
