import { PrismaClient } from '../backend/src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config";

let dbUrl = process.env.DATABASE_URL || '';
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
    }
}

import pg from 'pg';
const pool = new pg.Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({ 
    where: { email: 'admin@villaana.com' }, 
    include: { 
      userRoles: { 
        include: { 
          role: { 
            include: { 
              rolePermissions: { 
                include: { permission: true } 
              } 
            } 
          } 
        } 
      } 
    } 
  }); 
  console.log(JSON.stringify(user, null, 2));
}

main().finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
