-- AlterTable
ALTER TABLE "WithdrawRequest"
ADD COLUMN "paymentId" TEXT,
ADD COLUMN "employerConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "employerConfirmedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawRequest_paymentId_key" ON "WithdrawRequest"("paymentId");

-- AddForeignKey
ALTER TABLE "WithdrawRequest"
ADD CONSTRAINT "WithdrawRequest_paymentId_fkey"
FOREIGN KEY ("paymentId") REFERENCES "Payment"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
