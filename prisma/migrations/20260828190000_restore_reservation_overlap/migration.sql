-- Deshace los daños de una migración inválida creada por error
-- (20260828173846_make_media_order_optional, ya eliminada del historial):
--   - quita la columna `media_assets.order` que se agregó sin usarse
--   - restaura la columna generada `dateRange` y la restricción EXCLUDE
--     anti-doble-reserva (con la regla PENDIENTE/CONFIRMADA de la migración
--     20260828160000) que esa migración había borrado.
--
-- Todo con guardas IF EXISTS / IF NOT EXISTS para que sea seguro correrla
-- tanto sobre una base dañada como sobre una sana.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "media_assets" DROP COLUMN IF EXISTS "order";

ALTER TABLE "reservations"
  ADD COLUMN IF NOT EXISTS "dateRange" daterange GENERATED ALWAYS AS (
    daterange("checkIn"::date, "checkOut"::date, '[)')
  ) STORED;

ALTER TABLE "reservations" DROP CONSTRAINT IF EXISTS "reservations_no_overlap";

ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_no_overlap"
  EXCLUDE USING gist ("roomId" WITH =, "dateRange" WITH &&)
  WHERE ("status" IN ('PENDIENTE', 'CONFIRMADA'));
