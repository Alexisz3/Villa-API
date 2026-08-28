-- Contenido estructurado opcional para las secciones con listas de ítems
-- (personajes, testimonios, aliados). Las secciones simples lo dejan en NULL.
ALTER TABLE "content_sections" ADD COLUMN "data" JSONB;
