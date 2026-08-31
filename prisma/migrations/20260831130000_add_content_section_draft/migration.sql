-- Borrador/publicación (PR-C): cada guardado desde el panel ahora escribe en
-- esta columna en vez de las columnas vivas, y un nuevo endpoint "publish"
-- las copia a las columnas vivas. `IF NOT EXISTS` por precaución: una
-- migración anterior en esta misma tabla (20260828173846_make_media_order_optional)
-- se rompió y tuvo que revertirse en 20260828190000_restore_reservation_overlap.
ALTER TABLE "content_sections" ADD COLUMN IF NOT EXISTS "draft" JSONB;
