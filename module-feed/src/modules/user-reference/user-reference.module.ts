import {Module} from '@nestjs/common';
import {ClientsModule, Transport} from '@nestjs/microservices';
import {TypeOrmModule} from '@nestjs/typeorm';

import {UserReference} from '@/entities/external/user-reference.entity';

import {UserReferenceController} from './user-reference.controller';
import {UserReferenceService} from './user-reference.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserReference]),
        ClientsModule.register([
            {
                name: 'USER_SERVICE',
                transport: Transport.RMQ,
                options: {
                    urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
                    queue: 'user_queue',
                    queueOptions: {
                        durable: false,
                    },
                },
            },
        ]),
    ],
    controllers: [UserReferenceController],
    providers: [UserReferenceService],
    exports: [UserReferenceService],
})
export class UserReferenceModule {}
