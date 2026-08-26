import { PrismaClient } from './backend/src/generated/prisma/client';

async function main() {
    const prisma = new PrismaClient(); // uses root .env automatically
    try {
        const messages = await prisma.contactMessage.findMany();
        console.log(JSON.stringify(messages, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
