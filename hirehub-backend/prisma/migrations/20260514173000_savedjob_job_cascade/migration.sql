-- Drop and recreate the SavedJob -> Job foreign key with cascade delete.
-- This preserves all existing rows and only changes referential behavior.

ALTER TABLE "SavedJob" DROP CONSTRAINT IF EXISTS "SavedJob_jobId_fkey";

ALTER TABLE "SavedJob"
ADD CONSTRAINT "SavedJob_jobId_fkey"
FOREIGN KEY ("jobId") REFERENCES "Job"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
