"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const upload_service_1 = require("./upload.service");
let UploadController = class UploadController {
    uploadService;
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
    async getPresignedUrl(fileName, contentType, viewOnce) {
        return this.uploadService.getPresignedUrl(fileName, contentType, viewOnce === 'true');
    }
    async updateProfileAvatar(body) {
        return this.uploadService.updateAvatar(body.userId, body.avatarUrl);
    }
    async getPreferences(userId) {
        return this.uploadService.getPreferences(userId);
    }
    async updatePreferences(userId, body) {
        return this.uploadService.updatePreferences(userId, body);
    }
    async markViewed(messageId) {
        return this.uploadService.markViewedAndDelete(messageId);
    }
    async getUserInfo(userId) {
        return this.uploadService.getUserInfo(userId);
    }
    async login(body) {
        return this.uploadService.login(body.userId, body.password);
    }
    async changePassword(body) {
        return this.uploadService.changePassword(body.userId, body.oldPassword, body.newPassword);
    }
    async updateUsername(userId, body) {
        if (!body.username || body.username.trim().length < 1) {
            throw new common_1.BadRequestException('Name cannot be empty');
        }
        return this.uploadService.updateUsername(userId, body.username.trim());
    }
    async verify(token) {
        return this.uploadService.verifyToken(token);
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Get)('presign'),
    __param(0, (0, common_1.Query)('fileName')),
    __param(1, (0, common_1.Query)('contentType')),
    __param(2, (0, common_1.Query)('viewOnce')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "getPresignedUrl", null);
__decorate([
    (0, common_1.Post)('profile'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "updateProfileAvatar", null);
__decorate([
    (0, common_1.Get)('preferences/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "getPreferences", null);
__decorate([
    (0, common_1.Patch)('preferences/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "updatePreferences", null);
__decorate([
    (0, common_1.Post)('view-once/:messageId'),
    __param(0, (0, common_1.Param)('messageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "markViewed", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "getUserInfo", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('change-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Patch)('username/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "updateUsername", null);
__decorate([
    (0, common_1.Get)('verify'),
    __param(0, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "verify", null);
exports.UploadController = UploadController = __decorate([
    (0, common_1.Controller)('upload'),
    __metadata("design:paramtypes", [upload_service_1.UploadService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map