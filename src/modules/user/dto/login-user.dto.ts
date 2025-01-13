import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUser {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}