import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('login')
  async login(@Body() loginDto: { email: string, password: string }) {
    const { email, password } = loginDto;
    return this.usersService.getAuthenticatedUser(email, password);
  }
}