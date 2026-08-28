-- Antes la restricción anti-solapamiento bloqueaba cualquier reserva que no
-- fuera CANCELADA — incluidas las COMPLETADA. Una estadía ya terminada no
-- debería impedir una reserva nueva en esas mismas fechas (y si alguien marca
-- por error una reserva futura como COMPLETADA, tampoco debería "esconder" la
-- habitación). Ahora solo PENDIENTE y CONFIRMADA ocupan el calendario, igual
-- que la lógica de la app (BLOCKING_STATUSES / findAvailableRooms).
--
-- La nueva condición es un subconjunto de la anterior, así que reconstruir la
-- restricción sobre los datos existentes nunca puede fallar.

ALTER TABLE "reservations" DROP CONSTRAINT "reservations_no_overlap";

ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_no_overlap"
  EXCLUDE USING gist ("roomId" WITH =, "dateRange" WITH &&)
  WHERE ("status" IN ('PENDIENTE', 'CONFIRMADA'));
