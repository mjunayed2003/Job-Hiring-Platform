-- Track when a jobseeker marks a hire as completed so withdrawals can be unlocked
ALTER TABLE "Payment"
ADD COLUMN "candidateCompletedAt" TIMESTAMP(3);
