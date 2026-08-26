const fs = require('fs');
const { execSync } = require('child_process');

try {
    const envContent = fs.readFileSync('.env', 'utf-8');
    const match = envContent.match(/DATABASE_URL="?prisma\+postgres:\/\/[^/]+\/\?api_key=([^"]+)"?/);
    if (match) {
        const apiKey = match[1];
        const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString('utf-8'));
        let directUrl = decoded.databaseUrl;
        if (directUrl.includes('/template1')) {
            directUrl = directUrl.replace('/template1', '/postgres');
        }
        console.log('Starting Prisma Studio with direct URL...');
        execSync(`npx prisma studio`, { 
            stdio: 'inherit',
            env: { ...process.env, DATABASE_URL: directUrl } 
        });
    } else {
        console.log('No prisma+postgres:// URL found in .env');
    }
} catch (e) {
    console.error(e);
}
