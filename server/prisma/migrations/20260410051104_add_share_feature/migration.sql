-- CreateTable
CREATE TABLE "shares" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipient_sessions" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "codeExpiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "sessionExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipient_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_rate_limits" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "lastCodeSentAt" TIMESTAMP(3),
    "verifyAttempts" INTEGER NOT NULL DEFAULT 0,
    "verifyWindowStart" TIMESTAMP(3),
    "failedActionCount" INTEGER NOT NULL DEFAULT 0,
    "failedActionWindowStart" TIMESTAMP(3),
    "lockedUntil" TIMESTAMP(3),

    CONSTRAINT "share_rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shares_token_key" ON "shares"("token");

-- CreateIndex
CREATE UNIQUE INDEX "share_rate_limits_shareId_key" ON "share_rate_limits"("shareId");

-- AddForeignKey
ALTER TABLE "shares" ADD CONSTRAINT "shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipient_sessions" ADD CONSTRAINT "recipient_sessions_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "shares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_rate_limits" ADD CONSTRAINT "share_rate_limits_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "shares"("id") ON DELETE CASCADE ON UPDATE CASCADE;
