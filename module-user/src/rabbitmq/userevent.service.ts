import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';
import { UserCreatedEvent, UserUpdatedEvent, UserDeletedEvent } from '@/interfaces/user-events.interface';

@Injectable()
export class UserEventsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UserEventsService.name);
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly configService: ConfigService,
  ) {
  }
  async onApplicationBootstrap() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(retryCount = 0): Promise<void> {
    try {
      await this.checkConnection();
      this.logger.log('Successfully connected to cloud RabbitMQ');
    } catch (error) {
      if (retryCount < this.maxRetries) {
        this.logger.warn(`Failed to connect, retrying in ${this.retryDelay}ms... (Attempt ${retryCount + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        await this.connectWithRetry(retryCount + 1);
      } else {
        this.logger.error('Failed to connect to RabbitMQ after multiple attempts:', error);
        throw error;
      }
    }
  }

   async checkConnection(): Promise<void> {
    const channel = this.amqpConnection.channel;
    if (!channel) {
      throw new Error('RabbitMQ channel not available');
    }
    
    await channel.checkExchange('user.events');
  }

  private async publishWithRetry(
    exchange: string,
    routingKey: string,
    message: any,
    retryCount = 0
  ): Promise<void> {
    try {
      await this.amqpConnection.publish(exchange, routingKey, {
        ...message,
        timestamp: new Date().toISOString(),
      });
      this.logger.debug(`Published message to ${exchange}:${routingKey}`);
    } catch (error) {
      if (retryCount < this.maxRetries) {
        this.logger.warn(`Failed to publish message, retrying in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        await this.publishWithRetry(exchange, routingKey, message, retryCount + 1);
      } else {
        this.logger.error(`Failed to publish message after ${this.maxRetries} attempts:`, error);
        throw error;
      }
    }
  }

  async publishUserCreated(event: UserCreatedEvent): Promise<void> {
    this.logger.log(`Publishing user.created event for user ${event.id}`);
    await this.publishWithRetry('user.events', 'user.created', event);
  }

  async publishUserUpdated(event: UserUpdatedEvent): Promise<void> {
    this.logger.log(`Publishing user.updated event for user ${event.id}`);
    await this.publishWithRetry('user.events', 'user.updated', event);
  }

  async publishUserDeleted(event: UserDeletedEvent): Promise<void> {
    this.logger.log(`Publishing user.deleted event for user ${event.id}`);
    await this.publishWithRetry('user.events', 'user.deleted', event);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.checkConnection();
      return true;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }
}