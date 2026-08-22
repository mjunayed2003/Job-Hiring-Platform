-- Add per-company slot override for manual subscription management
ALTER TABLE "EmployerSubscription"
ADD COLUMN IF NOT EXISTS "slotsOverride" INTEGER;
