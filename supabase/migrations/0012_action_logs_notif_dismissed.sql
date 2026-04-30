-- Notifications : permettre l'effacement utilisateur sans détruire l'audit log.
-- Le panneau /api/notifications filtrera WHERE notification_dismissed_at IS NULL.
ALTER TABLE "action_logs"
  ADD COLUMN IF NOT EXISTS "notification_dismissed_at" timestamptz;

CREATE INDEX IF NOT EXISTS "action_logs_notif_dismissed_idx"
  ON "action_logs"("notification_dismissed_at");
