import {Module} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {ClientsModule, Transport} from '@nestjs/microservices';
import {TypeOrmModule} from '@nestjs/typeorm';

import {UserReference} from '@/entities/external/user-reference.entity';
import {CallHistory} from '@/entities/internal/call-history.entity';
import {GroupChat} from '@/entities/internal/group-chat.entity';
import {GroupChatAttachment} from '@/entities/internal/group-chat-attachment.entity';
import {GroupChatMessage} from '@/entities/internal/group-chat-message.entity';
import {Message} from '@/entities/internal/message.entity';
import {MessageAttachment} from '@/entities/internal/message-attachment.entity';
import {FileUploadService} from '@/services/file-upload.service';

import {MessagingController} from './messaging.controller';
import {MessagingService} from './messaging.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CallHistory,
            GroupChat,
            MessageAttachment,
            GroupChatAttachment,
            Message,
            GroupChatMessage,
            UserReference,
        ]),
        ClientsModule.registerAsync([
            {
                imports: [ConfigModule],
                name: 'FEED_SERVICE',
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [
                            `amqp://${configService.getOrThrow<string>('RABBITMQ_HOST_NAME')}:${configService.getOrThrow<string>('RABBITMQ_PORT')}`,
                        ],
                        queue: configService.getOrThrow<string>('FEED_QUEUE_NAME'),
                        queueOptions: {
                            durable: false,
                        },
                    },
                }),
                inject: [ConfigService],
            },
        ]),
    ],
    controllers: [MessagingController],
    providers: [MessagingService, FileUploadService],
    exports: [MessagingService],
})
export class MessagingModule {}
