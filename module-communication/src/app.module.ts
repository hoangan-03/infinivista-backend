import {Module} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {APP_FILTER} from '@nestjs/core';
import {TypeOrmModule} from '@nestjs/typeorm';

import {AppController} from '@/app.controller';
import {AppService} from '@/app.service';
import {AllExceptionsFilter} from '@/exception-filters/all-exception.filter';

import {CallingModule} from './modules/calling/calling.module';
import {MessagingModule} from './modules/messaging/messaging.module';
import {UserReferenceModule} from './modules/user-reference/user-reference.module';

@Module({
    imports: [
        ConfigModule.forRoot({isGlobal: true}),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.getOrThrow<string>('POSTGRES_HOST'),
                port: configService.getOrThrow<number>('POSTGRES_PORT'),
                username: configService.getOrThrow<string>('POSTGRES_USER'),
                password: configService.getOrThrow<string>('POSTGRES_PASSWORD'),
                database: configService.getOrThrow<string>('POSTGRES_DB'),
                autoLoadEntities: true,
                synchronize: true, // false in production
            }),
            inject: [ConfigService],
        }),
        MessagingModule,
        UserReferenceModule,
        CallingModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
    ],
})
export class AppModule {}
