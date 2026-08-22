-- Add employer completion timestamp to payments
ALTER TABLE "Payment"
ADD COLUMN "employerCompletedAt" TIMESTAMP(3);
