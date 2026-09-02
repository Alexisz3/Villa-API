-- "Recuperar contraseña" del panel: token de un solo uso, hasheado en la
-- base (SHA-256). `IF NOT EXISTS` / bloque DO por la misma precaución que las
-- migraciones recientes de este repo (bases reconstruidas desde cero han
-- quedado con estado mixto por migraciones que se revirtieron a mano).

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'password_reset_tokens_userId_fkey'
    ) THEN
        ALTER TABLE "password_reset_tokens"
            ADD CONSTRAINT "password_reset_tokens_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
