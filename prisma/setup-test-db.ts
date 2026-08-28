/**
 * Prepara la base de datos de PRUEBAS que usan los tests e2e del backend
 * (`backend/npm run test:e2e`). Idempotente: se puede correr las veces que
 * haga falta.
 *
 *   npx tsx prisma/setup-test-db.ts
 *
 * Toma la conexión de `DATABASE_URL` (.env) y deriva el nombre de la BD de
 * test cambiando `villa_db` -> `villa_test_db`, salvo que se defina
 * `TEST_DATABASE_URL` explícitamente.
 */
import 'dotenv/config';
import { execSync } from 'node:child_process';
import { Client } from 'pg';

const source = process.env.DATABASE_URL;
if (!source) {
  console.error('Falta DATABASE_URL en el entorno / .env');
  process.exit(1);
}

const testUrl =
  process.env.TEST_DATABASE_URL ??
  source.replace(/\/villa_db(\?|$)/, '/villa_test_db$1');

const testDbName = new URL(testUrl).pathname.slice(1);

async function ensureDatabase() {
  // Conexión a la BD "postgres" para poder crear la de test si no existe.
  const admin = new Client({
    connectionString: source!.replace(/\/[^/?]+(\?|$)/, '/postgres$1'),
  });
  await admin.connect();
  const { rowCount } = await admin.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [testDbName],
  );
  if (rowCount === 0) {
    await admin.query(`CREATE DATABASE "${testDbName}"`);
    console.log(`Base de datos "${testDbName}" creada.`);
  } else {
    console.log(`Base de datos "${testDbName}" ya existe.`);
  }
  await admin.end();
}

async function main() {
  await ensureDatabase();

  const env = { ...process.env, DATABASE_URL: testUrl };
  console.log('Aplicando migraciones...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env });
  console.log('Sembrando datos base (rooms, admin, permisos)...');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit', env });
  console.log(`\nListo. Test DB: ${testUrl}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
