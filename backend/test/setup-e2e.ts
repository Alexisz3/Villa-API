// Se ejecuta ANTES de cargar cada suite e2e (jest `setupFiles`).
//
// Redirige la app a una base de datos de PRUEBAS aislada para que los tests
// nunca toquen los datos de desarrollo. El orden importa: hay que fijar
// `process.env.DATABASE_URL` aquí, porque `@nestjs/config` respeta las
// variables ya presentes en el entorno y no las pisa con `../.env`.
import { config } from 'dotenv';
import { resolve } from 'path';

// Carga el .env real (para JWT_SECRET, credenciales, etc.) sin pisar lo que
// ya venga del entorno.
config({ path: resolve(__dirname, '../../.env') });

const explicit = process.env.TEST_DATABASE_URL;
const derived = (process.env.DATABASE_URL ?? '').replace(
  /\/villa_db(\?|$)/,
  '/villa_test_db$1',
);

process.env.DATABASE_URL =
  explicit ||
  derived ||
  'postgresql://postgres:postgres@localhost:5432/villa_test_db?schema=public';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-secret';
