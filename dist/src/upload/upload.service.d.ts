import { PrismaService } from '../prisma/prisma.service';
export declare class UploadService {
    private readonly prisma;
    private s3Client;
    private supabaseStorageUrl;
    private bucket;
    constructor(prisma: PrismaService);
    getPresignedUrl(fileName: string, contentType: string, isViewOnce?: boolean): Promise<{
        uploadUrl: string;
        publicUrl: string;
        mediaKey: string;
    }>;
    deleteFromS3(key: string): Promise<void>;
    markViewedAndDelete(messageId: string): Promise<{
        id: string;
        senderId: string;
        receiverId: string;
        content: string | null;
        mediaUrl: string | null;
        mediaType: string | null;
        mediaKey: string | null;
        isViewOnce: boolean;
        viewed: boolean;
        isEdited: boolean;
        deleted: boolean;
        reaction: string | null;
        createdAt: Date;
    } | {
        ok: boolean;
    }>;
    private ensureProfile;
    updateUsername(userId: string, username: string): Promise<{
        id: string;
        createdAt: Date;
        username: string;
        avatarUrl: string | null;
        password: string;
    }>;
    updateAvatar(userId: string, avatarUrl: string): Promise<{
        id: string;
        createdAt: Date;
        username: string;
        avatarUrl: string | null;
        password: string;
    }>;
    getPreferences(userId: string): Promise<{
        userId: string;
        allowVideoCalls: boolean;
        allowVoiceCalls: boolean;
        allowAttachments: boolean;
        allowNotifications: boolean;
        alwaysKeepAttachments: boolean;
    }>;
    updatePreferences(userId: string, prefs: {
        allowVideoCalls?: boolean;
        allowVoiceCalls?: boolean;
        allowAttachments?: boolean;
        allowNotifications?: boolean;
        alwaysKeepAttachments?: boolean;
    }): Promise<{
        userId: string;
        allowVideoCalls: boolean;
        allowVoiceCalls: boolean;
        allowAttachments: boolean;
        allowNotifications: boolean;
        alwaysKeepAttachments: boolean;
    }>;
    getUserInfo(userId: string): Promise<({
        preference: {
            userId: string;
            allowVideoCalls: boolean;
            allowVoiceCalls: boolean;
            allowAttachments: boolean;
            allowNotifications: boolean;
            alwaysKeepAttachments: boolean;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        username: string;
        avatarUrl: string | null;
        password: string;
    }) | null>;
    login(userId: string, passwordReq?: string): Promise<{
        token: string;
        userId: string;
    }>;
    changePassword(userId: string, oldPassword?: string, newPassword?: string): Promise<{
        id: string;
        createdAt: Date;
        username: string;
        avatarUrl: string | null;
        password: string;
    }>;
    verifyToken(token: string): Promise<{
        valid: boolean;
        userId: any;
    } | {
        valid: boolean;
        userId?: undefined;
    }>;
}
