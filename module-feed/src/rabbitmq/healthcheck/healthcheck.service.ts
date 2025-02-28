import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { UserEventsService } from '@/rabbitmq/userevent.service';

@Injectable()
export class RabbitMQHealthIndicator extends HealthIndicator {
  constructor(private readonly userEventsService: UserEventsService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.userEventsService.checkConnection();
      
      return this.getStatus(key, true, {
        status: 'up',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      const result = this.getStatus(key, false, {
        status: 'down',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw new HealthCheckError('RabbitMQ check failed', result);
    }
  }
}