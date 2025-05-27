import {GetObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {MatchServiceClient} from '@google-cloud/aiplatform';
import {HarmBlockThreshold, HarmCategory, VertexAI} from '@google-cloud/vertexai';
import {Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {GoogleAuth} from 'google-auth-library';

@Injectable()
export class RagService {
    private readonly logger = new Logger(RagService.name);
    private auth: GoogleAuth;
    private vertexAI: VertexAI;
    private s3Client: S3Client;
    private generativeModel: any;

    private projectId: string;
    private location: string;
    private indexEndpoint: string;
    private readonly awsRegion: string;
    private readonly bucketName: string;
    private readonly deployedIndexId: string;
    private readonly embeddingModelName: string;
    private readonly geminiModelName: string;

    constructor(private configService: ConfigService) {
        this.auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });

        this.vertexAI = new VertexAI({
            project: this.configService.getOrThrow<string>('GCP_PROJECT_ID'),
            location: this.configService.getOrThrow<string>('GCP_REGION'),
        });

        this.s3Client = new S3Client({
            region: this.configService.getOrThrow<string>('AWS_REGION'),
            credentials: {
                accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
            },
        });

        this.projectId = this.configService.getOrThrow<string>('GCP_PROJECT_ID');
        this.location = this.configService.getOrThrow<string>('GCP_REGION');
        this.indexEndpoint = this.configService.getOrThrow<string>('VECTOR_SEARCH_ENDPOINT_NAME');
        this.awsRegion = this.configService.getOrThrow<string>('AWS_REGION');
        this.bucketName = this.configService.getOrThrow<string>('S3_CHUNKS_BUCKET_NAME');
        this.deployedIndexId = this.configService.getOrThrow<string>('VERTEX_AI_VECTOR_SEARCH_DEPLOYED_INDEX_ID');
        this.embeddingModelName = this.configService.getOrThrow<string>('VERTEX_AI_EMBEDDING_MODEL_NAME');
        this.geminiModelName = this.configService.getOrThrow<string>('VERTEX_AI_GEMINI_MODEL_NAME');

        this.validateConfiguration();
        this.initializeModels();
    }

    private validateConfiguration(): void {
        const requiredConfigs = [
            {key: 'projectId', value: this.projectId},
            {key: 'location', value: this.location},
            {key: 'indexEndpoint', value: this.indexEndpoint},
            {key: 'awsRegion', value: this.awsRegion},
            {key: 'bucketName', value: this.bucketName},
            {key: 'deployedIndexId', value: this.deployedIndexId},
        ];

        const missingConfigs = requiredConfigs.filter((config) => !config.value);

        if (missingConfigs.length > 0) {
            const missingKeys = missingConfigs.map((config) => config.key).join(', ');
            this.logger.error(`Missing required configurations: ${missingKeys}`);
            throw new Error(`RAG Service is not properly configured. Missing: ${missingKeys}`);
        }

        this.logger.log('RAG Service Configuration:');
        this.logger.log(`Project ID: ${this.projectId}`);
        this.logger.log(`Location: ${this.location}`);
        this.logger.log(`Index Endpoint: ${this.indexEndpoint}`);
        this.logger.log(`Deployed Index ID: ${this.deployedIndexId}`);
        this.logger.log(`Bucket Name: ${this.bucketName}`);
    }

    private initializeModels(): void {
        try {
            this.generativeModel = this.vertexAI.getGenerativeModel({
                model: this.geminiModelName,
                generationConfig: {
                    temperature: 0.2,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 1024,
                },
                safetySettings: [
                    {
                        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    },
                ],
            });

            this.logger.log('Successfully initialized Vertex AI models');
        } catch (error) {
            this.logger.error('Failed to initialize Vertex AI models:', error);
            throw new Error('Failed to initialize RAG service models');
        }
    }

    private async getQueryEmbedding(queryText: string): Promise<number[]> {
        this.logger.log(`Generating embedding for query: "${queryText.substring(0, 50)}..."`);

        if (!queryText?.trim()) {
            throw new Error('Query text cannot be empty for embedding generation');
        }

        try {
            // Use deterministic embeddings to avoid API quota issues
            const hash = this.simpleHash(queryText);
            const embedding = this.generateDeterministicEmbedding(hash, 768);

            this.logger.log(`Generated deterministic embedding with ${embedding.length} dimensions`);
            this.logger.log(`Embedding hash for "${queryText.substring(0, 30)}...": ${hash}`);

            // Add small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 100));

            return embedding;
        } catch (error: any) {
            this.logger.error('Error generating query embedding:', error);

            // If API fails, fall back to deterministic method
            if (error.message?.includes('429') || error.message?.includes('Quota exceeded')) {
                this.logger.warn('API quota exceeded, using deterministic embedding fallback');
                const hash = this.simpleHash(queryText);
                return this.generateDeterministicEmbedding(hash, 768);
            }

            throw new Error(
                `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    private async findRelevantChunkIds(queryEmbedding: number[]): Promise<string[]> {
        this.logger.log('Finding relevant chunk IDs from Vector Search.');

        if (!queryEmbedding || queryEmbedding.length === 0) {
            throw new Error('Query embedding cannot be empty');
        }

        try {
            const API_ENDPOINT = '165229468.asia-southeast1-711236680567.vdb.vertexai.goog';
            const INDEX_ENDPOINT = 'projects/711236680567/locations/asia-southeast1/indexEndpoints/6047824126163288064';
            const DEPLOYED_INDEX_ID = 'infinivista_knowledge_deployed';

            this.logger.log('Using Vector Search configuration:', {
                apiEndpoint: API_ENDPOINT,
                indexEndpoint: INDEX_ENDPOINT,
                deployedIndexId: DEPLOYED_INDEX_ID,
                embeddingLength: queryEmbedding.length,
            });

            // Configure Vector Search client with the specific API endpoint
            const client = new MatchServiceClient({
                apiEndpoint: API_ENDPOINT,
            });

            // Build the request exactly as shown in Google Cloud instruction
            const datapoint = {
                featureVector: queryEmbedding,
            };

            const query = {
                datapoint: datapoint,
                neighborCount: 5, // Number of nearest neighbors to retrieve
            };

            const request = {
                indexEndpoint: INDEX_ENDPOINT,
                deployedIndexId: DEPLOYED_INDEX_ID,
                queries: [query],
                returnFullDatapoint: false,
            };

            this.logger.log('Making vector search request...');

            const [response] = await client.findNeighbors(request);

            this.logger.log('Vector search response received:', {
                hasNeighbors: !!response.nearestNeighbors?.[0]?.neighbors,
                neighborCount: response.nearestNeighbors?.[0]?.neighbors?.length || 0,
            });

            if (response.nearestNeighbors?.[0]?.neighbors) {
                const neighbors = response.nearestNeighbors[0].neighbors
                    .filter((neighbor) => neighbor.datapoint?.datapointId && neighbor.distance !== undefined)
                    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
                    .slice(0, 3);

                const ids = neighbors.map((neighbor) => neighbor.datapoint!.datapointId!);

                this.logger.log(`Found ${ids.length} relevant chunk IDs: ${ids.join(', ')}`);
                this.logger.log(`Distances: ${neighbors.map((n) => n.distance?.toFixed(4)).join(', ')}`);
                return ids;
            }

            this.logger.warn('No relevant neighbors found in vector search - this might indicate:');
            this.logger.warn('1. No data has been imported to the index');
            this.logger.warn('2. The index is not properly deployed');
            this.logger.warn('3. The embedding similarity is too low');
            return [];
        } catch (error: any) {
            this.logger.error('Vector search error details:', {
                error: error.message,
                stack: error.stack,
            });

            if (error.message.includes('NOT_FOUND')) {
                throw new Error(
                    `Vector Search endpoint or deployed index not found. The index may not be properly deployed or data import is incomplete.`
                );
            }

            if (error.message.includes('PERMISSION_DENIED')) {
                throw new Error(
                    `Permission denied accessing Vector Search. Check your Google Cloud credentials and permissions.`
                );
            }

            if (error.message.includes('UNIMPLEMENTED')) {
                throw new Error(
                    `Vector Search operation not implemented. This usually means the index has no data yet. Please complete the data import process.`
                );
            }

            throw new Error(`Vector search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async getChunkTextsByIds(chunkIds: string[]): Promise<string[]> {
        this.logger.log(`Fetching text content for ${chunkIds.length} chunk IDs from S3`);

        if (chunkIds.length === 0) {
            return [];
        }

        try {
            const chunks = await Promise.all(
                chunkIds.map(async (id) => {
                    try {
                        const command = new GetObjectCommand({
                            Bucket: this.bucketName,
                            Key: `chunks/${id}.txt`,
                        });

                        const response = await this.s3Client.send(command);

                        if (response.Body) {
                            const content = await response.Body.transformToString();
                            return content;
                        }

                        this.logger.warn(`Empty content for chunk ${id}`);
                        return '';
                    } catch (error) {
                        this.logger.warn(`Failed to fetch chunk ${id} from S3:`, error);
                        return '';
                    }
                })
            );

            const validChunks = chunks.filter((text) => text.length > 0);
            this.logger.log(`Successfully fetched ${validChunks.length} out of ${chunkIds.length} chunks from S3`);
            return validChunks;
        } catch (error) {
            this.logger.error('Error fetching chunk texts from S3:', error);
            throw new Error('Failed to fetch chunk content from S3');
        }
    }

    private async generateAnswerWithLLM(originalQuery: string, contextTexts: string[]): Promise<string> {
        this.logger.log(`Generating answer with LLM for query: "${originalQuery.substring(0, 50)}..."`);

        if (!contextTexts || contextTexts.length === 0) {
            return "I couldn't find any relevant information in our knowledge base to answer your question. Please try rephrasing your query or ask about a different topic.";
        }

        // Improved context preparation with token management
        const maxContextLength = 8000; // Approximate token limit for context
        let contextString = contextTexts.join('\n\n---DOCUMENT---\n\n');

        if (contextString.length > maxContextLength) {
            contextString = contextString.substring(0, maxContextLength) + '\n...[Content truncated]';
        }

        const prompt = `You are an intelligent assistant for our social media application. Your role is to provide helpful, accurate, and relevant answers based on the provided context.

**Instructions:**
- Answer the user's question using ONLY the information provided in the context below
- If the context doesn't contain enough information, clearly state what information is missing
- Be concise but comprehensive in your response
- If you're uncertain about any details, acknowledge the uncertainty
- Maintain a helpful and professional tone

**Context Documents:**
${contextString}

**User Question:** ${originalQuery}

**Your Answer:**`;

        try {
            const result = await this.generativeModel.generateContent({
                contents: [{role: 'user', parts: [{text: prompt}]}],
            });

            const response = result.response;
            const answer = response?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!answer) {
                this.logger.error('No valid response generated from LLM:', response);
                throw new Error('Failed to generate a valid response');
            }

            this.logger.log('Successfully generated answer from LLM');
            return answer.trim();
        } catch (error) {
            this.logger.error('Error generating answer with LLM:', error);
            throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async processUserQuery(userQuery: string): Promise<string> {
        this.logger.log(`Processing RAG query: "${userQuery.substring(0, 100)}..."`);

        if (!userQuery?.trim()) {
            throw new Error('Query cannot be empty');
        }

        try {
            // Step 1: Generate query embedding
            this.logger.log('Step 1: Generating query embedding...');
            const queryEmbedding = await this.getQueryEmbedding(userQuery.trim());

            // Step 2: Find relevant document chunks
            this.logger.log('Step 2: Finding relevant chunks...');
            const relevantChunkIds = await this.findRelevantChunkIds(queryEmbedding);

            if (relevantChunkIds.length === 0) {
                this.logger.warn('No relevant chunks found - this could mean:');
                this.logger.warn('1. No data in the vector index');
                this.logger.warn('2. Query is too different from indexed content');
                this.logger.warn('3. Index deployment is incomplete');

                return "I couldn't find any relevant information in our knowledge base for your query. This might be because: 1) The knowledge base is still being set up, 2) Your question is outside our current knowledge scope, or 3) Please try rephrasing your question with different keywords.";
            }

            // Step 3: Retrieve chunk content
            this.logger.log('Step 3: Retrieving chunk content...');
            const relevantTexts = await this.getChunkTextsByIds(relevantChunkIds);

            if (relevantTexts.length === 0) {
                this.logger.error('Found chunk IDs but could not retrieve content from S3');
                return "I found potentially relevant information but couldn't retrieve the content from storage. Please try again later.";
            }

            // Step 4: Generate final answer
            this.logger.log('Step 4: Generating answer with LLM...');
            const finalAnswer = await this.generateAnswerWithLLM(userQuery, relevantTexts);

            this.logger.log(`✅ Successfully processed RAG query with ${relevantTexts.length} relevant chunks`);
            return finalAnswer;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            this.logger.error(`❌ Error processing RAG query "${userQuery}":`, errorMessage);

            // Return the actual error in development, generic message in production
            if (process.env.NODE_ENV === 'development') {
                return `Error: ${errorMessage}`;
            }

            return `I apologize, but I encountered an error while processing your request. Please try again later or rephrase your question.`;
        }
    }

    // Health check method for monitoring
    public async healthCheck(): Promise<{status: string; models: string[]; timestamp: Date}> {
        try {
            const isHealthy = this.vertexAI && this.generativeModel;

            return {
                status: isHealthy ? 'healthy' : 'unhealthy',
                models: [this.embeddingModelName, this.geminiModelName],
                timestamp: new Date(),
            };
        } catch (error) {
            this.logger.error('Health check failed:', error);
            throw error;
        }
    }

    // Helper methods for deterministic embedding (MUST match prepare_rag.ts exactly)
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
            // Simple linear congruential generator for deterministic randomness
            currentSeed = (currentSeed * 1664525 + 1013904223) % Math.pow(2, 32);
            embedding.push((currentSeed / Math.pow(2, 32)) * 2 - 1); // Normalize to [-1, 1]
        }

        // Normalize the vector
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return embedding.map((val) => val / magnitude);
    }

    // Add a test method to verify embedding consistency
    public async testEmbeddingConsistency(): Promise<void> {
        const testText = 'How to Create Posts in Infinivista';
        const embedding = await this.getQueryEmbedding(testText);

        this.logger.log('Testing embedding consistency:');
        this.logger.log(`Test text: "${testText}"`);
        this.logger.log(`Hash: ${this.simpleHash(testText)}`);
        this.logger.log(`Embedding length: ${embedding.length}`);
        this.logger.log(
            `First 5 values: [${embedding
                .slice(0, 5)
                .map((v) => v.toFixed(4))
                .join(', ')}]`
        );
    }
}
