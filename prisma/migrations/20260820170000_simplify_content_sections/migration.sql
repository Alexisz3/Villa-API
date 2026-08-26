-- Simplificar content_sections para no depender de pages.
-- Cada seccion indica directamente la pagina con pageSlug.

ALTER TABLE "content_sections" DROP CONSTRAINT IF EXISTS "content_sections_pageId_fkey";
DROP INDEX IF EXISTS "content_sections_pageId_sectionKey_key";

ALTER TABLE "content_sections"
ADD COLUMN IF NOT EXISTS "pageSlug" TEXT,
ADD COLUMN IF NOT EXISTS "title" TEXT,
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

UPDATE "content_sections" cs
SET "pageSlug" = p."slug"
FROM "pages" p
WHERE cs."pageId" = p."id"
  AND cs."pageSlug" IS NULL;

UPDATE "content_sections"
SET "pageSlug" = 'general'
WHERE "pageSlug" IS NULL;

ALTER TABLE "content_sections"
ALTER COLUMN "pageSlug" SET NOT NULL,
ALTER COLUMN "content" DROP NOT NULL;

ALTER TABLE "content_sections"
DROP COLUMN IF EXISTS "pageId";

CREATE UNIQUE INDEX "content_sections_pageSlug_sectionKey_key"
ON "content_sections"("pageSlug", "sectionKey");

DROP TABLE IF EXISTS "pages";
