import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(cookieParser());

  // credentials: true is required so the browser is allowed to send the
  // httpOnly auth cookie cross-origin (frontend and API run on different
  // ports/domains). origin can't be '*' when credentials are enabled, so we
  // keep reflecting the request origin in dev and a strict allowlist in prod.
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim());
  app.enableCors(
    isProduction
      ? { origin: allowedOrigins ?? false, credentials: true }
      : { origin: true, credentials: true },
  );
  app.setGlobalPrefix('api');

  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Villa Ana Maria API')
      .setDescription('The backend API documentation for Villa Ana Maria')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, documentFactory);
  }
  app.useGlobalPipes(new ValidationPipe(
    {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }
  ));
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
