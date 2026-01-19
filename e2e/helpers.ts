import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://ufhjudswppdqupjbqbwm.supabase.co";
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const getSupabaseAdmin = () => {
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

export const deleteUserByEmail = async (email: string) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn('Skipping user cleanup - no admin client available.');
    return;
  }

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error listing users:', error);
    return;
  }

  const user = data.users.find((u) => u.email === email);
  if (user) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error('Error deleting user:', deleteError);
    } else {
      console.log(`Deleted test user: ${email}`);
    }
  }
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

