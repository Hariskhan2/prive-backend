require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.profile.upsert({
        where: { id: 'haris_id' },
        update: {},
        create: { id: 'haris_id', username: 'Haris' }
    });
    await prisma.profile.upsert({
        where: { id: 'ariba_id' },
        update: {},
        create: { id: 'ariba_id', username: 'Ariba' }
    });
    console.log('Seeding finished.');
    process.exit(0);
}
main();
