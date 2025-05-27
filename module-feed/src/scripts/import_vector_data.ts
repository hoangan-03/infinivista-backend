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

    constructor() {
        this.auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });

        this.storage = new Storage({
            projectId: process.env.GCP_PROJECT_ID,
        });

        this.projectId = process.env.GCP_PROJECT_ID!;
        this.location = process.env.GCP_REGION!;
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
            const [bucketExists] = await this.storage.bucket(bucketName).exists();
            if (bucketExists) {
                console.log(`✅ Bucket ${bucketName} already exists`);
                return;
            }

            await this.storage.createBucket(bucketName, {
                location: this.location.toUpperCase(),
                storageClass: 'STANDARD',
            });
            console.log(`✅ Created bucket: ${bucketName}`);
        } catch (error) {
            console.error(`❌ Error with bucket ${bucketName}:`, error);
            throw error;
        }
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

        const indexId = '1724289319050412032';
        // Use the same endpoint pattern as in setup_vector_search.ts for operations
        const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/indexes/${indexId}`;

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
