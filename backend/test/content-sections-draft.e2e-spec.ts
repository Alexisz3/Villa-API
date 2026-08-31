import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, loginAsAdmin } from './utils/bootstrap';
import { PrismaService } from '../src/database/prisma.service';

// Nombre único por test para no chocar entre corridas / no depender de orden.
const uniqueName = (label: string) =>
  `e2e-draft-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

describe('Content sections — borrador/publicación (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookie: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    cookie = await loginAsAdmin(app);
  });

  afterAll(async () => {
    await prisma.contentSection.deleteMany({
      where: { sectionName: { startsWith: 'e2e-draft-' } },
    });
    await app.close();
  });

  it('crear una sección nueva no la publica: no aparece por GET público hasta publicar', async () => {
    const sectionName = uniqueName('nueva');

    const created = await request(app.getHttpServer())
      .post('/api/content-sections')
      .set('Cookie', cookie)
      .send({ sectionName, title: 'Borrador sin publicar' })
      .expect(201);

    const publicList = await request(app.getHttpServer())
      .get(`/api/content-sections?sectionName=${sectionName}`)
      .expect(200);
    expect(publicList.body.title).toBeNull();
    expect(publicList.body).not.toHaveProperty('draft');

    const adminList = await request(app.getHttpServer())
      .get('/api/content-sections/admin')
      .set('Cookie', cookie)
      .expect(200);
    const adminRow = adminList.body.find((s: { id: number }) => s.id === created.body.id);
    expect(adminRow.draft).toMatchObject({ title: 'Borrador sin publicar' });
  });

  it('publicar copia el borrador a las columnas vivas y el sitio público lo refleja', async () => {
    const sectionName = uniqueName('publicar');

    const created = await request(app.getHttpServer())
      .post('/api/content-sections')
      .set('Cookie', cookie)
      .send({ sectionName, title: 'Antes de publicar' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/content-sections/${created.body.id}/publish`)
      .set('Cookie', cookie)
      .expect(201);

    const publicRow = await request(app.getHttpServer())
      .get(`/api/content-sections?sectionName=${sectionName}`)
      .expect(200);
    expect(publicRow.body.title).toBe('Antes de publicar');

    const adminList = await request(app.getHttpServer())
      .get('/api/content-sections/admin')
      .set('Cookie', cookie)
      .expect(200);
    const adminRow = adminList.body.find((s: { id: number }) => s.id === created.body.id);
    expect(adminRow.draft).toBeNull();
  });

  it('descartar el borrador no toca lo publicado', async () => {
    const sectionName = uniqueName('descartar');

    const created = await request(app.getHttpServer())
      .post('/api/content-sections')
      .set('Cookie', cookie)
      .send({ sectionName, title: 'Publicado v1' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/content-sections/${created.body.id}/publish`)
      .set('Cookie', cookie)
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/content-sections/${created.body.id}`)
      .set('Cookie', cookie)
      .send({ title: 'Cambio a medio hacer' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/content-sections/${created.body.id}/discard-draft`)
      .set('Cookie', cookie)
      .expect(201);

    const publicRow = await request(app.getHttpServer())
      .get(`/api/content-sections?sectionName=${sectionName}`)
      .expect(200);
    expect(publicRow.body.title).toBe('Publicado v1');
  });

  it('publicar sin borrador pendiente devuelve 400', async () => {
    const sectionName = uniqueName('sin-borrador');
    const created = await request(app.getHttpServer())
      .post('/api/content-sections')
      .set('Cookie', cookie)
      .send({ sectionName, title: 'x' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/content-sections/${created.body.id}/publish`)
      .set('Cookie', cookie)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/content-sections/${created.body.id}/publish`)
      .set('Cookie', cookie)
      .expect(400);
  });

  it('reordenar imágenes válida escribe en el borrador; una permutación inválida da 400', async () => {
    const sectionName = uniqueName('galeria');
    const created = await request(app.getHttpServer())
      .post('/api/content-sections')
      .set('Cookie', cookie)
      .send({ sectionName, images: ['/uploads/a.png', '/uploads/b.png', '/uploads/c.png'] })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/content-sections/${created.body.id}/images/order`)
      .set('Cookie', cookie)
      .send({ images: ['/uploads/c.png', '/uploads/a.png', '/uploads/b.png'] })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/content-sections/${created.body.id}/images/order`)
      .set('Cookie', cookie)
      .send({ images: ['/uploads/a.png', '/uploads/b.png'] }) // falta una
      .expect(400);

    const adminList = await request(app.getHttpServer())
      .get('/api/content-sections/admin')
      .set('Cookie', cookie)
      .expect(200);
    const adminRow = adminList.body.find((s: { id: number }) => s.id === created.body.id);
    expect(adminRow.draft.images).toEqual(['/uploads/c.png', '/uploads/a.png', '/uploads/b.png']);
  });

  it('GET /content-sections/admin exige autenticación (401 sin cookie)', async () => {
    await request(app.getHttpServer()).get('/api/content-sections/admin').expect(401);
  });
});
