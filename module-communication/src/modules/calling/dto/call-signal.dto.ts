import {IsNotEmpty, IsObject, IsOptional, IsString} from 'class-validator';

export class CallSignalDto {
    @IsNotEmpty()
    @IsString()
    from: string;

    @IsNotEmpty()
    @IsString()
    to: string;

    @IsNotEmpty()
    @IsString()
    callId: string;

    @IsOptional()
    @IsObject()
    data?: any;
}
