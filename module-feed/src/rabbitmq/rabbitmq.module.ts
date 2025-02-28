import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getRabbitMQConfig } from '@/config/rabbitmq.config';
import { HealthModule } from '@/rabbitmq/healthcheck/healthcheck.module';
import { UserEventsService } from './userevent.service';
import { forwardRef } from '@nestjs/common';
@Module({
  imports: [
    ConfigModule.forRoot(),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getRabbitMQConfig,
    }),
    forwardRef(() => HealthModule),
  ],
  providers: [UserEventsService],
  exports: [RabbitMQModule, UserEventsService],
})
export class RabbitmqModule {}


