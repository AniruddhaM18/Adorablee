-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('creating', 'ready', 'failed');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "staus" "ProjectStatus" NOT NULL DEFAULT 'creating';
