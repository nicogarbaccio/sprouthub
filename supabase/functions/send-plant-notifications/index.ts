import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Types for our database
interface UserPlant {
  id: string;
  user_id: string;
  nickname: string;
  plant_type: string;
  last_watered_at: string | null;
  suggested_watering_days: number;
  household_id: string | null;
}

interface Profile {
  id: string;
  first_name: string;
  push_notifications_enabled: boolean;
  push_notification_time: string;
  push_notification_timezone: string;
}

interface PushToken {
  id: string;
  user_id: string;
  token: string;
  device_type: 'ios' | 'android' | 'web';
  is_active: boolean;
}

interface WateringCalculation {
  daysUntilWatering: number;
  isOverdue: boolean;
  isPostponed: boolean;
}

// Check if it's the notification time in the user's timezone
function isNotificationTime(
  notificationTime: string, // Format: "07:00:00"
  timezone: string // Format: "America/New_York"
): boolean {
  try {
    const now = new Date();

    // Get current time in user's timezone
    const userTime = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);

    // Extract hour from notification time (e.g., "07:00:00" -> "07")
    const [targetHour] = notificationTime.split(':');

    // Extract current hour from formatted time (e.g., "07:30" -> "07")
    const [currentHour] = userTime.split(':');

    // Send notification if we're in the target hour
    return currentHour === targetHour;
  } catch (error) {
    console.error('Error checking notification time:', error);
    return false;
  }
}

// Calculate watering schedule for a plant
function calculateWateringSchedule(plant: UserPlant): WateringCalculation {
  const wateringSchedule = plant.suggested_watering_days || 7;

  // Normal watering calculation
  if (!plant.last_watered_at) {
    return {
      daysUntilWatering: 0,
      isOverdue: true,
      isPostponed: false
    };
  }

  const lastWatered = new Date(plant.last_watered_at);
  lastWatered.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timeDiff = today.getTime() - lastWatered.getTime();
  const daysSinceWatering = Math.round(timeDiff / (1000 * 60 * 60 * 24));
  const daysUntilWatering = wateringSchedule - daysSinceWatering;
  const isOverdue = daysUntilWatering < 0;

  return {
    daysUntilWatering,
    isOverdue,
    isPostponed: false
  };
}

