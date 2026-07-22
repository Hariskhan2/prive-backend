import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
    cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private activeSockets = new Map<string, string>();

    constructor(private readonly prisma: PrismaService) { }

    async handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
        try {
            const setting = await this.prisma.appSetting.findUnique({
                where: { key: 'FEATURE_VIDEO_ENABLED' },
            });
            client.emit('config', { FEATURE_VIDEO_ENABLED: setting ? setting.value : true });
        } catch (e) {
            client.emit('config', { FEATURE_VIDEO_ENABLED: true });
        }
    }

    async handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
        const userId = this.activeSockets.get(client.id);
        if (userId) {
            const now = new Date();
            try {
                await this.prisma.profile.update({
                    where: { id: userId },
                    data: { lastSeen: now },
                });
            } catch (e) {
                console.error('Failed to update lastSeen on disconnect:', e);
            }
            this.server.emit('user-offline', { userId, lastSeen: now.toISOString() });
        }
        this.activeSockets.delete(client.id);
        this.server.emit('peer-disconnected', client.id);
    }

    @SubscribeMessage('join')
    async handleJoin(@MessageBody() payload: { userId: string }, @ConnectedSocket() client: Socket) {
        this.activeSockets.set(client.id, payload.userId);
        
        try {
            await this.prisma.profile.upsert({
                where: { id: payload.userId },
                update: { lastSeen: new Date() },
                create: {
                    id: payload.userId,
                    username: payload.userId === 'haris_id' ? 'Haris' : payload.userId === 'ariba_id' ? 'Ariba' : payload.userId,
                    lastSeen: new Date(),
                },
            });
        } catch (e) {
            console.error('Failed to update lastSeen on join:', e);
        }

        client.broadcast.emit('user-joined', { userId: payload.userId, socketId: client.id });

        // Broadcast new online user
        client.broadcast.emit('user-online', payload.userId);

        // Fetch currently online users and tell the connector
        const onlineUsers = Array.from(new Set(this.activeSockets.values()));
        client.emit('online-users', onlineUsers);

        // Auto-fetch messages on join
        try {
            const messages = await this.prisma.message.findMany({
                orderBy: { createdAt: 'asc' },
                include: {
                    replyTo: true
                }
            });
            client.emit('load-messages', messages);
        } catch (e) {
            console.error('Failed to load messages (db might not exist yet)', e);
        }
    }

    // --- Real-Time Chat ---
    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @MessageBody() payload: { senderId: string; receiverId: string; content?: string; mediaUrl?: string; mediaType?: string; mediaKey?: string; isViewOnce?: boolean; replyToId?: string },
        @ConnectedSocket() client: Socket,
    ) {
        try {
            // Ensure profiles exist (idempotent)
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
                    replyToId: payload.replyToId || null,
                } as Prisma.MessageUncheckedCreateInput,
                include: {
                    replyTo: true
                }
            });
            this.server.emit('newMessage', message);
        } catch (e) {
            console.error('Failed to send message:', e);
            client.emit('messageError', { error: (e as Error).message });
        }
    }

    @SubscribeMessage('deleteMessage')
    async handleDeleteMessage(@MessageBody() payload: { id: string }) {
        try {
            await this.prisma.message.update({
                where: { id: payload.id },
                data: { deleted: true }
            });
            this.server.emit('messageDeleted', payload.id);
        } catch (e) {
            console.error('Failed to delete message:', e);
        }
    }

    @SubscribeMessage('editMessage')
    async handleEditMessage(@MessageBody() payload: { id: string, content: string }) {
        try {
            const updated = await this.prisma.message.update({
                where: { id: payload.id },
                data: { content: payload.content, isEdited: true }
            });
            this.server.emit('messageEdited', updated);
        } catch (e) {
            console.error('Failed to edit message:', e);
        }
    }

    @SubscribeMessage('reactMessage')
    async handleReactMessage(@MessageBody() payload: { id: string, reaction: string | null }) {
        try {
            const updated = await this.prisma.message.update({
                where: { id: payload.id },
                data: { reaction: payload.reaction }
            });
            this.server.emit('messageReacted', updated);
        } catch (e) {
            console.error('Failed to react to message:', e);
        }
    }

    @SubscribeMessage('markViewed')
    async handleMarkViewed(@MessageBody() payload: { messageId: string }) {
        try {
            const msg = await this.prisma.message.update({
                where: { id: payload.messageId },
                data: { viewed: true },
            });
            this.server.emit('messageViewed', { messageId: msg.id });
        } catch (e) {
            console.error('Failed to mark message as viewed:', e);
        }
    }

    @SubscribeMessage('typing')
    handleTyping(
        @MessageBody() payload: { senderId: string; receiverId: string; isTyping: boolean },
        @ConnectedSocket() client: Socket,
    ) {
        client.broadcast.emit('typing', payload);
    }

    // --- WebRTC Signaling ---
    @SubscribeMessage('offer')
    handleOffer(@MessageBody() payload: { offer: any; isVideo?: boolean }, @ConnectedSocket() client: Socket) {
        client.broadcast.emit('offer', { offer: payload.offer, isVideo: payload.isVideo, senderId: client.id });
    }

    @SubscribeMessage('answer')
    handleAnswer(@MessageBody() payload: { answer: any }, @ConnectedSocket() client: Socket) {
        client.broadcast.emit('answer', { answer: payload.answer, senderId: client.id });
    }

    @SubscribeMessage('ice-candidate')
    handleIceCandidate(@MessageBody() payload: { candidate: any }, @ConnectedSocket() client: Socket) {
        client.broadcast.emit('ice-candidate', { candidate: payload.candidate, senderId: client.id });
    }

    @SubscribeMessage('hangup')
    handleHangup(@MessageBody() payload: any, @ConnectedSocket() client: Socket) {
        client.broadcast.emit('hangup', { senderId: client.id });
    }
}
