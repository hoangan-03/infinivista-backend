import {Logger} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {MicroserviceOptions, Transport} from '@nestjs/microservices';

import {AppModule} from '@/app.module';

import {createDatabase} from './utils/create-database';

async function bootstrap() {
    const logger = new Logger('Module-User');

    console.log('Waiting for database to be ready...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Create the microservice app instance
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.RMQ,
        options: {
            urls: [`amqp://${process.env.RABBITMQ_HOST_NAME}:${process.env.RABBITMQ_PORT}`],
            queue: process.env.USER_QUEUE_NAME,
            queueOptions: {
                durable: false,
            },
        },
    });

    await createDatabase();

    await app.listen();
    logger.log(`Module-User microservice is listening to ${process.env.USER_QUEUE_NAME}`);
}

bootstrap();
