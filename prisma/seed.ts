import { PrismaClient } from '../backend/src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

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
  } catch (e) { }
}

const adapter = new PrismaPg({ connectionString: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Crear cabañas de prueba basadas en el frontend
  const roomsData = [
    { id: 1, name: 'Los Chicos', price: 120, type: 'FAMILIAR', desc: 'Con mucha tradición, el lugar predilecto.' },
    { id: 2, name: 'Las Chicas', price: 180, type: 'FAMILIAR', desc: 'Un lugar especial.' },
    { id: 3, name: 'Los Primos', price: 110, type: 'FAMILIAR', desc: 'Para familias grandes.' },
    { id: 4, name: 'Los Invitados', price: 130, type: 'FAMILIAR', desc: 'Habitación especial.' },
    { id: 5, name: 'La Abuela', price: 150, type: 'FAMILIAR', desc: 'Ambiente íntimo.' }
  ];

  for (const r of roomsData) {
    await prisma.room.upsert({
      where: { id: r.id },
      update: {
        name: r.name,
        pricePerNight: r.price,
        description: r.desc,
        type: r.type,
        isActive: true,
        status: 'active',
      },
      create: {
        id: r.id,
        name: r.name,
        description: r.desc,
        capacity: 4,
        pricePerNight: r.price,
        photoUrl: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=800&q=80',
        type: r.type,
        isActive: true,
        status: 'active',
      },
    });
  }


  console.log('Cabañas creadas');


  console.log('Starting seed...');

  // 1. Create or update the Admin Role
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'System Administrator',
    },
  });
  console.log(`Role 'admin' ensured in database (ID: ${adminRole.id})`);

  // 2/3. Create the Admin User (only on first run). A rerun of this seed
  // must NEVER touch an existing admin's password — it used to reset it back
  // to a hardcoded default on every run, which is exactly what let a stale
  // default credential sit live in production.
  const adminEmail = 'admin@villaanamaria.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  let adminUser;
  if (existingAdmin) {
    adminUser = await prisma.user.update({
      where: { email: adminEmail },
      data: { name: 'Administrador', isActive: true },
    });
  } else {
    const seedPassword = process.env.ADMIN_SEED_PASSWORD;
    if (!seedPassword) {
      throw new Error(
        "ADMIN_SEED_PASSWORD env var is required to create the initial admin user (no hardcoded default).",
      );
    }
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(seedPassword, saltRounds);
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: 'Administrador',
        isActive: true,
      },
    });
  }
  console.log(`User 'admin' ensured in database (ID: ${adminUser.id})`);

  // 4. Link the User and the Role in the UserRole junction table
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });
  console.log(`User 'admin' linked to Role 'admin'`);

  // 5. Create Permissions
  const permissionsList = [
    { code: 'contact_messages:read', description: 'Read contact messages' },
    { code: 'contact_messages:update', description: 'Update contact messages status' },
    { code: 'installations:create', description: 'Create installations' },
    { code: 'installations:update', description: 'Update installations' },
    { code: 'installations:delete', description: 'Delete installations' },
    { code: 'rooms:create', description: 'Create rooms' },
    { code: 'rooms:update', description: 'Update rooms' },
    { code: 'reservations:read', description: 'Read reservations' },
    { code: 'reservations:update', description: 'Update reservations' },
    { code: 'reservations:delete', description: 'Delete reservations' },
    { code: 'content_sections:create', description: 'Create content sections' },
    { code: 'content_sections:update', description: 'Update content sections' },
    { code: 'content_sections:delete', description: 'Delete content sections' },
    { code: 'users:create', description: 'Register new admin users' },

  ];


  for (const p of permissionsList) {
    const permission = await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: {
        code: p.code,
        description: p.description,
      },
    });

    // 6. Link Permission to Admin Role
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(`Permissions created and linked to Role 'admin'`);

  console.log('Seed finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
