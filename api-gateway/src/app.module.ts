import {Module} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {APP_FILTER} from '@nestjs/core';
import {ClientsModule, Transport} from '@nestjs/microservices';
import {MulterModule} from '@nestjs/platform-express';
import {memoryStorage} from 'multer';

import {AppController} from './app.controller';
import {AppService} from './app.service';
import {AuthModule} from './auth/auth.module';
import {CallingModule} from './calling/calling.module';
import {RpcExceptionFilter} from './exception-filters/rpc-exception.filter';
import {FeedModule} from './feed/feed.module';
import {MessagingModule} from './messaging/messaging.module';
import {UserModule} from './user/user.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ClientsModule.registerAsync([
            {
                imports: [ConfigModule],
                name: 'COMMUNICATION_SERVICE',
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [
                            `amqp://${configService.getOrThrow<string>('RABBITMQ_HOST_NAME')}:${configService.getOrThrow<string>('RABBITMQ_PORT')}`,
                        ],
                        queue: configService.getOrThrow<string>('COMMUNICATION_QUEUE_NAME'),
                        queueOptions: {
                            durable: false,
                        },
                    },
                }),
                inject: [ConfigService],
            },
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
        UserModule,
        AuthModule,
        FeedModule,
        MessagingModule,
        CallingModule,
        MulterModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                storage: memoryStorage(),
                limits: {
                    fileSize: configService.getOrThrow('MAX_FILE_SIZE') || 10 * 1024 * 1024,
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_FILTER,
            useClass: RpcExceptionFilter,
        },
    ],
})
export class AppModule {}
