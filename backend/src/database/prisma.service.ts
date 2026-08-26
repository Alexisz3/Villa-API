import {
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    constructor(configService: ConfigService) {
        let dbUrl = configService.getOrThrow<string>('DATABASE_URL');
        if (dbUrl.startsWith('prisma+postgres://')) {
            try {
                const urlObj = new URL(dbUrl);
                const apiKeyBase64 = urlObj.searchParams.get('api_key');
                if (apiKeyBase64) {
                    const decoded = JSON.parse(Buffer.from(apiKeyBase64, 'base64').toString('utf-8'));
                    if (decoded.databaseUrl) {
                        dbUrl = decoded.databaseUrl;
                    }
                }
            } catch (e) {
                // Ignore decoding errors
            }
        }
        const adapter = new PrismaPg({
            connectionString: dbUrl,
        });
        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}