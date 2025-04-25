import {Module} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {ClientsModule, Transport} from '@nestjs/microservices';
import {TypeOrmModule} from '@nestjs/typeorm';

import {NewsFeedReference} from '@/entities/external/newsfeed-ref.entity';
import {Friend} from '@/entities/local/friend.entity';
import {FriendRequest} from '@/entities/local/friend-request.entity';
import {SecurityAnswer} from '@/entities/local/security-answer.entity';
import {SecurityQuestion} from '@/entities/local/security-question.entity';
import {Setting} from '@/entities/local/setting.entity';
import {SocialLink} from '@/entities/local/social-link.entity';
import {User} from '@/entities/local/user.entity';
import {UserStatus} from '@/entities/local/user-status.entity';
import {UserController} from '@/modules/user/controllers/user.controller';
import {UserService} from '@/modules/user/services/user.service';
import {FileUploadService} from '@/services/file-upload.service';

import {FriendController} from './controllers/friend.controller';
import {FriendService} from './services/friend.service';
import {UserEventsService} from './services/user-events.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Setting,
            UserStatus,
            SecurityAnswer,
            SecurityQuestion,
            FriendRequest,
            Friend,
            SocialLink,

            NewsFeedReference,
        ]),
        ClientsModule.registerAsync([
            {
                name: 'COMMUNICATION_SERVICE',
                imports: [ConfigModule],
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [
                            `amqp://${configService.get('RABBITMQ_HOST_NAME')}:${configService.get('RABBITMQ_PORT')}`,
                        ],
                        queue: configService.get('COMMUNICATION_QUEUE_NAME'),
                        queueOptions: {
                            durable: false,
                        },
                    },
                }),
                inject: [ConfigService],
            },
            {
                name: 'FEED_SERVICE',
                imports: [ConfigModule],
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [
                            `amqp://${configService.get('RABBITMQ_HOST_NAME')}:${configService.get('RABBITMQ_PORT')}`,
                        ],
                        queue: configService.get('FEED_QUEUE_NAME'),
                        queueOptions: {
                            durable: false,
                        },
                    },
                }),
                inject: [ConfigService],
            },
        ]),
    ],
    controllers: [UserController, FriendController],
    providers: [UserService, FriendService, UserEventsService, FileUploadService],
    exports: [UserService, FriendService, UserEventsService, FileUploadService],
})
export class UserModule {}
