-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "result" DROP NOT NULL,
ALTER COLUMN "result" SET DEFAULT '';
