"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto = __importStar(require("crypto"));
const jwt = __importStar(require("jsonwebtoken"));
const prisma_service_1 = require("../prisma/prisma.service");
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-prive-key-123';
let UploadService = class UploadService {
    prisma;
    s3Client;
    supabaseStorageUrl;
    bucket;
    constructor(prisma) {
        this.prisma = prisma;
        const s3Endpoint = process.env.S3_ENDPOINT || '';
        this.bucket = process.env.S3_BUCKET_NAME || 'media';
        const match = s3Endpoint.match(/https:\/\/([^.]+)\.storage\.supabase\.co/);
        const projectRef = match ? match[1] : '';
        this.supabaseStorageUrl = projectRef
            ? `https://${projectRef}.supabase.co/storage/v1`
            : s3Endpoint.replace('/s3', '');
        this.s3Client = new client_s3_1.S3Client({
            region: process.env.S3_REGION || 'ap-south-1',
            endpoint: s3Endpoint,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY || '',
                secretAccessKey: process.env.S3_SECRET_KEY || '',
            },
            forcePathStyle: true,
        });
    }
    async getPresignedUrl(fileName, contentType, isViewOnce = false) {
        const uniqueKey = `${crypto.randomUUID()}-${fileName.replace(/\s+/g, '-')}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: uniqueKey,
            ContentType: contentType,
        });
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn: 3600 });
        const publicUrl = `${this.supabaseStorageUrl}/object/public/${this.bucket}/${uniqueKey}`;
        return { uploadUrl, publicUrl, mediaKey: uniqueKey };
    }
    async deleteFromS3(key) {
        try {
            await this.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
        }
        catch (e) {
            console.error('S3 delete failed:', e);
        }
    }
    async markViewedAndDelete(messageId) {
        const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
        if (!msg || msg.viewed)
            return { ok: true };
        if (msg.mediaKey) {
            await this.deleteFromS3(msg.mediaKey);
        }
        return this.prisma.message.update({
            where: { id: messageId },
            data: { viewed: true, mediaUrl: null },
        });
    }
    async ensureProfile(userId) {
        return this.prisma.profile.upsert({
            where: { id: userId },
            update: {},
            create: { id: userId, username: userId === 'haris_id' ? 'Haris' : 'Ariba' },
        });
    }
    async updateAvatar(userId, avatarUrl) {
        await this.ensureProfile(userId);
        return this.prisma.profile.update({
            where: { id: userId },
            data: { avatarUrl },
        });
    }
    async getPreferences(userId) {
        await this.ensureProfile(userId);
        return this.prisma.userPreference.upsert({
            where: { userId },
            update: {},
            create: { userId },
        });
    }
    async updatePreferences(userId, prefs) {
        await this.ensureProfile(userId);
        return this.prisma.userPreference.upsert({
            where: { userId },
            update: prefs,
            create: { userId, ...prefs },
        });
    }
    async getUserInfo(userId) {
        await this.ensureProfile(userId);
        return this.prisma.profile.findUnique({
            where: { id: userId },
            include: { preference: true },
        });
    }
    async login(userId, passwordReq) {
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
    async changePassword(userId, oldPassword, newPassword) {
        const profile = await this.prisma.profile.findUnique({ where: { id: userId } });
        if (!profile || profile.password !== oldPassword) {
            throw new Error('Invalid old password');
        }
        if (!newPassword || newPassword.length < 4)
            throw new Error('Invalid new password');
        return this.prisma.profile.update({
            where: { id: userId },
            data: { password: newPassword }
        });
    }
    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded && decoded.userId)
                return { valid: true, userId: decoded.userId };
        }
        catch (err) {
        }
        return { valid: false };
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UploadService);
//# sourceMappingURL=upload.service.js.map