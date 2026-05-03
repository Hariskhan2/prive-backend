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
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatGateway = class ChatGateway {
    prisma;
    server;
    activeSockets = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
        try {
            const setting = await this.prisma.appSetting.findUnique({
                where: { key: 'FEATURE_VIDEO_ENABLED' },
            });
            client.emit('config', { FEATURE_VIDEO_ENABLED: setting ? setting.value : true });
        }
        catch (e) {
            client.emit('config', { FEATURE_VIDEO_ENABLED: true });
        }
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        const userId = this.activeSockets.get(client.id);
        if (userId) {
            this.server.emit('user-offline', userId);
        }
        this.activeSockets.delete(client.id);
        this.server.emit('peer-disconnected', client.id);
    }
    async handleJoin(payload, client) {
        this.activeSockets.set(client.id, payload.userId);
        client.broadcast.emit('user-joined', { userId: payload.userId, socketId: client.id });
        client.broadcast.emit('user-online', payload.userId);
        const onlineUsers = Array.from(new Set(this.activeSockets.values()));
        client.emit('online-users', onlineUsers);
        try {
            const messages = await this.prisma.message.findMany({
                orderBy: { createdAt: 'asc' },
            });
            client.emit('load-messages', messages);
        }
        catch (e) {
            console.error('Failed to load messages (db might not exist yet)', e);
        }
    }
    async handleSendMessage(payload, client) {
        try {
            for (const userId of [payload.senderId, payload.receiverId]) {
                await this.prisma.profile.upsert({
                    where: { id: userId },
                    update: {},
                    create: {
                        id: userId,
                        username: userId === 'haris_id' ? 'Haris' : userId === 'ariba_id' ? 'Ariba' : userId,
                    },
                });
            }
            const message = await this.prisma.message.create({
                data: {
                    senderId: payload.senderId,
                    receiverId: payload.receiverId,
                    content: payload.content || '',
                    mediaUrl: payload.mediaUrl,
                    mediaType: payload.mediaType,
                    mediaKey: payload.mediaKey,
                    isViewOnce: payload.isViewOnce ?? false,
                },
            });
            this.server.emit('newMessage', message);
        }
        catch (e) {
            console.error('Failed to send message:', e);
            client.emit('messageError', { error: e.message });
        }
    }
    async handleDeleteMessage(payload) {
        try {
            await this.prisma.message.update({
                where: { id: payload.id },
                data: { deleted: true }
            });
            this.server.emit('messageDeleted', payload.id);
        }
        catch (e) {
            console.error('Failed to delete message:', e);
        }
    }
    async handleEditMessage(payload) {
        try {
            const updated = await this.prisma.message.update({
                where: { id: payload.id },
                data: { content: payload.content, isEdited: true }
            });
            this.server.emit('messageEdited', updated);
        }
        catch (e) {
            console.error('Failed to edit message:', e);
        }
    }
    async handleReactMessage(payload) {
        try {
            const updated = await this.prisma.message.update({
                where: { id: payload.id },
                data: { reaction: payload.reaction }
            });
            this.server.emit('messageReacted', updated);
        }
        catch (e) {
            console.error('Failed to react to message:', e);
        }
    }
    async handleMarkViewed(payload) {
        try {
            const msg = await this.prisma.message.update({
                where: { id: payload.messageId },
                data: { viewed: true },
            });
            this.server.emit('messageViewed', { messageId: msg.id });
        }
        catch (e) {
            console.error('Failed to mark message as viewed:', e);
        }
    }
    handleOffer(payload, client) {
        client.broadcast.emit('offer', { offer: payload.offer, isVideo: payload.isVideo, senderId: client.id });
    }
    handleAnswer(payload, client) {
        client.broadcast.emit('answer', { answer: payload.answer, senderId: client.id });
    }
    handleIceCandidate(payload, client) {
        client.broadcast.emit('ice-candidate', { candidate: payload.candidate, senderId: client.id });
    }
    handleHangup(payload, client) {
        client.broadcast.emit('hangup', { senderId: client.id });
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('deleteMessage'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleDeleteMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('editMessage'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleEditMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('reactMessage'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleReactMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('markViewed'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMarkViewed", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('offer'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleOffer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('answer'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleAnswer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ice-candidate'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleIceCandidate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('hangup'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleHangup", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
    }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map