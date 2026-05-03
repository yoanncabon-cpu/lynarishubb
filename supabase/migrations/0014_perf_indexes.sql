-- Indexes composites pour /api/analytics + /api/notifications
-- Avant : queries scannent par org_id seul puis filtrent timestamp en mémoire.
-- Après : index composite couvre WHERE org_id = ? AND timestamp >= ? en 1 seek.
-- Gain attendu : 30-60% sur les queries dashboard quand les tables grossissent.

-- Analytics : WHERE org_id = ? AND started_at >= ?
CREATE INDEX IF NOT EXISTS "conversations_org_started_idx"
  ON "conversations"("org_id", "started_at" DESC);

-- Analytics : WHERE org_id = ? AND created_at >= ? (4 queries dashboard)
CREATE INDEX IF NOT EXISTS "action_logs_org_created_idx"
  ON "action_logs"("org_id", "created_at" DESC);

-- Analytics : GROUP BY type WHERE org_id = ?
CREATE INDEX IF NOT EXISTS "action_logs_org_type_idx"
  ON "action_logs"("org_id", "type");

-- Notifications : WHERE org_id = ? AND dismissed_at IS NULL ORDER BY created_at DESC
-- Partial index : ne stocke que les notifs non-effacées (table très petite en pratique)
-- Lecture quasi instantanée même avec millions de lignes action_logs.
CREATE INDEX IF NOT EXISTS "action_logs_notif_active_idx"
  ON "action_logs"("org_id", "created_at" DESC)
  WHERE "notification_dismissed_at" IS NULL;
