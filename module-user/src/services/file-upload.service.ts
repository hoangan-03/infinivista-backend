import {BadRequestException, Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {drive_v3, google} from 'googleapis';
import * as stream from 'stream';

@Injectable()
export class FileUploadService {
    private drive: drive_v3.Drive;
    private readonly logger = new Logger(FileUploadService.name);

    constructor(private configService: ConfigService) {
        // Initialize Google Drive API client
        this.initGoogleDriveClient();
    }

    private initGoogleDriveClient() {
        try {
            const keyFile = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');

            // Use service account auth or OAuth2, depending on your setup
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
            // Create a readable stream from file buffer
            const bufferStream = new stream.PassThrough();
            bufferStream.end(fileBuffer);

            // Prepare file metadata
            const fileMetadata = {
                name: `${Date.now()}-${filename}`,
                parents: folderId ? [folderId] : undefined,
            };

            // Create media object
            const media = {
                mimeType: mimetype,
                body: bufferStream,
            };

            // Upload to Drive
            const response = await this.drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id,webViewLink',
            });

            // Check if file ID exists
            if (!response.data.id) {
                throw new Error('File upload failed: No file ID returned');
            }

            // Make the file public and get a direct link
            await this.drive.permissions.create({
                fileId: response.data.id,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
            });

            // Get the direct link for the file
            const fileData = await this.drive.files.get({
                fileId: response.data.id,
                fields: 'webContentLink',
            });

            if (!fileData.data.webContentLink) {
                throw new Error('Failed to get file download URL');
            }

            // Clean up the URL by removing the export=download parameter
            const cleanUrl = this.cleanGoogleDriveUrl(fileData.data.webContentLink);
            return cleanUrl;
        } catch (error: any) {
            this.logger.error(`Failed to upload file to Google Drive: ${error.message}`);
            throw new BadRequestException('Failed to upload file to Google Drive');
        }
    }

    async deleteFile(fileUrl: string): Promise<boolean> {
        try {
            // Extract file ID from URL
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
