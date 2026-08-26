-- Add optional guest-provided details that were being silently dropped
-- (previously only sent to WhatsApp, never persisted).
ALTER TABLE "reservations" ADD COLUMN "guests" TEXT;
ALTER TABLE "reservations" ADD COLUMN "message" TEXT;
ALTER TABLE "reservations" ADD COLUMN "preferredTime" TEXT;
