import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ERRORS_DICTIONARY } from '@/constraints/error-dictionary.constraint';
import { UsersRepository } from '@/modules/users/users.repository';
import { User } from '@/modules/users/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getAuthenticatedUser(email: string, password: string): Promise<User> {
    const user = await this.usersRepository.findOneByEmail(email);
    if (!user) {
      throw new BadRequestException({
        message: ERRORS_DICTIONARY.WRONG_CREDENTIALS,
        details: 'Not exist user !!',
      });
    }
    if (password !== user.password) {
      throw new BadRequestException({
        message: ERRORS_DICTIONARY.WRONG_CREDENTIALS,
        details: 'Wrong password!!',
      });
    }

    return user;
  }
}