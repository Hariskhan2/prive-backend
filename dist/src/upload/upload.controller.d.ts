import { UploadService } from './upload.service';
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    getPresignedUrl(fileName: string, contentType: string, viewOnce?: string): Promise<{
        uploadUrl: string;
        publicUrl: string;
        mediaKey: string;
    }>;
    updateProfileAvatar(body: {
        userId: string;
        avatarUrl: string;
    }): Promise<{
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
    updatePreferences(userId: string, body: {
        allowVideoCalls?: boolean;
        allowVoiceCalls?: boolean;
        allowAttachments?: boolean;
    }): Promise<{
        userId: string;
        allowVideoCalls: boolean;
        allowVoiceCalls: boolean;
        allowAttachments: boolean;
        allowNotifications: boolean;
        alwaysKeepAttachments: boolean;
    }>;
    markViewed(messageId: string): Promise<{
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
    login(body: {
        userId: string;
        password?: string;
    }): Promise<{
        token: string;
        userId: string;
    }>;
    changePassword(body: {
        userId: string;
        oldPassword?: string;
        newPassword?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        username: string;
        avatarUrl: string | null;
        password: string;
    }>;
    verify(token: string): Promise<{
        valid: boolean;
        userId: any;
    } | {
        valid: boolean;
        userId?: undefined;
    }>;
}
