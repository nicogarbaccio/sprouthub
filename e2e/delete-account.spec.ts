import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { deleteUserByEmail, findAuthUserId, getSupabaseAdmin, getToast, signUpAndReachOnboarding } from './helpers';

/**
 * Deleting an account must remove the login itself, not just the profile: before the
 * delete-account edge function, a "deleted" user could still sign in to an empty account.
 * Uses its own throwaway user, never the shared e2e account.
 */
test.describe('Delete Account', () => {
  const stamp = Date.now();
  const email = `delete-account-${stamp}@example.com`;
  const password = `Xk9${stamp}!mP7&zQ2`;

  // Files this test uploads, removed in afterAll if the account deletion didn't get them
  const uploaded: string[] = [];

  // If the test fails before the account is deleted, don't leave the user or files behind
  test.afterAll(async () => {
    await deleteUserByEmail(email);
    if (uploaded.length > 0) await getSupabaseAdmin()?.storage.from('plant-images').remove(uploaded);
  });

  test('removes the login, plants and uploaded photos', async ({ page }) => {
    const admin = getSupabaseAdmin();
    test.skip(!admin, 'Needs the service role key in .env.test');

    await signUpAndReachOnboarding(page, {
      firstName: 'Delete',
      lastName: 'Me',
      username: `deleteme${stamp}`,
      email,
      password,
    });
    await page.getByRole('button', { name: 'Skip onboarding' }).click();
    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 10000 });

    // Give the account a plant with an uploaded photo, and a journal photo in their folder
    const userId = await findAuthUserId(admin!, email);
    expect(userId).toBeTruthy();
    const photoPath = `${randomUUID()}.png`;
    const journalPath = `${userId}/${randomUUID()}/journal_${stamp}_0.png`;
    const png = Buffer.from('89504e470d0a1a0a', 'hex');
    for (const path of [photoPath, journalPath]) {
      const { error } = await admin!.storage.from('plant-images').upload(path, png, { contentType: 'image/png' });
      expect(error).toBeNull();
      uploaded.push(path);
    }
    const { data: publicUrl } = admin!.storage.from('plant-images').getPublicUrl(photoPath);
    const { error: plantError } = await admin!.from('user_plants').insert({
      user_id: userId!,
      nickname: 'Doomed',
      plant_type: 'Pothos',
      image: publicUrl.publicUrl,
    });
    expect(plantError).toBeNull();

    // Delete through the UI
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Delete Account' }).click();
    await page.getByRole('button', { name: 'Yes, Delete My Account' }).click();
    await expect(getToast(page, 'Account deleted')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL('/');

    // The login, the plant and both photos are gone
    expect(await findAuthUserId(admin!, email)).toBeNull();
    const { count } = await admin!.from('user_plants').select('id', { count: 'exact', head: true }).eq('user_id', userId!);
    expect(count).toBe(0);
    const { data: remaining } = await admin!.storage.from('plant-images').list(userId!);
    expect(remaining ?? []).toHaveLength(0);
    const { error: downloadError } = await admin!.storage.from('plant-images').download(photoPath);
    expect(downloadError).not.toBeNull();

    // And signing in no longer works
    await page.goto('/auth');
    await page.getByTestId('sign-in-email').fill(email);
    await page.getByTestId('sign-in-password').fill(password);
    await page.getByTestId('sign-in-button').click();
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.getByTestId('dashboard')).not.toBeVisible();
  });
});
