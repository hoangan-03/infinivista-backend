import {BadRequestException, Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {drive_v3, google} from 'googleapis';
import * as stream from 'stream';

@Injectable()
export class FileUploadService {
    private drive: drive_v3.Drive;
    private readonly logger = new Logger(FileUploadService.name);

    constructor(private configService: ConfigService) {
        this.initGoogleDriveClient();
    }

    private initGoogleDriveClient() {
        try {
            const keyFile = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');

            const auth = new google.auth.GoogleAuth({
                keyFile,
                scopes: ['https://www.googleapis.com/auth/drive.file'],
            });

            this.drive = google.drive({version: 'v3', auth});
            this.logger.log('Google Drive client initialized successfully');
        } catch (error: any) {
            this.logger.error(`Failed to initialize Google Drive client: ${error.message}`);
            throw error;
        }
    }

    async uploadFile(fileBuffer: Buffer, filename: string, mimetype: string, folderId?: string): Promise<string> {
        try {
            const bufferStream = new stream.PassThrough();
            bufferStream.end(fileBuffer);

            const fileMetadata = {
                name: `${Date.now()}-${filename}`,
                parents: folderId ? [folderId] : undefined,
            };

            const media = {
                mimeType: mimetype,
                body: bufferStream,
            };

            const response = await this.drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id',
            });

            if (!response.data.id) {
                throw new Error('File upload failed: No file ID returned');
            }

            await this.drive.permissions.create({
                fileId: response.data.id,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
            });

            // Check if the file is a video
            if (mimetype.startsWith('video/')) {
                return `https://www.googleapis.com/drive/v3/files/${response.data.id}?alt=media&key=${this.getApiKey()}`;
            } else {
                // For images and other files
                const fileData = await this.drive.files.get({
                    fileId: response.data.id,
                    fields: 'webContentLink',
                });

                if (!fileData.data.webContentLink) {
                    throw new Error('Failed to get file download URL');
                }

                // Removing the export=download parameter
                return this.cleanGoogleDriveUrl(fileData.data.webContentLink);
            }
        } catch (error: any) {
            this.logger.error(`Failed to upload file to Google Drive: ${error.message}`);
            throw new BadRequestException('Failed to upload file to Google Drive');
        }
    }

    private getApiKey(): string {
        const apiKey = this.configService.get<string>('GOOGLE_API_KEY');
        if (!apiKey) {
            this.logger.error('GOOGLE_API_KEY is not set in configuration');
            throw new BadRequestException('Google API key not configured, your key is: ' + apiKey);
        }
        return apiKey;
    }

    async deleteFile(fileUrl: string): Promise<boolean> {
        try {
            const fileId = this.extractFileIdFromUrl(fileUrl);

            if (!fileId) {
                this.logger.error(`Failed to extract file ID from URL: ${fileUrl}`);
                return false;
            }

            await this.drive.files.delete({
                fileId,
            });

            return true;
        } catch (error: any) {
            this.logger.error(`Failed to delete file from Google Drive: ${error.message}`);
            return false;
        }
    }

    private extractFileIdFromUrl(url: string): string | null {
        try {
            const match = url.match(/[-\w]{25,}/);
            return match ? match[0] : null;
        } catch {
            return null;
        }
    }

    private cleanGoogleDriveUrl(url: string): string {
        // Remove the export=download parameter
        return url.replace('&export=download', '');
    }
}
