// module-feed/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { HealthModule } from '@/rabbitmq/healthcheck/healthcheck.module';
import { RabbitmqModule } from '@/rabbitmq/rabbitmq.module';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from '@/exception-filters/global-exception.filter';
import { FeedModule } from './modules/feed/feed.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    FeedModule,
    AuthModule,
    HealthModule,
    RabbitmqModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}