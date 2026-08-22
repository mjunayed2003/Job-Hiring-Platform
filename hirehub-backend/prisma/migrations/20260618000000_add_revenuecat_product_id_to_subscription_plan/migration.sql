-- AlterTable
ALTER TABLE "SubscriptionPlan"
ADD COLUMN "revenueCatProductId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_revenueCatProductId_key" ON "SubscriptionPlan"("revenueCatProductId");
