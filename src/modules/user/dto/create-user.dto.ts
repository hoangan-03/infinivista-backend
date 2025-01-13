import { IsNotEmpty } from 'class-validator';

export class CreateUser {

    @IsNotEmpty()
    email: string;
    username: string;
    password: string;
}