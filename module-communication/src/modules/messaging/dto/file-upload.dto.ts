export class FileUploadDto {
    fileName: string;
    mimeType: string;
    buffer: Buffer;
    recipientId: string;
}

export class FileUploadResponseDto {
    url: string;
    fileName: string;
    mimeType: string;
}
