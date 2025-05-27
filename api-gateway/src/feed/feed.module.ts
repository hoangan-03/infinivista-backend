import {Module} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {ClientsModule, Transport} from '@nestjs/microservices';

import {FileUploadModule} from '@/services/file-upload.module';

import {GroupController} from './group.controller';
import {NewsFeedController} from './newsfeed.controller';
import {PageController} from './page.controller';
import {PostController} from './post.controller';
import {RagController} from './rag.controller';
import {StoryController} from './story.controller';

@Module({
    imports: [
        FileUploadModule,
        ClientsModule.registerAsync([
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
    ],
    controllers: [StoryController, NewsFeedController, PostController, PageController, GroupController, RagController],
})
export class FeedModule {}
