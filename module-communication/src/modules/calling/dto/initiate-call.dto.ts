import {IsNotEmpty, IsUUID} from 'class-validator';

export class InitiateCallDto {
    @IsNotEmpty()
    @IsUUID()
    receiverId: string;
}
