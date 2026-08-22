-- Drop the old unique constraint so multiple withdraw requests can reference the same payment
DROP INDEX IF EXISTS "WithdrawRequest_paymentId_key";
