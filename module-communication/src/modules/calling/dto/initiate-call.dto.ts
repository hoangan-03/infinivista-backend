import {IsEnum, IsNotEmpty, IsUUID} from 'class-validator';

import {CallType} from '../enums/call-type.enum';

export class InitiateCallDto {
    @IsNotEmpty()
    @IsUUID()
    receiverId: string;

    @IsNotEmpty()
    @IsEnum(CallType)
    callType: CallType;
}
