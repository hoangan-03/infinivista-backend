import {ApiProperty} from '@nestjs/swagger';

export class FileUploadDto {
    @ApiProperty({type: 'string', format: 'binary'})
    file: any;
}

export class FileUploadResponseDto {
    @ApiProperty()
    url: string;

    @ApiProperty()
    filename: string;

    @ApiProperty()
    mimetype: string;

    @ApiProperty()
    size: number;
}
