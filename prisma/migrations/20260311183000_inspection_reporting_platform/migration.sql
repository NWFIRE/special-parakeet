CREATE TYPE "InspectionOutcome" AS ENUM ('PASS', 'ATTENTION', 'FAIL', 'NOT_APPLICABLE');
CREATE TYPE "AutofillSourceType" AS ENUM ('ASSET_RECORD', 'PREVIOUS_REPORT', 'SITE_DEFAULT', 'TEAM_PROFILE', 'TEMPLATE', 'MANUAL');

CREATE TABLE "TeamProfile" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "companyName" TEXT,
  "logoUrl" TEXT,
  "addressLine1" TEXT,
  "addressLine2" TEXT,
  "city" TEXT,
  "state" TEXT,
  "postalCode" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "website" TEXT,
  "licenseNumbers" JSONB,
  "certificationText" TEXT,
  "reportDisclaimer" TEXT,
  "footerText" TEXT,
  "primaryColor" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeamProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientSite" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "siteCode" TEXT,
  "addressLine1" TEXT NOT NULL,
  "addressLine2" TEXT,
  "city" TEXT,
  "state" TEXT,
  "postalCode" TEXT,
  "contactName" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "notes" TEXT,
  "reportDefaults" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientSite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InspectionAsset" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "serviceType" "InspectionServiceType" NOT NULL,
  "name" TEXT NOT NULL,
  "location" TEXT,
  "assetTag" TEXT,
  "deviceType" TEXT,
  "manufacturer" TEXT,
  "model" TEXT,
  "serialNumber" TEXT,
  "ulListing" TEXT,
  "complianceFrequency" TEXT,
  "installDate" TIMESTAMP(3),
  "lastServiceDate" TIMESTAMP(3),
  "nextServiceDate" TIMESTAMP(3),
  "defaultCodeReferences" JSONB,
  "profileData" JSONB,
  "lastInspectionData" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InspectionAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InspectionReportAsset" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "assetId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "assetName" TEXT NOT NULL,
  "location" TEXT,
  "assetTag" TEXT,
  "deviceType" TEXT,
  "manufacturer" TEXT,
  "model" TEXT,
  "serialNumber" TEXT,
  "ulListing" TEXT,
  "complianceFrequency" TEXT,
  "lastServiceDate" TIMESTAMP(3),
  "nextServiceDate" TIMESTAMP(3),
  "status" "InspectionOutcome" NOT NULL DEFAULT 'PASS',
  "deficiencySummary" TEXT,
  "recommendationText" TEXT,
  "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
  "attributes" JSONB,
  "testResults" JSONB,
  "codeReferences" JSONB,
  "appliedTemplateKeys" JSONB,
  "autofillMeta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InspectionReportAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InspectionFieldAudit" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "reportAssetId" TEXT,
  "changedById" TEXT,
  "fieldPath" TEXT NOT NULL,
  "sourceType" "AutofillSourceType" NOT NULL,
  "sourceLabel" TEXT,
  "sourceValue" TEXT,
  "finalValue" TEXT,
  "wasOverridden" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InspectionFieldAudit_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "InspectionReport"
  ADD COLUMN "siteId" TEXT,
  ADD COLUMN "overallStatus" "InspectionOutcome" NOT NULL DEFAULT 'PASS',
  ADD COLUMN "serviceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "summary" TEXT,
  ADD COLUMN "recommendationSummary" TEXT,
  ADD COLUMN "codeReferences" JSONB,
  ADD COLUMN "technicianLicense" TEXT,
  ADD COLUMN "technicianCertification" TEXT,
  ADD COLUMN "customerSignature" JSONB,
  ADD COLUMN "technicianSignature" JSONB,
  ADD COLUMN "photoUrls" JSONB,
  ADD COLUMN "autoFillSummary" JSONB,
  ADD COLUMN "finalizedAt" TIMESTAMP(3),
  ADD COLUMN "portalPublishedAt" TIMESTAMP(3);

UPDATE "InspectionReport"
SET
  "serviceDate" = COALESCE("completedAt", "createdAt"),
  "overallStatus" = CASE WHEN jsonb_typeof("deficiencies") = 'array' AND jsonb_array_length(COALESCE("deficiencies", '[]'::jsonb)) > 0 THEN 'ATTENTION'::"InspectionOutcome" ELSE 'PASS'::"InspectionOutcome" END,
  "summary" = COALESCE("summary", "notes"),
  "portalPublishedAt" = CASE WHEN "status" <> 'DRAFT' THEN COALESCE("completedAt", "createdAt") ELSE NULL END,
  "finalizedAt" = CASE WHEN "status" <> 'DRAFT' THEN COALESCE("completedAt", "createdAt") ELSE NULL END;

CREATE UNIQUE INDEX "TeamProfile_teamId_key" ON "TeamProfile"("teamId");
CREATE INDEX "ClientSite_teamId_clientId_name_idx" ON "ClientSite"("teamId", "clientId", "name");
CREATE INDEX "InspectionAsset_teamId_serviceType_name_idx" ON "InspectionAsset"("teamId", "serviceType", "name");
CREATE INDEX "InspectionAsset_siteId_serviceType_idx" ON "InspectionAsset"("siteId", "serviceType");
CREATE INDEX "InspectionReport_siteId_serviceType_completedAt_idx" ON "InspectionReport"("siteId", "serviceType", "completedAt");
CREATE INDEX "InspectionReportAsset_reportId_sortOrder_idx" ON "InspectionReportAsset"("reportId", "sortOrder");
CREATE INDEX "InspectionReportAsset_assetId_status_idx" ON "InspectionReportAsset"("assetId", "status");
CREATE INDEX "InspectionFieldAudit_reportId_createdAt_idx" ON "InspectionFieldAudit"("reportId", "createdAt");
CREATE INDEX "InspectionFieldAudit_reportAssetId_fieldPath_idx" ON "InspectionFieldAudit"("reportAssetId", "fieldPath");

ALTER TABLE "TeamProfile" ADD CONSTRAINT "TeamProfile_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientSite" ADD CONSTRAINT "ClientSite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientSite" ADD CONSTRAINT "ClientSite_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InspectionAsset" ADD CONSTRAINT "InspectionAsset_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InspectionAsset" ADD CONSTRAINT "InspectionAsset_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InspectionAsset" ADD CONSTRAINT "InspectionAsset_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "ClientSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InspectionReport" ADD CONSTRAINT "InspectionReport_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "ClientSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InspectionReportAsset" ADD CONSTRAINT "InspectionReportAsset_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "InspectionReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InspectionReportAsset" ADD CONSTRAINT "InspectionReportAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "InspectionAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InspectionFieldAudit" ADD CONSTRAINT "InspectionFieldAudit_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "InspectionReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InspectionFieldAudit" ADD CONSTRAINT "InspectionFieldAudit_reportAssetId_fkey" FOREIGN KEY ("reportAssetId") REFERENCES "InspectionReportAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InspectionFieldAudit" ADD CONSTRAINT "InspectionFieldAudit_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;