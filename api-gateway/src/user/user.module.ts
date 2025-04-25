import {Module} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {ClientsModule, Transport} from '@nestjs/microservices';

import {FileUploadModule} from '../services/file-upload.module';
import {FriendController} from './friend.controller';
import {ProfileController} from './profile.controller';
// import {UserController} from './user.controller';

@Module({
    imports: [
        FileUploadModule,
        ClientsModule.registerAsync([
            {
                imports: [ConfigModule],
                name: 'USER_SERVICE',
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [
                            `amqp://${configService.getOrThrow<string>('RABBITMQ_HOST_NAME')}:${configService.getOrThrow<string>('RABBITMQ_PORT')}`,
                        ],
                        queue: configService.getOrThrow<string>('USER_QUEUE_NAME'),
                        queueOptions: {
                            durable: false,
                        },
                    },
                }),
                inject: [ConfigService],
            },
        ]),
    ],
    controllers: [FriendController, ProfileController],
})
export class UserModule {}
