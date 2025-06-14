// import {
//     OnGatewayConnection,
//     OnGatewayDisconnect,
//     OnGatewayInit,
//     SubscribeMessage,
//     WebSocketGateway,
//     WebSocketServer,
// } from '@nestjs/websockets';
// import {Server, Socket} from 'socket.io';

// import {Message} from '@/entities/internal/message.entity';
// import {MessagingService} from '@/modules/messaging/messaging.service';

// @WebSocketGateway({
//     cors: {
//         origin: '*',
//     },
// })
// export class MessagingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
//     constructor(private messaingService: MessagingService) {}

//     @WebSocketServer() server: Server;

//     @SubscribeMessage('sendMessage')
//     async handleSendMessage(client: Socket, payload: Message): Promise<void> {
//         await this.messaingService.createMessage(payload);
//         this.server.emit('recMessage', payload);
//     }

//     afterInit(server: Server) {
//         console.log('Init');
//         console.log(server);
//         //Do stuffs
//     }

//     handleDisconnect(client: Socket) {
//         console.log(`Disconnected: ${client.id}`);
//         //Do stuffs
//     }

//     handleConnection(client: Socket, ...args: any[]) {
//         console.log(`Connected ${client.id}`);
//         //Do stuffs
//     }
// }
