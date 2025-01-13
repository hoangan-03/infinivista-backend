import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { UsersRepository } from '../user.repository';
import { User } from '../entities/user.entity';
import { Repository, Equal } from "typeorm";
@ValidatorConstraint({ name: 'isUserAlreadyExist', async: true })
@Injectable()
export class IsUserAlreadyExist implements ValidatorConstraintInterface {
  private readonly logger = new Logger(IsUserAlreadyExist.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: UsersRepository, 
  ) {
    this.logger.log('IsUserAlreadyExist validator initialized');
  }

  async validate(email: string): Promise<boolean> {
    try {
      this.logger.debug(`Validating email: ${email}`);
      
      const user = await this.userRepository.findOneByEmail(email);

      this.logger.debug(`User found: ${!!user}`);
      
      return user === null || user === undefined;
    } catch (error) {
      this.logger.error(`Error validating email: ${(error as any).message}`, (error as any).stack);
      return false;
    }
  }

  defaultMessage(): string {
    return 'The email «$value» is already registered.';
  }
}
