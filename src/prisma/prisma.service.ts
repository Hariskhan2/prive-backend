import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        require('dotenv').config();
        const connectionString = process.env.DATABASE_URL;
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
        try {
            await this.$executeRawUnsafe(`
                INSERT INTO storage.buckets (id, name, public, "file_size_limit", "allowed_mime_types") 
                VALUES ('media', 'media', true, null, null)
                ON CONFLICT (id) DO UPDATE SET public = true;
            `);
            console.log('Automated QA Tooling: Initialized primary media bucket in Supabase PostgreSQL.');
        } catch (error: any) {
            console.warn('Could not auto-provision Supabase media bucket. If uploads fail, please create "media" manually in the dashboard.', error.message);
        }
    }
}
