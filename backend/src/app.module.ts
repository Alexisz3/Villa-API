import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { join } from 'path';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { ContactMessagesModule } from './modules/contact-messages/contact-messages.module';

import { AuthModule } from './modules/auth/auth.module';
import { InstallationsModule } from './modules/installations/installations.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { ContentSectionsModule } from './modules/content-sections/content-sections.module';
import { MediaModule } from './modules/media/media.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
    DatabaseModule,
    ContactMessagesModule,
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../.env' }),
    InstallationsModule,
    RoomsModule,
    ReservationsModule,
    ContentSectionsModule,
    MediaModule,
    MailModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 30,
    }]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    })
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule { }
