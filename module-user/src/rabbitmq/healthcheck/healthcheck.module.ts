import {Module} from '@nestjs/common';
import {forwardRef} from '@nestjs/common';
import {TerminusModule} from '@nestjs/terminus';

import {RabbitmqModule} from '@/rabbitmq/rabbitmq.module';

import {HealthController} from './healthcheck.controller';
import {RabbitMQHealthIndicator} from './healthcheck.service';

@Module({
    imports: [TerminusModule, forwardRef(() => RabbitmqModule)],
    controllers: [HealthController],
    providers: [RabbitMQHealthIndicator],
    exports: [RabbitMQHealthIndicator],
})
export class HealthModule {}
