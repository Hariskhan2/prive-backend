const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        await prisma.$executeRawUnsafe(`
            INSERT INTO storage.buckets (id, name, public, "file_size_limit", "allowed_mime_types") 
            VALUES ('media', 'media', true, null, null)
            ON CONFLICT (id) DO UPDATE SET public = true;
        `);
        console.log('Bucket media created successfully via SQL');
    } catch (e) {
        console.error('Failed to create bucket:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
