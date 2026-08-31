-- AlterTable
ALTER TABLE "TableSession" ADD COLUMN     "changeCallLastNotifiedAt" TIMESTAMP(3),
ADD COLUMN     "changeCallRequestedAt" TIMESTAMP(3),
ADD COLUMN     "reorderNoticeAt" TIMESTAMP(3),
ADD COLUMN     "reorderNoticeMessage" TEXT;
