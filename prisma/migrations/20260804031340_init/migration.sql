-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultMeterType" TEXT NOT NULL,
    "fleetGroup" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "brand" TEXT,
    "typeLabel" TEXT,
    "model" TEXT,
    "regNo" TEXT,
    "capacity" TEXT,
    "yom" INTEGER,
    "chassisNo" TEXT,
    "engineNo" TEXT,
    "serialNo" TEXT,
    "site" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "categoryId" TEXT NOT NULL,
    "meterType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FuelPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fuelKind" TEXT NOT NULL,
    "pricePerLitre" INTEGER NOT NULL,
    "effectiveFrom" DATETIME NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enteredById" TEXT,
    CONSTRAINT "FuelPrice_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FuelRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fuelKind" TEXT NOT NULL,
    "requestedLitres" REAL NOT NULL,
    "meterReading" REAL,
    "readingType" TEXT,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedAt" DATETIME,
    "reviewNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "assetId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    CONSTRAINT "FuelRequest_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FuelRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FuelRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FuelIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fuelKind" TEXT NOT NULL,
    "litres" REAL NOT NULL,
    "meterReading" REAL,
    "readingType" TEXT,
    "pricePerLitre" INTEGER NOT NULL,
    "totalCost" INTEGER NOT NULL,
    "source" TEXT,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assetId" TEXT NOT NULL,
    "fuelPriceId" TEXT,
    "issuedById" TEXT NOT NULL,
    "linkedRequestId" TEXT,
    CONSTRAINT "FuelIssue_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FuelIssue_fuelPriceId_fkey" FOREIGN KEY ("fuelPriceId") REFERENCES "FuelPrice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FuelIssue_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FuelIssue_linkedRequestId_fkey" FOREIGN KEY ("linkedRequestId") REFERENCES "FuelRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeterReading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" REAL NOT NULL,
    "readingType" TEXT NOT NULL,
    "readingDate" DATETIME NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceIssueId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assetId" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,
    CONSTRAINT "MeterReading_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MeterReading_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT,
    "metaJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Category_code_key" ON "Category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_code_key" ON "Asset"("code");

-- CreateIndex
CREATE INDEX "Asset_categoryId_idx" ON "Asset"("categoryId");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

-- CreateIndex
CREATE INDEX "Asset_meterType_idx" ON "Asset"("meterType");

-- CreateIndex
CREATE INDEX "FuelPrice_fuelKind_effectiveFrom_idx" ON "FuelPrice"("fuelKind", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "FuelPrice_fuelKind_effectiveFrom_key" ON "FuelPrice"("fuelKind", "effectiveFrom");

-- CreateIndex
CREATE INDEX "FuelRequest_status_idx" ON "FuelRequest"("status");

-- CreateIndex
CREATE INDEX "FuelRequest_assetId_createdAt_idx" ON "FuelRequest"("assetId", "createdAt");

-- CreateIndex
CREATE INDEX "FuelRequest_requestedById_idx" ON "FuelRequest"("requestedById");

-- CreateIndex
CREATE UNIQUE INDEX "FuelIssue_linkedRequestId_key" ON "FuelIssue"("linkedRequestId");

-- CreateIndex
CREATE INDEX "FuelIssue_assetId_issueDate_idx" ON "FuelIssue"("assetId", "issueDate");

-- CreateIndex
CREATE INDEX "FuelIssue_fuelKind_issueDate_idx" ON "FuelIssue"("fuelKind", "issueDate");

-- CreateIndex
CREATE INDEX "FuelIssue_issueDate_idx" ON "FuelIssue"("issueDate");

-- CreateIndex
CREATE INDEX "MeterReading_assetId_readingDate_idx" ON "MeterReading"("assetId", "readingDate");

-- CreateIndex
CREATE INDEX "MeterReading_assetId_readingType_readingDate_idx" ON "MeterReading"("assetId", "readingType", "readingDate");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
