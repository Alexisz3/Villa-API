import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { ContentSectionsController } from './content-sections.controller';
import { ContentSectionsService } from './content-sections.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ContentSectionsController],
  providers: [ContentSectionsService],
})
export class ContentSectionsModule {}
