import {Inject, Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {ClientProxy} from '@nestjs/microservices';
import {lastValueFrom} from 'rxjs';

@Injectable()
export class FileUploadService {
    private readonly logger = new Logger(FileUploadService.name);

    constructor(
        private readonly configService: ConfigService,
        @Inject('COMMUNICATION_SERVICE') private communicationClient: ClientProxy,
        @Inject('FEED_SERVICE') private feedClient: ClientProxy,
        @Inject('USER_SERVICE') private userClient: ClientProxy
    ) {}

    async uploadFile(
        buffer: Buffer,
        filename: string,
        mimetype: string,
        service: 'communication' | 'feed' | 'user' = 'communication',
        folderId?: string
    ): Promise<string> {
        try {
            let client: ClientProxy;
            let commandPattern: string;

            // Select the appropriate client and command based on the service parameter
            switch (service) {
                case 'communication':
                    client = this.communicationClient;
                    commandPattern = 'UploadAttachmentFileCommand';
                    break;
                case 'feed':
                    client = this.feedClient;
                    commandPattern = 'UploadAttachmentToPostCommand';
                    break;
                case 'user':
                    client = this.userClient;
                    commandPattern = 'UploadPhotoCommand';
                    break;
                default:
                    client = this.communicationClient;
                    commandPattern = 'UploadAttachmentFileCommand';
            }

            // Forward the upload request to the appropriate microservice with the correct command pattern
            const result = await lastValueFrom(
                client.send(commandPattern, {
                    buffer,
                    fileName: filename,
                    mimeType: mimetype,
                    folderId,
                })
            );

            return result.url;
        } catch (error: any) {
            this.logger.error(`Failed to upload file: ${error}`);
            throw error;
        }
    }

    async deleteFile(fileUrl: string, service: 'communication' | 'feed' | 'user' = 'communication'): Promise<boolean> {
        try {
            let client: ClientProxy;

            // Select the appropriate client based on the service parameter
            switch (service) {
                case 'communication':
                    client = this.communicationClient;
                    break;
                case 'feed':
                    client = this.feedClient;
                    break;
                case 'user':
                    client = this.userClient;
                    break;
                default:
                    client = this.communicationClient;
            }

            // Forward the delete request to the appropriate microservice
            const result = await lastValueFrom(client.send('DeleteFileCommand', {fileUrl}));

            return result.success;
        } catch (error: any) {
            this.logger.error(`Failed to delete file: ${error.message}`);
            return false;
        }
    }
}
