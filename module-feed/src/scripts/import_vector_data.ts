import {Storage} from '@google-cloud/storage';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import {GoogleAuth} from 'google-auth-library';
import * as path from 'path';

dotenv.config();

export class VectorDataImporter {
    private auth: GoogleAuth;
    private storage: Storage;
    private projectId: string;
    private location: string;
    private url: string;

    constructor() {
        this.auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });

        this.storage = new Storage({
            projectId: process.env.GCP_PROJECT_ID,
        });

        this.projectId = process.env.GCP_PROJECT_ID!;
        this.location = process.env.GCP_REGION!;
        this.url = process.env.VECTOR_INDEX_URL!;
    }

    async importVectorData(): Promise<void> {
        console.log('🚀 Importing vector data to Vector Search...');

        try {
            // Step 1: Create GCS bucket
            const bucketName = `${this.projectId}-vector-data`;
            await this.createGCSBucket(bucketName);

            // Step 2: Upload JSON file to GCS (not JSONL)
            const localFilePath = path.join(process.cwd(), 'data', 'infinivista-vector-data.json');
            const gcsFilePath = 'infinivista-vector-data.json';
            await this.uploadFileToGCS(bucketName, localFilePath, gcsFilePath);

            // Step 3: Update the index with the data location
            await this.updateIndexWithData(bucketName, gcsFilePath);

            console.log('✅ Vector data import completed successfully!');
        } catch (error) {
            console.error('❌ Error importing vector data:', error);
            throw error;
        }
    }

    private async createGCSBucket(bucketName: string): Promise<void> {
        try {
            // Use a more robust existence check
            try {
                await this.storage.bucket(bucketName).getMetadata();
                console.log(`✅ Bucket ${bucketName} already exists`);
                return;
            } catch (error: any) {
                // If error is 404, bucket doesn't exist, so we can create it
                if (error.code !== 404) {
                    throw error; // Re-throw if it's not a "not found" error
                }
            }

            // Bucket doesn't exist, create it
            try {
                await this.storage.createBucket(bucketName, {
                    location: 'US-CENTRAL1',
                    storageClass: 'STANDARD',
                });
                console.log(`✅ Created bucket: ${bucketName}`);
            } catch (createError: any) {
                // If bucket already exists (race condition), that's OK
                if (createError.message?.includes('already own it') || createError.code === 409) {
                    console.log(`✅ Bucket ${bucketName} already exists (created by another process)`);
                    return;
                }
                throw createError;
            }

            // Wait for bucket to be fully available
            console.log('⏳ Waiting for bucket to be ready...');
            await this.waitForBucketReady(bucketName);
        } catch (error) {
            console.error(`❌ Error with bucket ${bucketName}:`, error);
            throw error;
        }
    }

    private async waitForBucketReady(bucketName: string, maxRetries: number = 10): Promise<void> {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const [exists] = await this.storage.bucket(bucketName).exists();
                if (exists) {
                    // Additional check: try to list objects to ensure bucket is fully ready
                    await this.storage.bucket(bucketName).getFiles({maxResults: 1});
                    console.log(`✅ Bucket ${bucketName} is ready`);
                    return;
                }
            } catch (error) {
                console.log(`⏳ Bucket not ready yet, retry ${i + 1}/${maxRetries}...`);
            }

            // Wait 2 seconds before next retry
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        throw new Error(`Bucket ${bucketName} is not ready after ${maxRetries} retries`);
    }

    private async uploadFileToGCS(bucketName: string, localFilePath: string, gcsFilePath: string): Promise<void> {
        if (!fs.existsSync(localFilePath)) {
            throw new Error(`Local file not found: ${localFilePath}`);
        }

        // Clean up the directory first - remove any old files
        const directoryPath = 'vector-data/';
        await this.cleanupGCSDirectory(bucketName, directoryPath);

        // Upload only the JSON file to the directory
        const fullGcsPath = `${directoryPath}${gcsFilePath}`;

        await this.storage.bucket(bucketName).upload(localFilePath, {
            destination: fullGcsPath,
            metadata: {contentType: 'application/json'},
        });
        console.log(`✅ Uploaded to gs://${bucketName}/${fullGcsPath}`);
    }

    private async cleanupGCSDirectory(bucketName: string, directoryPath: string): Promise<void> {
        try {
            console.log(`🧹 Cleaning up directory: gs://${bucketName}/${directoryPath}`);

            const bucket = this.storage.bucket(bucketName);
            const [files] = await bucket.getFiles({prefix: directoryPath});

            if (files.length > 0) {
                console.log(`Found ${files.length} existing files to delete`);

                for (const file of files) {
                    await file.delete();
                    console.log(`Deleted: ${file.name}`);
                }
            } else {
                console.log('Directory is already clean');
            }
        } catch (error) {
            console.log(`Note: Could not clean directory (this is OK if it doesn't exist yet): ${error}`);
        }
    }

    private async updateIndexWithData(bucketName: string, gcsFilePath: string): Promise<void> {
        const authClient = await this.auth.getClient();
        const accessToken = await authClient.getAccessToken();

        const endpoint = this.url;

        // Use directory path instead of file path
        const directoryPath = 'vector-data/';
        const updatePayload = {
            metadata: {
                contentsDeltaUri: `gs://${bucketName}/${directoryPath}`,
                isCompleteOverwrite: true,
            },
        };

        console.log(`Updating index with directory: gs://${bucketName}/${directoryPath}`);
        console.log(`Using endpoint: ${endpoint}`);

        const response = await fetch(endpoint, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Index update failed: ${response.status} - ${errorText}`);
        }

        const operation: any = await response.json();
        console.log('✅ Index update started:', operation.name);
        console.log('⏳ Import will complete in 10-30 minutes');
    }

    async checkDataFileExists(): Promise<boolean> {
        const dataFilePath = path.join(process.cwd(), 'data', 'infinivista-vector-data.json');
        return fs.existsSync(dataFilePath);
    }

    private async cleanupExistingData(bucketName: string, prefix: string): Promise<void> {
        console.log(`🧹 Cleaning up directory: gs://${bucketName}/${prefix}`);
        try {
            // First check if bucket exists
            const [bucketExists] = await this.storage.bucket(bucketName).exists();
            if (!bucketExists) {
                console.log('Note: Bucket does not exist yet, skipping cleanup');
                return;
            }

            const [files] = await this.storage.bucket(bucketName).getFiles({
                prefix: prefix,
            });

            if (files.length > 0) {
                console.log(`Found ${files.length} files to delete`);
                await Promise.all(files.map((file) => file.delete()));
                console.log('✅ Cleanup completed');
            } else {
                console.log('No existing files to clean up');
            }
        } catch (error: any) {
            console.log(`Note: Could not clean directory (this is OK if it doesn't exist yet): ${error.message}`);
        }
    }
}

if (require.main === module) {
    const importer = new VectorDataImporter();

    importer.checkDataFileExists().then(async (exists) => {
        if (!exists) {
            console.log('❌ Vector data file not found!');
            console.log('Run: npm run ts-node src/scripts/prepare_rag.ts');
            process.exit(1);
        }

        try {
            await importer.importVectorData();
            console.log('🎉 Import completed!');
            process.exit(0);
        } catch (error) {
            console.error('💥 Import failed:', error);
            process.exit(1);
        }
    });
}
