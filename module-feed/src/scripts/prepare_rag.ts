import {PutObjectCommand, S3Client, S3ClientConfig} from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import {mkdirSync, readFileSync, writeFileSync} from 'fs';
import {GoogleAuth} from 'google-auth-library';
import {Agent} from 'https';
import {join} from 'path';

import {allKnowledgeItems} from './knowledge';

dotenv.config();

interface VectorDataPoint {
    id: string;
    embedding: number[];
    restricts?: {namespace: string; allowList: string[]; denyList?: string[]}[];
}

export class InfinivistaKnowledgePreparation {
    private s3Client: S3Client;
    private googleAuth: GoogleAuth;
    private gcpProjectId: string;
    private gcpRegion: string;
    constructor() {
        const s3Config: S3ClientConfig = {
            region: process.env.AWS_REGION!,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
            forcePathStyle: true,
            useAccelerateEndpoint: false,
        };

        if (process.env.S3_ENDPOINT || process.env.NODE_ENV === 'development') {
            s3Config.endpoint = process.env.S3_ENDPOINT;
            s3Config.requestHandler = {
                httpsAgent: new Agent({
                    rejectUnauthorized: false,
                }),
            };
            console.log('🔧 S3 configured for local development with self-signed certificate support');
        }

        this.s3Client = new S3Client(s3Config);

        this.gcpProjectId = process.env.GCP_PROJECT_ID!;
        this.gcpRegion = process.env.GCP_REGION!;

        if (!this.gcpProjectId || !this.gcpRegion) {
            throw new Error('GCP_PROJECT_ID and GCP_REGION environment variables must be set.');
        }
        this.googleAuth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
    }

    async prepareKnowledgeBase(): Promise<void> {
        console.log('Starting knowledge base preparation...');

        const knowledgeItems = allKnowledgeItems;

        console.log(`Prepared ${knowledgeItems.length} knowledge items`);

        const vectorData: VectorDataPoint[] = [];
        const failedItems: string[] = [];

        console.log(`\n🔄 Processing ${knowledgeItems.length} knowledge items...`);

        for (const item of knowledgeItems) {
            try {
                console.log(`\\\n📝 Processing: ${item.title} (ID: ${item.id})`);
                const textToEmbed = `${item.title}\\\n${item.content}`;
                const embedding = await this.generateEmbeddingWithRetry(textToEmbed, item.title);

                if (embedding && embedding.length > 0) {
                    vectorData.push({
                        id: item.id,
                        embedding: embedding,
                        restricts: [
                            {
                                namespace: 'category',
                                allowList: [item.category],
                            },
                        ],
                    });

                    try {
                        await this.saveChunkToS3(
                            item.id,
                            `# ${item.title}\n\n${item.content}\n\nTags: ${item.tags.join(', ')}`
                        );
                        console.log(`✅ Successfully processed: ${item.title}`);
                    } catch (s3Error) {
                        console.warn(`⚠️ S3 upload failed for ${item.id}, but continuing with vector data:`, s3Error);
                    }
                } else {
                    console.error(`❌ Failed to generate embedding for: ${item.title}`);
                    failedItems.push(item.id);
                }
                await this.delay(10000);
            } catch (error) {
                console.error(`❌ Error processing ${item.id} (${item.title}):`, error);
                failedItems.push(item.id);
            }
        }
        console.log(`\n📊 Processing Summary:`);
        console.log(`✅ Successfully processed: ${vectorData.length}/${knowledgeItems.length} items`);
        console.log(`❌ Failed items: ${failedItems.length}`);
        if (failedItems.length > 0) {
            console.log(`Failed IDs: ${failedItems.join(', ')}`);
        }

        if (vectorData.length === 0) {
            throw new Error('No knowledge items were successfully processed! Please check the errors above.');
        }

        const dataDir = join(__dirname, '../../data');
        mkdirSync(dataDir, {recursive: true});

        const vectorDataPath = join(dataDir, 'infinivista-vector-data.json');
        const jsonlLines = vectorData.map((item) => {
            return JSON.stringify({
                id: item.id,
                embedding: item.embedding,
                restricts: item.restricts || [],
            });
        });
        const jsonlContent = jsonlLines.join('\n');
        writeFileSync(vectorDataPath, jsonlContent);

        const prettyJsonPath = join(dataDir, 'infinivista-vector-data-pretty.json');
        writeFileSync(prettyJsonPath, JSON.stringify(vectorData, null, 2));

        console.log('\n📋 Sample vector data entries (JSONL format):');
        jsonlLines.slice(0, 2).forEach((line, index) => {
            console.log(`Line ${index + 1}: ${line}`);
        });

        const readableContent = knowledgeItems
            .map(
                (item) =>
                    `# ${item.title}\n\nCategory: ${item.category}\nTags: ${item.tags.join(', ')}\n\n${item.content}\n\n---\n`
            )
            .join('\n');
        const readablePath = join(dataDir, 'infinivista-knowledge-base.md');
        writeFileSync(readablePath, readableContent);

        console.log('\n✅ Knowledge base preparation completed!');
        console.log(`📁 Vector data (JSONL format) saved to: ${vectorDataPath}`);
        console.log(`📁 Vector data (Pretty JSON) saved to: ${prettyJsonPath}`);
        console.log(`📄 Readable version saved to: ${readablePath}`);
        console.log(`📊 Total items processed: ${vectorData.length}/${knowledgeItems.length}`);
        this.validateVectorDataFormat(vectorDataPath);
    }