// Send push notification via OneSignal (you can swap this for FCM or other services)
async function sendPushNotification(
  tokens: PushToken[],
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID');
  const oneSignalApiKey = Deno.env.get('ONESIGNAL_API_KEY');

  if (!oneSignalAppId || !oneSignalApiKey) {
    console.warn('OneSignal credentials not configured, skipping push notification');
    return { success: false, error: 'OneSignal not configured' };
  }

  try {
    // Collect all player IDs (works for iOS, Android, and Web)
    const playerIds = tokens.map(t => t.token);

    console.log('Sending notification to player IDs:', playerIds);

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${oneSignalApiKey}`,
      },
      body: JSON.stringify({
        app_id: oneSignalAppId,
        include_player_ids: playerIds,
        headings: { en: title },
        contents: { en: message },
        data: data || {},
        ios_badgeType: 'Increase',
        ios_badgeCount: 1,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OneSignal API error:', { status: response.status, result });
      return { success: false, error: JSON.stringify(result) };
    }

    return { success: true, result };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: String(error) };
  }
}

Deno.serve(async (req: Request) => {
  try {
    // Verify request is from Supabase Cron or authorized source
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting plant notification job...');

    // Get all active users with push notifications enabled
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, push_notifications_enabled, push_notification_time, push_notification_timezone')
      .eq('push_notifications_enabled', true);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} users with push notifications enabled`);

    let notificationsSent = 0;
    let notificationsFailed = 0;

    // Process each user
    for (const profile of profiles || []) {
      try {
        // Check if it's notification time for this user
        const shouldNotify = isNotificationTime(
          profile.push_notification_time,
          profile.push_notification_timezone
        );

        if (!shouldNotify) {
          console.log(`Skipping user ${profile.id} - not their notification time yet`);
          continue;
        }

        // Get user's plants with watering info
        const { data: plants, error: plantsError } = await supabase
          .from('plants_with_watering_info')
          .select('id, user_id, nickname, plant_type, last_watered_at, suggested_watering_days, household_id')
          .eq('user_id', profile.id);

        if (plantsError) {
          console.error(`Error fetching plants for user ${profile.id}:`, plantsError);
          continue;
        }

        if (!plants || plants.length === 0) {
          console.log(`User ${profile.id} has no plants, skipping`);
          continue;
        }

        // Analyze plants for watering needs
        const overduePlants: UserPlant[] = [];
        const dueTodayPlants: UserPlant[] = [];

        for (const plant of plants) {
          const schedule = calculateWateringSchedule(plant);

          if (schedule.isOverdue) {
            overduePlants.push(plant);
          } else if (schedule.daysUntilWatering === 0 && !schedule.isOverdue) {
            dueTodayPlants.push(plant);
          }
        }

        // Skip if no plants need attention
        if (overduePlants.length === 0 && dueTodayPlants.length === 0) {
          console.log(`User ${profile.id} has no plants needing water, skipping`);
          continue;
        }

        // Get user's active push tokens
        const { data: tokens, error: tokensError } = await supabase
          .from('push_notification_tokens')
          .select('id, user_id, token, device_type, is_active')
          .eq('user_id', profile.id)
          .eq('is_active', true);

        if (tokensError || !tokens || tokens.length === 0) {
          console.log(`User ${profile.id} has no active push tokens, skipping`);
          continue;
        }

        // Build notification message
        let title = '🌱 Plant Watering Reminder';
        let message = '';
        const plantIds: string[] = [];

        if (overduePlants.length > 0) {
          title = '🚨 Overdue Plant Watering';
          if (overduePlants.length === 1) {
            message = `${overduePlants[0].nickname} is overdue for watering!`;
          } else {
            message = `${overduePlants.length} plants are overdue for watering`;
          }
          plantIds.push(...overduePlants.map(p => p.id));
        } else if (dueTodayPlants.length > 0) {
          title = '💧 Plants Need Watering Today';
          if (dueTodayPlants.length === 1) {
            message = `${dueTodayPlants[0].nickname} needs watering today`;
          } else {
            message = `${dueTodayPlants.length} plants need watering today`;
          }
          plantIds.push(...dueTodayPlants.map(p => p.id));
        }

        // Send push notification
        const result = await sendPushNotification(
          tokens,
          title,
          message,
          {
            type: overduePlants.length > 0 ? 'overdue_watering' : 'due_today',
            plant_ids: plantIds,
            count: overduePlants.length + dueTodayPlants.length,
          }
        );

        // Log notification attempt
        const logStatus = result.success ? 'sent' : 'failed';

        for (const plantId of plantIds) {
          await supabase
            .from('notification_logs')
            .insert({
              user_id: profile.id,
              notification_type: overduePlants.length > 0 ? 'overdue_watering' : 'due_today',
              plant_id: plantId,
              status: logStatus,
              error_message: result.success ? null : String(result.error),
              metadata: {
                title,
                message,
                token_count: tokens.length,
              },
            });
        }

        if (result.success) {
          notificationsSent++;
          console.log(`✓ Sent notification to user ${profile.id} (${profile.first_name})`);
        } else {
          notificationsFailed++;
          console.error(`✗ Failed to send notification to user ${profile.id}:`, result.error);
        }

        // Update last_used_at for tokens
        await supabase
          .from('push_notification_tokens')
          .update({ last_used_at: new Date().toISOString() })
          .in('id', tokens.map(t => t.id));

      } catch (userError) {
        console.error(`Error processing user ${profile.id}:`, userError);
        notificationsFailed++;
      }
    }

    console.log(`Notification job completed: ${notificationsSent} sent, ${notificationsFailed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        notifications_sent: notificationsSent,
        notifications_failed: notificationsFailed,
        users_processed: profiles?.length || 0,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Fatal error in notification function:', error);
    return new Response(
      JSON.stringify({
        error: String(error),
        success: false,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
