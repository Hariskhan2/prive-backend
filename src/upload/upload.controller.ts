import { Controller, Get, Query, Post, Patch, Body, Param } from '@nestjs/common';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Get('presign')
    async getPresignedUrl(
        @Query('fileName') fileName: string,
        @Query('contentType') contentType: string,
        @Query('viewOnce') viewOnce?: string,
    ) {
        return this.uploadService.getPresignedUrl(fileName, contentType, viewOnce === 'true');
    }

    @Post('profile')
    async updateProfileAvatar(
        @Body() body: { userId: string; avatarUrl: string },
    ) {
        return this.uploadService.updateAvatar(body.userId, body.avatarUrl);
    }

    @Get('preferences/:userId')
    async getPreferences(@Param('userId') userId: string) {
        return this.uploadService.getPreferences(userId);
    }

    @Patch('preferences/:userId')
    async updatePreferences(
        @Param('userId') userId: string,
        @Body() body: { allowVideoCalls?: boolean; allowVoiceCalls?: boolean; allowAttachments?: boolean },
    ) {
        return this.uploadService.updatePreferences(userId, body);
    }

    @Post('view-once/:messageId')
    async markViewed(@Param('messageId') messageId: string) {
        return this.uploadService.markViewedAndDelete(messageId);
    }

    @Get('user/:userId')
    async getUserInfo(@Param('userId') userId: string) {
        return this.uploadService.getUserInfo(userId);
    }

    @Post('login')
    async login(@Body() body: { userId: string; password?: string }) {
        return this.uploadService.login(body.userId, body.password);
    }

    @Post('change-password')
    async changePassword(@Body() body: { userId: string; oldPassword?: string; newPassword?: string }) {
        return this.uploadService.changePassword(body.userId, body.oldPassword, body.newPassword);
    }

    @Get('verify')
    async verify(@Query('token') token: string) {
        return this.uploadService.verifyToken(token);
    }
}
