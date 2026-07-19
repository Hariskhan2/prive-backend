import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly prisma;
    server: Server;
    private activeSockets;
    constructor(prisma: PrismaService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoin(payload: {
        userId: string;
    }, client: Socket): Promise<void>;
    handleSendMessage(payload: {
        senderId: string;
        receiverId: string;
        content?: string;
        mediaUrl?: string;
        mediaType?: string;
        mediaKey?: string;
        isViewOnce?: boolean;
    }, client: Socket): Promise<void>;
    handleDeleteMessage(payload: {
        id: string;
    }): Promise<void>;
    handleEditMessage(payload: {
        id: string;
        content: string;
    }): Promise<void>;
    handleReactMessage(payload: {
        id: string;
        reaction: string | null;
    }): Promise<void>;
    handleMarkViewed(payload: {
        messageId: string;
    }): Promise<void>;
    handleTyping(payload: {
        senderId: string;
        receiverId: string;
        isTyping: boolean;
    }, client: Socket): void;
    handleOffer(payload: {
        offer: any;
        isVideo?: boolean;
    }, client: Socket): void;
    handleAnswer(payload: {
        answer: any;
    }, client: Socket): void;
    handleIceCandidate(payload: {
        candidate: any;
    }, client: Socket): void;
    handleHangup(payload: any, client: Socket): void;
}
