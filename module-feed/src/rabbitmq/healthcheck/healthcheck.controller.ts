import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RabbitMQHealthIndicator } from './healthcheck.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private rabbitMQHealth: RabbitMQHealthIndicator,
  ) {}

  @Get('rabbitmq')
  @HealthCheck()
  @ApiOperation({ summary: 'Check RabbitMQ connection status' })
  @ApiResponse({ 
    status: 200, 
    description: 'RabbitMQ connection is healthy' 
  })
  @ApiResponse({ 
    status: 503, 
    description: 'RabbitMQ connection is not healthy' 
  })
  checkRabbitMQ() {
    return this.health.check([
      () => this.rabbitMQHealth.isHealthy('rabbitmq'),
    ]);
  }
}