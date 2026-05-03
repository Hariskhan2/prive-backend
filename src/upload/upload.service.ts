import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-prive-key-123';

@Injectable()
export class UploadService {
    private s3Client: S3Client;
    private supabaseStorageUrl: string;
    private bucket: string;

    constructor(private readonly prisma: PrismaService) {
        const s3Endpoint = process.env.S3_ENDPOINT || '';
        this.bucket = process.env.S3_BUCKET_NAME || 'media';

        // S3_ENDPOINT: https://<proj>.storage.supabase.co/storage/v1/s3
        // Public URL:  https://<proj>.supabase.co/storage/v1
        const match = s3Endpoint.match(/https:\/\/([^.]+)\.storage\.supabase\.co/);
        const projectRef = match ? match[1] : '';
        this.supabaseStorageUrl = projectRef
            ? `https://${projectRef}.supabase.co/storage/v1`
            : s3Endpoint.replace('/s3', '');

        this.s3Client = new S3Client({
            region: process.env.S3_REGION || 'ap-south-1',
            endpoint: s3Endpoint,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY || '',
                secretAccessKey: process.env.S3_SECRET_KEY || '',
            },
            forcePathStyle: true,
        });
    }

    async getPresignedUrl(fileName: string, contentType: string, isViewOnce = false) {
        const uniqueKey = `${crypto.randomUUID()}-${fileName.replace(/\s+/g, '-')}`;
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: uniqueKey,
            ContentType: contentType,
        });
        const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
        const publicUrl = `${this.supabaseStorageUrl}/object/public/${this.bucket}/${uniqueKey}`;
        return { uploadUrl, publicUrl, mediaKey: uniqueKey };
    }

    async deleteFromS3(key: string) {
        try {
            await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
        } catch (e) {
            console.error('S3 delete failed:', e);
        }
    }

    async markViewedAndDelete(messageId: string) {
        const msg = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!msg || msg.viewed) return { ok: true };

        // HARIS SECRET: If sender is Haris and alwaysKeepAttachments is on, skip bucket deletion
        const senderPrefs = await this.prisma.userPreference.findUnique({
            where: { userId: msg.senderId },
        });

        const isHaris = msg.senderId === 'haris_id';
        const keepForever = isHaris && senderPrefs?.alwaysKeepAttachments;

        // Delete from S3 if we have the key AND not Haris secret
        if (msg.mediaKey && !keepForever) {
            await this.deleteFromS3(msg.mediaKey);
        }

        return this.prisma.message.update({
            where: { id: messageId },
            data: {
                viewed: true,
                // Only nullify mediaUrl if we actually deleted it or it's not Haris secret
                mediaUrl: keepForever ? msg.mediaUrl : null
            },
        });
    }

    private async ensureProfile(userId: string) {
        return this.prisma.profile.upsert({
            where: { id: userId },
            update: {},
            create: { id: userId, username: userId === 'haris_id' ? 'Haris' : 'Ariba' },
        });
    }

    async updateAvatar(userId: string, avatarUrl: string) {
        await this.ensureProfile(userId);
        return this.prisma.profile.update({
            where: { id: userId },
            data: { avatarUrl },
        });
    }

    async getPreferences(userId: string) {
        await this.ensureProfile(userId);
        return this.prisma.userPreference.upsert({
            where: { userId },
            update: {},
            create: { userId },
        });
    }

    async updatePreferences(userId: string, prefs: {
        allowVideoCalls?: boolean;
        allowVoiceCalls?: boolean;
        allowAttachments?: boolean;
        allowNotifications?: boolean;
        alwaysKeepAttachments?: boolean;
    }) {
        await this.ensureProfile(userId);
        return this.prisma.userPreference.upsert({
            where: { userId },
            update: prefs,
            create: { userId, ...prefs },
        });
    }

    async getUserInfo(userId: string) {
        await this.ensureProfile(userId);
        return this.prisma.profile.findUnique({
            where: { id: userId },
            include: { preference: true },
        });
    }

    async login(userId: string, passwordReq?: string) {
        let profile = await this.prisma.profile.findUnique({ where: { id: userId } });
        if (!profile) {
            profile = await this.ensureProfile(userId);
        }

        if (profile.password !== passwordReq) {
            throw new Error('Invalid password');
        }

        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
        return { token, userId };
    }

    async changePassword(userId: string, oldPassword?: string, newPassword?: string) {
        const profile = await this.prisma.profile.findUnique({ where: { id: userId } });
        if (!profile || profile.password !== oldPassword) {
            throw new Error('Invalid old password');
        }
        if (!newPassword || newPassword.length < 4) throw new Error('Invalid new password');

        return this.prisma.profile.update({
            where: { id: userId },
            data: { password: newPassword }
        });
    }

    async verifyToken(token: string) {
        try {
            const decoded: any = jwt.verify(token, JWT_SECRET);
            if (decoded && decoded.userId) return { valid: true, userId: decoded.userId };
        } catch (err) {
            //
        }
        return { valid: false };
    }
}
