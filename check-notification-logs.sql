-- Check notification logs
SELECT
  nl.id,
  nl.sent_at,
  nl.notification_type,
  nl.status,
  nl.error_message,
  nl.metadata,
  up.nickname as plant_name,
  p.first_name
FROM notification_logs nl
JOIN user_plants up ON nl.plant_id = up.id
JOIN profiles p ON nl.user_id = p.id
ORDER BY nl.sent_at DESC
LIMIT 10;

-- Check if you have push tokens registered
SELECT
  pnt.device_type,
  pnt.device_name,
  pnt.is_active,
  pnt.created_at,
  p.first_name
FROM push_notification_tokens pnt
JOIN profiles p ON pnt.user_id = p.id
WHERE pnt.is_active = true;
