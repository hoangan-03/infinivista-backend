import {Module} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {ClientsModule, Transport} from '@nestjs/microservices';

import {AppController} from './app.controller';
import {AppService} from './app.service';
import {UserController} from './user/user.controller';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                imports: [ConfigModule],
                name: 'USER_SERVICE',
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [configService.get<string>('RABBITMQ_URL') as string],
                        queue: configService.get<string>('USER_QUEUE_NAME'),
                    },
                }),
            },
            {
                imports: [ConfigModule],
                name: 'COMMUNICATION_SERVICE',
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [configService.get<string>('RABBITMQ_URL') as string],
                        queue: configService.get<string>('COMMUNICATION_QUEUE_NAME'),
                    },
                }),
            },
            {
                imports: [ConfigModule],
                name: 'FEED_SERVICE',
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [configService.get<string>('RABBITMQ_URL') as string],
                        queue: configService.get<string>('FEED_QUEUE_NAME'),
                    },
                }),
            },
        ]),
    ],
    controllers: [AppController, UserController],
    providers: [AppService],
})
export class AppModule {}
