-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "salaryCurrency" TEXT,
ADD COLUMN     "salaryMax" DECIMAL(12,2),
ADD COLUMN     "salaryMin" DECIMAL(12,2);
