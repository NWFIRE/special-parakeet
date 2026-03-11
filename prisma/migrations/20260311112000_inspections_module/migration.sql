CREATE TYPE "InspectionServiceType" AS ENUM ('FIRE_EXTINGUISHER', 'KITCHEN_SUPPRESSION', 'FIRE_ALARM', 'EMERGENCY_EXIT_LIGHTING', 'FIRE_SPRINKLER', 'BACKFLOW', 'OTHER');

ALTER TABLE "Client"
  ADD COLUMN "teamId" TEXT,
  ADD COLUMN "contactPhone" TEXT,
  ADD COLUMN "siteCount" INTEGER,
  ADD COLUMN "notes" TEXT;

ALTER TABLE "InspectionReport"
  ADD COLUMN "teamId" TEXT,
  ADD COLUMN "reportNumber" TEXT,
  ADD COLUMN "serviceType" "InspectionServiceType",
  ADD COLUMN "pointOfContact" TEXT,
  ADD COLUMN "frequencyLabel" TEXT,
  ADD COLUMN "nextInspectionDate" TIMESTAMP(3),
  ADD COLUMN "equipmentSummary" JSONB;

UPDATE "Client"
SET "teamId" = team_membership."teamId"
FROM (
  SELECT DISTINCT ON (u."clientId") u."clientId", m."teamId"
  FROM "User" u
  JOIN "Membership" m ON m."userId" = u."id"
  WHERE u."clientId" IS NOT NULL
  ORDER BY u."clientId", m."createdAt" ASC
) AS team_membership
WHERE "Client"."id" = team_membership."clientId";

UPDATE "InspectionReport" ir
SET
  "teamId" = c."teamId",
  "serviceType" = CASE ir."inspectionType"
    WHEN 'fire_alarm' THEN 'FIRE_ALARM'::"InspectionServiceType"
    WHEN 'wet_sprinkler' THEN 'FIRE_SPRINKLER'::"InspectionServiceType"
    WHEN 'fire_extinguisher' THEN 'FIRE_EXTINGUISHER'::"InspectionServiceType"
    WHEN 'kitchen_suppression' THEN 'KITCHEN_SUPPRESSION'::"InspectionServiceType"
    WHEN 'emergency_exit_lighting' THEN 'EMERGENCY_EXIT_LIGHTING'::"InspectionServiceType"
    WHEN 'backflow' THEN 'BACKFLOW'::"InspectionServiceType"
    ELSE 'OTHER'::"InspectionServiceType"
  END,
  "reportNumber" = CONCAT('RPT-', UPPER(SUBSTRING(ir."id" FROM 1 FOR 8)))
FROM "Client" c
WHERE ir."clientId" = c."id";

ALTER TABLE "Client"
  ALTER COLUMN "teamId" SET NOT NULL;

ALTER TABLE "InspectionReport"
  ALTER COLUMN "teamId" SET NOT NULL,
  ALTER COLUMN "serviceType" SET NOT NULL,
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';

CREATE INDEX "Client_teamId_companyName_idx" ON "Client"("teamId", "companyName");
CREATE INDEX "InspectionReport_teamId_status_completedAt_idx" ON "InspectionReport"("teamId", "status", "completedAt");
CREATE INDEX "InspectionReport_clientId_status_completedAt_idx" ON "InspectionReport"("clientId", "status", "completedAt");

ALTER TABLE "Client" ADD CONSTRAINT "Client_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InspectionReport" ADD CONSTRAINT "InspectionReport_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
