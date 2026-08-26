ALTER TABLE "contact_messages" ALTER COLUMN "status" SET DEFAULT 'pendiente';

UPDATE "contact_messages"
SET "status" = 'pendiente'
WHERE "status" = 'pendente';

UPDATE "rooms"
SET "status" = 'active'
WHERE LOWER("status") IN ('active', 'activa');

DELETE FROM "role_permissions"
WHERE "permissionId" IN (
  SELECT "id"
  FROM "permissions"
  WHERE "code" IN ('conctact_messages: read', 'contact messages: update')
);

DELETE FROM "permissions"
WHERE "code" IN ('conctact_messages: read', 'contact messages: update');
