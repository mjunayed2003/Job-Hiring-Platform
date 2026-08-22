-- Drop legacy employer confirmation columns from withdraw requests
ALTER TABLE "WithdrawRequest"
DROP COLUMN IF EXISTS "employerConfirmed",
DROP COLUMN IF EXISTS "employerConfirmedAt";
