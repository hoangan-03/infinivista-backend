import {RabbitMQModule} from '@golevelup/nestjs-rabbitmq';
import {Module} from '@nestjs/common';
import {forwardRef} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';

import {getRabbitMQConfig} from '@/config/rabbitmq.config';
import {HealthModule} from '@/rabbitmq/healthcheck/healthcheck.module';

import {UserEventsService} from './userevent.service';
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
