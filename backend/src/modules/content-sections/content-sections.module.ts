import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { ContentSectionsController } from './content-sections.controller';
import { ContentSectionsService } from './content-sections.service';

@Module({
  imports: [DatabaseModule, AuthModule, MediaModule],
  controllers: [ContentSectionsController],
  providers: [ContentSectionsService],
})
export class ContentSectionsModule {}
