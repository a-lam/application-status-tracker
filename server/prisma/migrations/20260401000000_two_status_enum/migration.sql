-- Migrate ApplicationStatus enum from 6 values to 2 (NOT_SUBMITTED, SUBMITTED).
-- PostgreSQL does not support removing enum values directly, so we:
--   1. Drop the column default
--   2. Cast the column to TEXT
--   3. Normalise existing data
--   4. Drop the old enum
--   5. Create the new enum
--   6. Cast the column back and restore the default

ALTER TABLE "applications" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "applications" ALTER COLUMN "status" TYPE TEXT;

UPDATE "applications" SET "status" = 'NOT_SUBMITTED' WHERE "status" != 'SUBMITTED';

DROP TYPE "ApplicationStatus";

CREATE TYPE "ApplicationStatus" AS ENUM ('NOT_SUBMITTED', 'SUBMITTED');

ALTER TABLE "applications"
  ALTER COLUMN "status" TYPE "ApplicationStatus"
  USING "status"::"ApplicationStatus";

ALTER TABLE "applications"
  ALTER COLUMN "status" SET DEFAULT 'NOT_SUBMITTED';
