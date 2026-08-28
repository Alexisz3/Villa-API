import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';

// Levanta la app Nest con la MISMA configuración global que `main.ts`
// (prefijo /api, ValidationPipe estricto, cookie-parser) para que los tests
// e2e ejerciten el mismo comportamiento que producción.
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    // El rate-limiting no aporta nada a los tests y sí los vuelve frágiles
    // (varios logins seguidos dispararían el 429).
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}

const ADMIN_EMAIL = 'admin@villaanamaria.com';
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || 'AdminVilla2026!';

// Hace login como el admin sembrado y devuelve la cookie de sesión lista para
// pasarla a `.set('Cookie', cookie)` en las requests protegidas.
export async function loginAsAdmin(
  app: INestApplication,
): Promise<string> {
  const request = (await import('supertest')).default;
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

  const setCookie = res.headers['set-cookie'];
  if (!setCookie || res.status !== 201) {
    throw new Error(
      `loginAsAdmin falló (status ${res.status}). ¿Corriste migrate deploy + seed sobre villa_test_db?`,
    );
  }
  return Array.isArray(setCookie) ? setCookie[0] : setCookie;
}
