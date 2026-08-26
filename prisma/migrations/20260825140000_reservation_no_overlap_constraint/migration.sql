-- Evita el doble-reserva a nivel de base de datos, no solo en el código.
-- El chequeo en reservations.service.ts (findFirst antes de create) tiene una
-- condición de carrera: dos requests simultáneas pueden pasar ambas el
-- chequeo antes de que cualquiera confirme. Esta restricción hace que
-- Postgres mismo rechace la segunda inserción/actualización que se cruce en
-- fechas con una reserva existente de la misma habitación (ignorando las
-- canceladas), sin importar el orden ni el timing de las requests.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "reservations"
  ADD COLUMN "dateRange" daterange GENERATED ALWAYS AS (
    daterange("checkIn"::date, "checkOut"::date, '[)')
  ) STORED;

ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_no_overlap"
  EXCLUDE USING gist ("roomId" WITH =, "dateRange" WITH &&)
  WHERE ("status" <> 'CANCELADA');
