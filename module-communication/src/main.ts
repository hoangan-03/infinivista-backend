import {NestFactory} from '@nestjs/core';
import {MicroserviceOptions, Transport} from '@nestjs/microservices';

import {AppModule} from '@/app.module';

import {createDatabase} from './utils/create-database';
async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.RMQ,
        options: {
            urls: [`amqp://${process.env.RABBITMQ_HOST_NAME}:${process.env.RABBITMQ_PORT}`],
            queue: process.env.FEED_QUEUE_NAME,
            queueOptions: {
                durable: false,
            },
        },
    });

    await createDatabase();
    await app.listen();
}
bootstrap();
