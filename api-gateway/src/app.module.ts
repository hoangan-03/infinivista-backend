import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {APP_FILTER} from '@nestjs/core';

import {AppController} from './app.controller';
import {AppService} from './app.service';
import {AuthModule} from './auth/auth.module';
import {RpcExceptionFilter} from './exception-filters/rpc-exception.filter';
import {FeedModule} from './feed/feed.module';
// import {MessagingModule} from './messaging/messaging.module';
import {UserModule} from './user/user.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        UserModule,
        AuthModule,
        FeedModule,
        // MessagingModule,
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
