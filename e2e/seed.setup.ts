import { test as setup, expect } from '@playwright/test';
import { getSupabaseAdmin, findAuthUserId } from './helpers';
import { TEST_PROFILE, TEST_HOUSEHOLD_NAME, SEED_PLANT_LIST } from './fixtures';

/**
 * Resets the dedicated e2e account to the data in fixtures.ts before every run, creating
 * the account first if it doesn't exist. Every spec starts from the same plants, rooms,
 * household and settings, and nothing a previous (possibly failed) run left behind.
 *
 * Only ever touches the account named by TEST_USER_EMAIL, and refuses to run unless that
 * looks like a test address, so it can't wipe a real account by misconfiguration.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

setup('seed the e2e account', async () => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  if (!email || !password) throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.test');
  if (!/@example\.com$/i.test(email)) {
    throw new Error(`Refusing to seed ${email}: the e2e account must be an @example.com address, since seeding deletes its data`);
  }

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('The e2e seed needs VITE_SUPABASE_SERVICE_ROLE_KEY in .env.test');

  // ── Account ──
  let userId = await findAuthUserId(admin, email);
  if (userId) {
    // Keep the password in step with .env.test
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) throw error;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: TEST_PROFILE.firstName,
        last_name: TEST_PROFILE.lastName,
        username: TEST_PROFILE.username,
      },
    });
    if (error) throw error;
    userId = data.user.id;
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      first_name: TEST_PROFILE.firstName,
      last_name: TEST_PROFILE.lastName,
      username: TEST_PROFILE.username,
      avatar_url: null,
      onboarding_completed: true,
    })
    .eq('id', userId);
  if (profileError) throw profileError;

  // ── Clear everything a run can leave behind ──
  // Plants cascade to watering, fertilization, journal, schedule and suggestion rows
  for (const [table, column] of [
    ['user_plants', 'user_id'],
    ['households', 'created_by'],
    ['household_members', 'user_id'],
    ['hidden_articles', 'user_id'],
    ['saved_articles', 'user_id'],
    ['dismissed_suggestions', 'user_id'],
    ['notification_acknowledgements', 'user_id'],
    ['user_watering_preferences', 'user_id'],
  ] as const) {
    const { error } = await admin.from(table).delete().eq(column, userId);
    if (error) throw new Error(`Clearing ${table}: ${error.message}`);
  }

  const { error: prefsError } = await admin.from('user_watering_preferences').insert({
    user_id: userId,
    default_light_level: 'medium',
    default_temperature: 'normal',
    default_humidity: 'normal',
    default_care_style: 'balanced',
    default_soil_type: 'regular',
  });
  if (prefsError) throw prefsError;

  // ── Household ──
  const { data: household, error: householdError } = await admin
    .from('households')
    .insert({ name: TEST_HOUSEHOLD_NAME, created_by: userId })
    .select('id')
    .single();
  if (householdError) throw householdError;
  const { error: memberError } = await admin
    .from('household_members')
    .insert({ household_id: household.id, user_id: userId, role: 'owner' });
  if (memberError) throw memberError;

  // ── Plants and their last watering ──
  const now = Date.now();
  for (const plant of SEED_PLANT_LIST) {
    const { data: row, error } = await admin
      .from('user_plants')
      .insert({
        user_id: userId,
        nickname: plant.nickname,
        plant_type: plant.plantType,
        room: plant.room,
        suggested_watering_days: plant.scheduleDays,
        household_id: plant.inHousehold ? household.id : null,
      })
      .select('id')
      .single();
    if (error) throw error;

    const { error: wateringError } = await admin.from('watering_records').insert({
      plant_id: row.id,
      watered_at: new Date(now - plant.lastWateredDaysAgo * DAY_MS).toISOString(),
      record_type: 'watering',
      performed_by: userId,
    });
    if (wateringError) throw wateringError;
  }

  const { count } = await admin.from('user_plants').select('id', { count: 'exact', head: true }).eq('user_id', userId);
  expect(count).toBe(SEED_PLANT_LIST.length);
});
