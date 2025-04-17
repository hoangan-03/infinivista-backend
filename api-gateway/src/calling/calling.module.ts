import {Module} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {ClientsModule, Transport} from '@nestjs/microservices';

import {CallingController} from './calling.controller';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                imports: [ConfigModule],
                name: 'COMMUNICATION_SERVICE',
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [
                            `amqp://${configService.getOrThrow<string>('RABBITMQ_HOST_NAME')}:${configService.getOrThrow<string>(
                                'RABBITMQ_PORT'
                            )}`,
                        ],
                        queue: configService.getOrThrow<string>('COMMUNICATION_QUEUE_NAME'),
                        queueOptions: {
                            durable: false,
                        },
                    },
                }),
                inject: [ConfigService],
            },
            // Add USER_SERVICE registration for JwtBlacklistGuard
            {
                imports: [ConfigModule],
                name: 'USER_SERVICE',
                useFactory: async (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [
                            `amqp://${configService.getOrThrow<string>('RABBITMQ_HOST_NAME')}:${configService.getOrThrow<string>(
                                'RABBITMQ_PORT'
                            )}`,
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
    controllers: [CallingController],
})
export class CallingModule {}
