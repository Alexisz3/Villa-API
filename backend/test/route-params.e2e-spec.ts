import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, loginAsAdmin } from './utils/bootstrap';

// Un :id no numérico debe dar 400 (Bad Request), no 500. Antes, varios
// controladores hacían `+id` a mano -> NaN -> Prisma reventaba -> 500.
describe('Route param validation (e2e)', () => {
  let app: INestApplication;
  let cookie: string;

  beforeAll(async () => {
    app = await createTestApp();
    cookie = await loginAsAdmin(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/rooms/:id no numérico -> 400', async () => {
    await request(app.getHttpServer()).get('/api/rooms/abc').expect(400);
  });

  it('GET /api/reservations/:id no numérico -> 400', async () => {
    await request(app.getHttpServer())
      .get('/api/reservations/abc')
      .set('Cookie', cookie)
      .expect(400);
  });

  it('PATCH /api/reservations/:id no numérico -> 400', async () => {
    await request(app.getHttpServer())
      .patch('/api/reservations/xyz')
      .set('Cookie', cookie)
      .send({ status: 'CONFIRMADA' })
      .expect(400);
  });

  it('DELETE /api/content-sections/:id no numérico -> 400', async () => {
    await request(app.getHttpServer())
      .delete('/api/content-sections/abc')
      .set('Cookie', cookie)
      .expect(400);
  });

  it('un :id numérico pero inexistente sigue dando 404', async () => {
    await request(app.getHttpServer())
      .get('/api/reservations/999999')
      .set('Cookie', cookie)
      .expect(404);
    await request(app.getHttpServer()).get('/api/rooms/999999').expect(404);
  });
});
