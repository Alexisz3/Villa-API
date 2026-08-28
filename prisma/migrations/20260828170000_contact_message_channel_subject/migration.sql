-- El formulario de contacto tiene dos canales: WhatsApp (principal) y correo.
-- Hasta ahora solo el flujo de correo dejaba registro; el de WhatsApp abría
-- wa.me y descartaba los datos que el visitante ya había llenado. Ahora ambos
-- se guardan, con el canal y el asunto como columnas propias.

ALTER TABLE "contact_messages"
  ADD COLUMN "subject" TEXT,
  ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'email';
