import { RabbitMQConfig } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';

export const getRabbitMQConfig = (configService: ConfigService): RabbitMQConfig => ({
  exchanges: [
    {
      name: 'user.events',
      type: 'topic',
      options: {
        durable: true
      }
    }
  ],
  uri: configService.getOrThrow<string>('RABBITMQ_URL') || 'amqp://localhost:5672',
  connectionInitOptions: { 
    wait: true,
    timeout: 30000,
    reject: true,
  },
  enableControllerDiscovery: true,
  prefetchCount: 1,
  channels: {
    'user-channel': {
      prefetchCount: 15,
      default: true
    }
  },
  defaultRpcTimeout: 15000,
  defaultExchangeType: 'topic',

});