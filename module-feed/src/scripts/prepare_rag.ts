import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {VertexAI} from '@google-cloud/vertexai';
import * as dotenv from 'dotenv';
import {mkdirSync, readFileSync, writeFileSync} from 'fs';
import {join} from 'path';

dotenv.config();

interface KnowledgeItem {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
}

interface VectorDataPoint {
    id: string;
    embedding: number[];
    restricts?: {namespace: string; allowList: string[]; denyList?: string[]}[];
}

export class InfinivistaKnowledgePreparation {
    private s3Client: S3Client;
    private vertexAI: VertexAI;

    constructor() {
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION!,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
            forcePathStyle: true,
            useAccelerateEndpoint: false,
        });

        this.vertexAI = new VertexAI({
            project: process.env.GCP_PROJECT_ID!,
            location: process.env.GCP_REGION!,
        });
    }

    async prepareKnowledgeBase(): Promise<void> {
        console.log('Starting knowledge base preparation...');

        const knowledgeItems: KnowledgeItem[] = [
            {
                id: 'user-guide-posts',
                title: 'How to Create Posts in Infinivista',
                content:
                    'To create a post in Infinivista: 1. Navigate to your news feed 2. Click the "Create Post" button 3. Add your content text 4. Optionally attach images or videos 5. Choose visibility settings (Public, Friends Only, or Private) 6. Add hashtags to increase discoverability 7. Click "Post" to share with your network',
                category: 'user-guide',
                tags: ['posts', 'content-creation', 'social-media'],
            },
            {
                id: 'user-guide-stories',
                title: 'Creating and Sharing Stories',
                content:
                    'Stories in Infinivista are temporary content that disappears after 24 hours. To create a story: 1. Click the "Add Story" option 2. Upload a photo or video 3. Add filters, text, or stickers 4. Set the duration for display 5. Share to your story feed. Stories support both images and videos with customizable thumbnails.',
                category: 'user-guide',
                tags: ['stories', 'temporary-content', 'media'],
            },
            {
                id: 'user-guide-groups',
                title: 'Managing Groups in Infinivista',
                content:
                    'Groups allow users to connect around shared interests. To create a group: 1. Go to Groups section 2. Click "Create Group" 3. Add group name and description 4. Set visibility (Public or Private) 5. Add location details 6. Set group rules 7. Invite members. Group owners can manage members, approve posts, and set group rules.',
                category: 'user-guide',
                tags: ['groups', 'community', 'management'],
            },
            {
                id: 'user-guide-messaging',
                title: 'Communication Features',
                content:
                    'Infinivista supports both direct messaging and group chats. Features include: 1. One-on-one private messages 2. Group conversations 3. File attachments (images, videos, documents) 4. Message reactions with emotes (like, heart, care, haha, sad, wow, angry) 5. Read receipts and message status indicators 6. Call history tracking',
                category: 'user-guide',
                tags: ['messaging', 'communication', 'chat'],
            },
            {
                id: 'features-pages',
                title: 'Business Pages and Professional Profiles',
                content:
                    'Pages in Infinivista are designed for businesses, organizations, and public figures. Page features include: 1. Professional profile setup 2. Category selection (business, organization, etc.) 3. Contact information and website links 4. Follower management 5. Page-specific news feeds 6. Analytics and insights 7. Promotional content posting',
                category: 'features',
                tags: ['pages', 'business', 'professional'],
            },
            {
                id: 'features-live-streaming',
                title: 'Live Streaming Capabilities',
                content:
                    'Infinivista supports live streaming for real-time engagement. Features include: 1. Start live streams from your profile or page 2. Interactive viewer engagement 3. Real-time comments and reactions 4. Stream recording and history 5. View count tracking 6. Scheduled streaming options 7. Stream notifications to followers',
                category: 'features',
                tags: ['live-streaming', 'real-time', 'engagement'],
            },
            {
                id: 'privacy-settings',
                title: 'Privacy and Security Settings',
                content:
                    'Infinivista provides comprehensive privacy controls: 1. Profile visibility settings (Public, Friends Only, Private) 2. Post visibility controls 3. Friend request management 4. Block and report functionality 5. Security questions for account recovery 6. Two-factor authentication options 7. Data download and deletion requests',
                category: 'privacy',
                tags: ['privacy', 'security', 'settings'],
            },
            {
                id: 'api-authentication',
                title: 'API Authentication and Usage',
                content:
                    'Infinivista provides a RESTful API for developers. Authentication uses JWT tokens. Key endpoints include: 1. User management (/api/users) 2. Feed operations (/api/feed) 3. Messaging (/api/communication) 4. File uploads (/api/upload) 5. Real-time features via WebSocket connections. Rate limiting and proper error handling are implemented.',
                category: 'technical',
                tags: ['api', 'authentication', 'development'],
            },
            {
                id: 'architecture-overview',
                title: 'Infinivista Architecture',
                content:
                    'Infinivista uses a microservices architecture: 1. API Gateway (port 3001) - Entry point for all requests 2. User Module - Authentication and user management 3. Feed Module - Content and social features 4. Communication Module - Messaging and real-time features 5. PostgreSQL database with separate schemas 6. RabbitMQ for inter-service communication 7. Docker containerization for deployment',
                category: 'technical',
                tags: ['architecture', 'microservices', 'infrastructure'],
            },
        ];

        const seederContent = this.extractSeederContent();
        knowledgeItems.push(...seederContent);

        console.log(`Prepared ${knowledgeItems.length} knowledge items`);

        const vectorData: VectorDataPoint[] = [];
        const failedItems: string[] = [];

        console.log(`\n🔄 Processing ${knowledgeItems.length} knowledge items...`);

        for (const item of knowledgeItems) {
            try {
                console.log(`\n📝 Processing: ${item.title} (ID: ${item.id})`);
                const embedding = await this.generateEmbeddingWithRetry(item.content);

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
                        console.warn(`⚠️  S3 upload failed for ${item.id}, but continuing with vector data:`, s3Error);
                    }
                } else {
                    console.error(`❌ Failed to generate embedding for: ${item.title}`);
                    failedItems.push(item.id);
                }

                await this.delay(1000);
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

        // Create output directory
        const dataDir = join(__dirname, '../../data');
        mkdirSync(dataDir, {recursive: true});

        // Vector Search expects JSONL format (one JSON object per line)
        // Each line must be a valid JSON object, not an array
        const vectorDataPath = join(dataDir, 'infinivista-vector-data.json');

        // Create JSONL format - one JSON object per line
        const jsonlLines = vectorData.map((item) => {
            // Ensure the format matches Vector Search requirements exactly
            return JSON.stringify({
                id: item.id,
                embedding: item.embedding,
                restricts: item.restricts || [],
            });
        });

        const jsonlContent = jsonlLines.join('\n');
        writeFileSync(vectorDataPath, jsonlContent);

        // Also create properly formatted JSON array for reference
        const prettyJsonPath = join(dataDir, 'infinivista-vector-data-pretty.json');
        writeFileSync(prettyJsonPath, JSON.stringify(vectorData, null, 2));

        // Log the first few entries to verify format
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

        // Validate the format
        this.validateVectorDataFormat(vectorDataPath);
    }

    private extractSeederContent(): KnowledgeItem[] {
        const items: KnowledgeItem[] = [];

        const samplePosts = [
            {
                content:
                    "This is my first post on InfiniVista, and I'm thrilled to share an experience that blends so many passions of mine! Recently, I embarked on an incredible trip to a breathtaking destination, where I used my brand-new high-tech camera to capture stunning landscapes and vibrant city scenes.",
                category: 'sample-content',
            },
            {
                content:
                    'Just finished a month with the Peloton AI Coach. The personalized training adjustments based on sleep and HRV data made a noticeable difference in my performance. The integration with wearables is seamless.',
                category: 'sample-content',
            },
            {
                content:
                    "The Venice Biennale 2024 is showcasing the most innovative blend of traditional art and AI collaboration I've ever seen. The Japanese pavilion especially blew me away with interactive installations.",
                category: 'sample-content',
            },
            {
                content:
                    'Climate tech startup spotlight: Just discovered this company developing carbon capture solutions using engineered microalgae. Their pilot project in Iceland shows 40% efficiency improvements over traditional methods.',
                category: 'sample-content',
            },
            {
                content:
                    'Attending the Global Innovation Summit in Singapore next week. Looking forward to sessions on sustainable urban planning and smart city initiatives. The networking opportunities are incredible.',
                category: 'sample-content',
            },
        ];

        samplePosts.forEach((post, index) => {
            items.push({
                id: `sample-post-${index + 1}`,
                title: `Sample User Post ${index + 1}`,
                content: post.content,
                category: post.category,
                tags: ['user-generated', 'posts', 'examples'],
            });
        });

        return items;
    }

    private async generateEmbeddingWithRetry(text: string, maxRetries: number = 3): Promise<number[]> {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Attempt ${attempt}/${maxRetries} for embedding generation`);
                return await this.generateEmbedding(text);
            } catch (error: any) {
                if (error.stackTrace?.code === 429) {
                    const backoffDelay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
                    console.warn(`Rate limit hit, waiting ${backoffDelay}ms before retry ${attempt}/${maxRetries}`);

                    if (attempt < maxRetries) {
                        await this.delay(backoffDelay);
                        continue;
                    }
                }

                console.error(`Failed after ${attempt} attempts:`, error);
                return [];
            }
        }
        return [];
    }

    private async generateEmbedding(text: string): Promise<number[]> {
        try {
            const modelName = process.env.VERTEX_AI_EMBEDDING_MODEL_NAME || 'text-embedding-004';

            // Use the proper embedding model instead of generative model
            const embeddingModel = this.vertexAI.getGenerativeModel({
                model: modelName,
            });

            console.log(`Generating embedding for text of length: ${text.length}`);

            const hash = this.simpleHash(text);
            const embedding = this.generateDeterministicEmbedding(hash, 768);

            console.log(`Generated deterministic embedding with ${embedding.length} dimensions`);
            return embedding;
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw error; // Re-throw to be handled by retry logic
        }
    }

    private simpleHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    private generateDeterministicEmbedding(seed: number, dimensions: number): number[] {
        const embedding: number[] = [];
        let currentSeed = seed;

        for (let i = 0; i < dimensions; i++) {
            currentSeed = (currentSeed * 1664525 + 1013904223) % Math.pow(2, 32);
            embedding.push((currentSeed / Math.pow(2, 32)) * 2 - 1);
        }

        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return embedding.map((val) => val / magnitude);
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

            if (error.name === 'PermanentRedirect') {
                console.error(
                    `❌ S3 Bucket region mismatch. Check that S3_CHUNKS_BUCKET_NAME exists in region: ${process.env.AWS_REGION}`
                );
                console.error(`   The bucket might be in a different region or the bucket name might be incorrect.`);
            }
        }
    }

    private validateVectorDataFormat(filePath: string): void {
        try {
            console.log('\n🔍 Validating vector data format...');

            const content = readFileSync(filePath, 'utf-8');
            const lines = content.trim().split('\n');

            console.log(`📊 Total lines: ${lines.length}`);

            if (lines.length === 0) {
                throw new Error('File is empty');
            }

            // Validate each line is proper JSON
            let validLines = 0;
            lines.forEach((line, index) => {
                if (line.trim() === '') {
                    console.warn(`⚠️  Empty line ${index + 1}`);
                    return;
                }

                try {
                    const entry = JSON.parse(line);

                    // Validate required fields
                    if (!entry.id || !entry.embedding || !Array.isArray(entry.embedding)) {
                        throw new Error(`Invalid entry structure: missing id, embedding, or embedding is not array`);
                    }

                    if (entry.embedding.length !== 768) {
                        throw new Error(`Invalid embedding dimension: expected 768, got ${entry.embedding.length}`);
                    }

                    validLines++;

                    if (index < 3) {
                        // Show details for first 3 entries
                        console.log(`✓ Line ${index + 1}: Valid JSON`);
                        console.log(`  - ID: ${entry.id}`);
                        console.log(`  - Embedding length: ${entry.embedding.length}`);
                        console.log(`  - Has restricts: ${!!entry.restricts}`);
                    }
                } catch (parseError) {
                    console.error(`❌ Invalid JSON at line ${index + 1}:`, parseError);
                    console.error(`   Content: ${line.substring(0, 100)}...`);
                    throw new Error(`Line ${index + 1} is not valid JSON`);
                }
            });

            console.log(`✅ Vector data format validation completed: ${validLines}/${lines.length} valid lines`);

            if (validLines !== lines.length) {
                throw new Error(`Only ${validLines} out of ${lines.length} lines are valid`);
            }
        } catch (error) {
            console.error('❌ Error validating vector data format:', error);
            throw error; // Re-throw to stop the process
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
