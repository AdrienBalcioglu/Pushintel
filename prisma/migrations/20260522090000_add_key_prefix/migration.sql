-- Add keyPrefix column for O(1) API key lookup
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "keyPrefix" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_keyPrefix_key" ON "ApiKey"("keyPrefix");
