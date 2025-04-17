import {ApiProperty} from '@nestjs/swagger';
import {IsEnum, IsNotEmpty, IsUUID} from 'class-validator';

export enum CallType {
    AUDIO = 'audio',
    VIDEO = 'video',
}

export class InitiateCallDto {
    @ApiProperty({
        description: 'ID of the user to call',
        example: 'c88d5a3d-2f71-499c-b5be-bab40e6b75ad',
    })
    @IsNotEmpty()
    @IsUUID()
    receiverId: string;

    @ApiProperty({
        description: 'Type of call (audio or video)',
        enum: CallType,
        example: CallType.VIDEO,
    })
    @IsNotEmpty()
    @IsEnum(CallType)
    callType: CallType;
}
