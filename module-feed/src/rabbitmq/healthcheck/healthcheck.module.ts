import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { RabbitMQHealthIndicator } from './healthcheck.service';
import { HealthController } from './healthcheck.controller';
import { RabbitmqModule } from '@/rabbitmq/rabbitmq.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    TerminusModule,
    forwardRef(() => RabbitmqModule),
  ],
  controllers: [HealthController],
  providers: [RabbitMQHealthIndicator],
  exports: [RabbitMQHealthIndicator],
})
export class HealthModule {}