import {ApiProperty} from '@nestjs/swagger';

export class UploadFileDto {
    @ApiProperty({
        description: 'The file to upload',
        type: 'string',
        format: 'binary',
    })
    file: any;
}