    private async generateEmbeddingWithRetry(text: string, title?: string, maxRetries: number = 3): Promise<number[]> {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Attempt ${attempt}/${maxRetries} for embedding generation`);
                return await this.generateEmbedding(text, title);
            } catch (error: any) {
                const isRateLimitError =
                    error.code === 429 ||
                    (error.details && JSON.stringify(error.details).includes('Quota')) ||
                    JSON.stringify(error.details).includes('rate limit');

                if (isRateLimitError && attempt < maxRetries) {
                    const backoffDelay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                    console.warn(
                        `Rate limit hit or temporary error, waiting ${Math.round(backoffDelay / 1000)}s before retry ${attempt + 1}/${maxRetries}`
                    );
                    await this.delay(backoffDelay);
                } else {
                    console.error(
                        `Failed to generate embedding for text snippet (length: ${text.length}) after ${attempt} attempts:`,
                        error.message || error
                    );
                    return [];
                }
            }
        }
        return [];
    }

    /**
     * Generates an embedding for the given text using Vertex AI REST API.
     * @param text The text to embed.
     * @param title An optional title for the content.
     * @returns A promise that resolves to an array of numbers representing the embedding, or an empty array on failure.
     */
    private async generateEmbedding(text: string, title?: string): Promise<number[]> {
        const modelName = process.env.VERTEX_AI_EMBEDDING_MODEL_NAME;

        if (!text || !this.googleAuth || !this.gcpProjectId || !this.gcpRegion || !modelName) {
            console.error('🚨 Missing required configuration for generating embedding.');
            throw new Error('Missing required configuration for generating embedding.');
        }

        try {
            console.log(
                `⏳ Generating embedding for text of length: ${text.length} using model: ${modelName} via REST API`
            );

            const authClient = await this.googleAuth.getClient();
            const accessToken = await authClient.getAccessToken();

            if (!accessToken.token) {
                throw new Error('Failed to get access token');
            }
            const endpoint: string = `https://${this.gcpRegion}-aiplatform.googleapis.com/v1/projects/${this.gcpProjectId}/locations/${this.gcpRegion}/publishers/google/models/${modelName}:predict`;
            const requestBody: any = {
                instances: [
                    {
                        content: text,
                        task_type: 'RETRIEVAL_DOCUMENT',
                    },
                ],
            };

            if (title) {
                requestBody.instances[0].title = title;
            }

            requestBody.instances[0].output_dimensionality = 768;

            console.log(`📝 Request endpoint: ${endpoint}`);
            console.log(`📝 Request body:`, JSON.stringify(requestBody, null, 2));

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ HTTP Error ${response.status}: ${response.statusText}`);
                console.error(`❌ Error response: ${errorText}`);
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }

            const responseData: any = await response.json();
            if (responseData && responseData.predictions && responseData.predictions.length > 0) {
                const prediction = responseData.predictions[0];
                let embeddingValues: number[] | undefined;

                if (prediction.embeddings && prediction.embeddings.values) {
                    embeddingValues = prediction.embeddings.values;
                } else if (prediction.values) {
                    embeddingValues = prediction.values;
                } else if (Array.isArray(prediction)) {
                    embeddingValues = prediction;
                } else if (prediction.embedding && Array.isArray(prediction.embedding)) {
                    embeddingValues = prediction.embedding;
                }

                if (embeddingValues && embeddingValues.length > 0) {
                    console.log(`✅ Successfully generated embedding with ${embeddingValues.length} dimensions.`);
                    return embeddingValues;
                } else {
                    console.error('❌ Error: No valid embedding values found in response');
                    throw new Error('Failed to extract embedding values from API response.');
                }
            } else {
                console.error('❌ Error: Invalid response structure');
                throw new Error('Failed to get valid response from API.');
            }
        } catch (error: any) {
            console.error(`❌ Error generating embedding for model "${modelName}":`, error);

            if (error.message && error.message.includes('403')) {
                console.error('❌ Permission denied. Check your GCP credentials and API permissions.');
            } else if (error.message && error.message.includes('400')) {
                console.error('❌ Bad request. Check your request format and model name.');
            } else if (error.message && error.message.includes('404')) {
                console.error('❌ Model not found. Check your model name and region.');
            }

            throw error;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private async saveChunkToS3(chunkId: string, content: string): Promise<void> {
        try {
            const bucketName = process.env.S3_CHUNKS_BUCKET_NAME;
            if (!bucketName) {
                console.warn(`⚠ S3_CHUNKS_BUCKET_NAME not configured, skipping S3 upload for ${chunkId}`);
                return;
            }

            console.log(`Uploading ${chunkId} to S3 bucket: ${bucketName}`);

            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: `chunks/${chunkId}.txt`,
                Body: content,
                ContentType: 'text/plain',
            });

            await this.s3Client.send(command);
            console.log(`✓ Successfully uploaded ${chunkId} to S3`);
        } catch (error: any) {
            console.error(`Error saving chunk ${chunkId} to S3:`, error);

            if (error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
                console.error(
                    '❌ Self-signed certificate error. This usually happens with LocalStack or local S3 services.'
                );
                console.error(
                    '💡 Suggestion: Set NODE_TLS_REJECT_UNAUTHORIZED=0 in your environment variables as a temporary fix.'
                );
                console.error(
                    '💡 Or configure your S3_ENDPOINT to use http:// instead of https:// for local development.'
                );
            } else if (error.name === 'PermanentRedirect') {
                console.error(
                    `❌ S3 Bucket region mismatch. Check that S3_CHUNKS_BUCKET_NAME exists in region: ${process.env.AWS_REGION}`
                );
                console.error(`   The bucket might be in a different region or the bucket name might be incorrect.`);
            } else if (error.code === 'NoSuchBucket') {
                console.error(`❌ S3 Bucket does not exist. Please create it first.`);
            } else if (error.code === 'AccessDenied') {
                console.error(`❌ Access denied to S3 bucket. Check your AWS credentials and permissions.`);
            }

            console.warn(`⚠️ Continuing without S3 upload for ${chunkId}`);
        }
    }

    private validateVectorDataFormat(filePath: string): void {
        try {
            console.log('\n🔍 Validating vector data format...');
            const content = readFileSync(filePath, 'utf-8');
            const lines = content.trim().split('\n');
            console.log(`📊 Total lines: ${lines.length}`);

            if (lines.length === 0) throw new Error('File is empty');

            let validLines = 0;
            lines.forEach((line, index) => {
                if (line.trim() === '') {
                    console.warn(`⚠️  Empty line ${index + 1}`);
                    return;
                }
                try {
                    const entry = JSON.parse(line);
                    if (!entry.id || !entry.embedding || !Array.isArray(entry.embedding)) {
                        throw new Error(`Invalid entry structure: missing id, embedding, or embedding is not array`);
                    }

                    const expectedDimension = 768;

                    if (entry.embedding.length !== expectedDimension && entry.embedding.length !== 0) {
                        console.warn(
                            `Warning: Unexpected embedding dimension for id ${entry.id}: expected ${expectedDimension} (or 0 for failures), got ${entry.embedding.length}`
                        );
                    }
                    validLines++;
                    if (index < 3) {
                        console.log(`✓ Line ${index + 1}: Valid JSON`);
                        console.log(`  - ID: ${entry.id}`);
                        console.log(`  - Embedding length: ${entry.embedding.length}`);
                        console.log(`  - Has restricts: ${!!entry.restricts}`);
                    }
                } catch (parseError: any) {
                    console.error(`❌ Invalid JSON at line ${index + 1}:`, parseError.message);
                    console.error(`   Content: ${line.substring(0, 100)}...`);
                    throw new Error(`Line ${index + 1} is not valid JSON`);
                }
            });
            console.log(
                `✅ Vector data format validation completed: ${validLines}/${lines.length} valid lines (or lines with failed embeddings)`
            );
        } catch (error: any) {
            console.error('❌ Error validating vector data format:', error.message);
            throw error;
        }
    }
}

if (require.main === module) {
    const preparation = new InfinivistaKnowledgePreparation();
    preparation
        .prepareKnowledgeBase()
        .then(() => {
            console.log('Script completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}
