import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Response } from 'express';
import { Prisma } from '../generated/prisma/client';

type AnyPrismaError =
  | Prisma.PrismaClientKnownRequestError
  | Prisma.PrismaClientInitializationError
  | Prisma.PrismaClientValidationError;

// Traduce los errores de Prisma a respuestas HTTP limpias. Sin este filtro,
// cualquier fallo de base de datos (unique, FK, conexion caida, query
// invalida) sale como un `500 Internal server error` opaco.
@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientInitializationError,
  Prisma.PrismaClientValidationError,
)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger('PrismaExceptionFilter');

  catch(exception: AnyPrismaError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      this.logger.error(`DB init: ${exception.message}`);
      return this.reply(
        res,
        HttpStatus.SERVICE_UNAVAILABLE,
        'Service Unavailable',
        'La base de datos no esta disponible. Reintenta en unos momentos.',
      );
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.error(`Query invalida: ${exception.message}`);
      return this.reply(
        res,
        HttpStatus.BAD_REQUEST,
        'Bad Request',
        'La consulta a la base de datos no es valida.',
      );
    }

    switch (exception.code) {
      case 'P2002': {
        const fields = (
          exception.meta?.target as string[] | string | undefined
        )?.toString();
        return this.reply(
          res,
          HttpStatus.CONFLICT,
          'Conflict',
          fields
            ? `Ya existe un registro con ese valor (${fields}).`
            : 'Ya existe un registro con esos datos.',
        );
      }
      case 'P2025':
        return this.reply(
          res,
          HttpStatus.NOT_FOUND,
          'Not Found',
          'El registro solicitado no existe.',
        );
      case 'P2003':
        return this.reply(
          res,
          HttpStatus.BAD_REQUEST,
          'Bad Request',
          'La operacion hace referencia a un registro relacionado que no existe.',
        );
      case 'P2000':
        return this.reply(
          res,
          HttpStatus.BAD_REQUEST,
          'Bad Request',
          'Uno de los valores es demasiado largo para su campo.',
        );
      default:
        // Codigo no mapeado: lo registramos y dejamos que el filtro base
        // responda un 500 generico (sin filtrar el stack al cliente).
        this.logger.error(`Prisma ${exception.code}: ${exception.message}`);
        return super.catch(exception, host);
    }
  }

  private reply(res: Response, status: number, error: string, message: string) {
    res.status(status).json({ statusCode: status, error, message });
  }
}
