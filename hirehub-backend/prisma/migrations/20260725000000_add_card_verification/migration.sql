-- CreateEnum
CREATE TYPE "CardVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "CardVerification" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "orderId" TEXT NOT NULL,
    "transactionId" TEXT,
    "status" "CardVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CardVerification_orderId_key" ON "CardVerification"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "CardVerification_transactionId_key" ON "CardVerification"("transactionId");

-- CreateIndex
CREATE INDEX "CardVerification_employerId_idx" ON "CardVerification"("employerId");

-- CreateIndex
CREATE INDEX "CardVerification_orderId_idx" ON "CardVerification"("orderId");

-- AddForeignKey
ALTER TABLE "CardVerification" ADD CONSTRAINT "CardVerification_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "EmployerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
