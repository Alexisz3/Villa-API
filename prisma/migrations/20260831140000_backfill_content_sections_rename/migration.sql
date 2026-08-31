-- Hueco encontrado en el historial de migraciones: en algún momento del
-- proyecto `content_sections` pasó de sectionKey/content/imageUrl/pageSlug
-- (ligadas a la vieja tabla `pages`, ver 20260819141325/20260820170000) a
-- sectionName/banner/images, pero ese paso se aplicó a `villa_db` a mano o
-- vía `prisma db push` y nunca quedó como migración. Una base construida
-- 100% desde este historial (por ejemplo `villa_test_db` recreada desde
-- cero para CI) termina con AMBOS juegos de columnas superpuestos y sin el
-- índice único que espera el schema actual. Esta migración es idempotente:
-- en `villa_db` (que ya está en la forma correcta) cada paso es un no-op;
-- en una base recién migrada, hace la misma transformación que se le aplicó
-- a `villa_db` en su momento.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_sections' AND column_name = 'sectionName'
  ) THEN
    ALTER TABLE "content_sections" ADD COLUMN "sectionName" TEXT;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'content_sections' AND column_name = 'sectionKey'
    ) THEN
      UPDATE "content_sections" SET "sectionName" = "sectionKey" WHERE "sectionName" IS NULL;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_sections' AND column_name = 'banner'
  ) THEN
    ALTER TABLE "content_sections" ADD COLUMN "banner" TEXT;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'content_sections' AND column_name = 'imageUrl'
    ) THEN
      UPDATE "content_sections" SET "banner" = "imageUrl" WHERE "banner" IS NULL;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_sections' AND column_name = 'images'
  ) THEN
    ALTER TABLE "content_sections" ADD COLUMN "images" TEXT[];
  END IF;
END $$;

-- No debería haber filas reales sin sectionName; una base recién creada por
-- las migraciones desde cero (sin datos) no tiene ninguna fila en esta
-- tabla, así que este DELETE es un no-op ahí.
DELETE FROM "content_sections" WHERE "sectionName" IS NULL;

ALTER TABLE "content_sections" ALTER COLUMN "sectionName" SET NOT NULL;

DROP INDEX IF EXISTS "content_sections_pageSlug_sectionKey_key";
CREATE UNIQUE INDEX IF NOT EXISTS "content_sections_sectionName_key" ON "content_sections"("sectionName");

ALTER TABLE "content_sections"
  DROP COLUMN IF EXISTS "sectionKey",
  DROP COLUMN IF EXISTS "content",
  DROP COLUMN IF EXISTS "imageUrl",
  DROP COLUMN IF EXISTS "pageSlug";
