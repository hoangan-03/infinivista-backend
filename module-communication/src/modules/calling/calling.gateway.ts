import {Logger} from '@nestjs/common';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import {Server, Socket} from 'socket.io';

import {CallingService} from './calling.service';
import {CallSignalDto} from './dto/call-signal.dto';

interface SocketUser {
    userId: string;
    socketId: string;
}

@WebSocketGateway({namespace: 'calling', cors: true})
export class CallingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(CallingGateway.name);
    private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

    constructor(private readonly callingService: CallingService) {}

    afterInit(server: Server) {
        this.logger.log('Calling WebSocket Gateway Initialized');
    }

    handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId) {
            this.connectedUsers.set(userId, client.id);
            this.logger.log(`User connected: ${userId} with socket: ${client.id}`);
        } else {
            this.logger.warn(`Socket connection without userId: ${client.id}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        // Find user by socket id and remove from connected users
        let disconnectedUserId: string | null = null;
        for (const [userId, socketId] of this.connectedUsers.entries()) {
            if (socketId === client.id) {
                disconnectedUserId = userId;
                break;
            }
        }

        if (disconnectedUserId) {
            this.connectedUsers.delete(disconnectedUserId);
            this.logger.log(`User disconnected: ${disconnectedUserId}`);
        }
    }

    @SubscribeMessage('call-offer')
    handleCallOffer(client: Socket, payload: CallSignalDto): void {
        this.logger.log(`Call offer from ${payload.from} to ${payload.to}`);
        const targetSocketId = this.connectedUsers.get(payload.to);

        if (targetSocketId) {
            // Forward the offer to the target user
            this.server.to(targetSocketId).emit('call-offer', payload);
        } else {
            // Target user not connected, inform caller
            client.emit('call-unavailable', {to: payload.to});
        }
    }

    @SubscribeMessage('call-answer')
    handleCallAnswer(client: Socket, payload: CallSignalDto): void {
        this.logger.log(`Call answer from ${payload.from} to ${payload.to}`);
        const targetSocketId = this.connectedUsers.get(payload.to);

        if (targetSocketId) {
            // Forward the answer to the target user
            this.server.to(targetSocketId).emit('call-answer', payload);
        }
    }

    @SubscribeMessage('call-ice-candidate')
    handleIceCandidate(client: Socket, payload: CallSignalDto): void {
        const targetSocketId = this.connectedUsers.get(payload.to);

        if (targetSocketId) {
            // Forward ICE candidate to the target user
            this.server.to(targetSocketId).emit('call-ice-candidate', payload);
        }
    }

    @SubscribeMessage('call-hang-up')
    handleHangUp(client: Socket, payload: CallSignalDto): void {
        this.logger.log(`Call hang up from ${payload.from} to ${payload.to}`);
        const targetSocketId = this.connectedUsers.get(payload.to);

        if (targetSocketId) {
            // Forward hang up to the target user
            this.server.to(targetSocketId).emit('call-hang-up', payload);
        }
    }
}
