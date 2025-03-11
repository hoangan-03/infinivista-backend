import {Module} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {ClientsModule, Transport} from '@nestjs/microservices';

import {AppController} from './app.controller';
import {AppService} from './app.service';
import {UserModule} from './user/user.module';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                imports: [ConfigModule],
                name: 'USER_SERVICE',
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [
                            `amqp://${configService.get<string>('RABBITMQ_HOST_NAME')}:${configService.get<string>('RABBITMQ_PORT')}`,
                        ],
                        queue: configService.get<string>('USER_QUEUE_NAME'),
                    },
                }),
                inject: [ConfigService],
            },
            {
                imports: [ConfigModule],
                name: 'COMMUNICATION_SERVICE',
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [
                            `amqp://${configService.get<string>('RABBITMQ_HOST_NAME')}:${configService.get<string>('RABBITMQ_PORT')}`,
                        ],
                        queue: configService.get<string>('COMMUNICATION_QUEUE_NAME'),
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
                            `amqp://${configService.get<string>('RABBITMQ_HOST_NAME')}:${configService.get<string>('RABBITMQ_PORT')}`,
                        ],
                        queue: configService.get<string>('FEED_QUEUE_NAME'),
                    },
                }),
                inject: [ConfigService],
            },
        ]),
        UserModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
