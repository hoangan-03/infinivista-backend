import {Module} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {ClientsModule, Transport} from '@nestjs/microservices';
import {TypeOrmModule} from '@nestjs/typeorm';

import {UserReference} from '@/entities/external/user-reference.entity';
import {CallHistory} from '@/entities/internal/call-history.entity';
import {FileUploadService} from '@/services/file-upload.service';

import {CallingController} from './calling.controller';
import {CallingGateway} from './calling.gateway';
import {CallingService} from './calling.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([CallHistory, UserReference]),
        ClientsModule.registerAsync([
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
    providers: [CallingService, CallingGateway, FileUploadService],
    exports: [CallingService],
})
export class CallingModule {}
