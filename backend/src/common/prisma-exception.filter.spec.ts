import { ArgumentsHost } from '@nestjs/common';
import type { HttpServer } from '@nestjs/common';
import { PrismaClientExceptionFilter } from './prisma-exception.filter';
import { Prisma } from '../generated/prisma/client';

function mockHost() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

const knownError = (code: string, meta?: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError('boom', {
    code,
    clientVersion: 'test',
    meta,
  });

describe('PrismaClientExceptionFilter', () => {
  const filter = new PrismaClientExceptionFilter({} as HttpServer);

  it('mapea P2002 (unique) a 409', () => {
    const { host, status, json } = mockHost();
    filter.catch(knownError('P2002', { target: ['email'] }), host);
    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, error: 'Conflict' }),
    );
  });

  it('mapea P2025 (no encontrado) a 404', () => {
    const { host, status } = mockHost();
    filter.catch(knownError('P2025'), host);
    expect(status).toHaveBeenCalledWith(404);
  });

  it('mapea P2003 (FK) a 400', () => {
    const { host, status } = mockHost();
    filter.catch(knownError('P2003'), host);
    expect(status).toHaveBeenCalledWith(400);
  });

  it('mapea PrismaClientInitializationError (BD caida) a 503', () => {
    const { host, status, json } = mockHost();
    const err = new Prisma.PrismaClientInitializationError('no db', 'test');
    filter.catch(err, host);
    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 503 }),
    );
  });

  it('nunca filtra el mensaje crudo de Prisma al cliente', () => {
    const { host, json } = mockHost();
    filter.catch(knownError('P2002', { target: ['email'] }), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.not.stringContaining('boom'),
      }),
    );
  });
});
