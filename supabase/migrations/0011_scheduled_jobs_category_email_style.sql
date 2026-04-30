-- Ajout de category + email_style sur scheduled_jobs.
-- category : groupe d'affichage dans le dashboard automatisations (communication, reporting, etc.)
-- email_style : config visuelle des emails que l'agent envoie pour ce job (preset + couleur accent)
ALTER TABLE "scheduled_jobs"
  ADD COLUMN IF NOT EXISTS "category"     text,
  ADD COLUMN IF NOT EXISTS "email_style"  jsonb;

CREATE INDEX IF NOT EXISTS "scheduled_jobs_category_idx" ON "scheduled_jobs"("category");
