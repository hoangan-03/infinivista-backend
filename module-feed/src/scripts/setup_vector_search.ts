/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as dotenv from 'dotenv';
import {GoogleAuth} from 'google-auth-library';

// Load environment variables
dotenv.config();

export class VectorSearchSetup {
    private auth: GoogleAuth;
    private projectId: string;
    private location: string;
    private endpointUrl: string;

    constructor() {
        this.auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
        this.projectId = process.env.GCP_PROJECT_ID!;
        this.location = process.env.GCP_REGION!;
        this.endpointUrl = `https://${this.location}-aiplatform.googleapis.com/v1`;
    }

    async setupVectorSearch(): Promise<void> {
        console.log('🚀 Setting up Vertex AI Vector Search...');

        try {
            // Step 1: Create Index
            const indexName = await this.createIndex();
            console.log(`✅ Index created: ${indexName}`);

            // Step 2: Create Index Endpoint
            const endpointName = await this.createIndexEndpoint();
            console.log(`✅ Index Endpoint created: ${endpointName}`);

            // Extract endpoint ID for env variables
            const endpointId = endpointName.split('/').pop();

            console.log('\n📝 Environment Variables (add to your .env file):');
            console.log('='.repeat(60));
            console.log(`VECTOR_SEARCH_ENDPOINT=${endpointName}`);
            console.log(`VERTEX_AI_VECTOR_SEARCH_INDEX_ENDPOINT_ID=${endpointId}`);
            console.log(`VERTEX_AI_VECTOR_SEARCH_DEPLOYED_INDEX_ID=infinivista_knowledge_deployed`);
            console.log('='.repeat(60));

            // Step 3: Deploy Index to Endpoint (this takes a long time)
            await this.deployIndex(indexName, endpointName);

            // Step 4: Import data instructions
            await this.importData(indexName);

            console.log('\n🎉 Vector Search setup completed!');
            console.log(`Index Name: ${indexName}`);
            console.log(`Endpoint Name: ${endpointName}`);
        } catch (error) {
            console.error('❌ Error setting up Vector Search:', error);
            throw error;
        }
    }

    private async createIndex(): Promise<string> {
        const authClient = await this.auth.getClient();
        const accessToken = await authClient.getAccessToken();

        const indexDisplayName = 'infinivista-knowledge-index';
        const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/indexes`;

        const indexConfig = {
            displayName: indexDisplayName,
            description: 'Infinivista Knowledge Base Vector Index',
            metadata: {
                config: {
                    dimensions: 768,
                    approximateNeighborsCount: 150,
                    distanceMeasureType: 'DOT_PRODUCT_DISTANCE',
                    featureNormType: 'UNIT_L2_NORM',
                    algorithmConfig: {
                        bruteForceConfig: {},
                    },
                },
            },
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(indexConfig),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create index: ${response.status} - ${errorText}`);
        }

        const operation: any = await response.json();
        console.log('Index creation operation started:', operation.name);

        // Wait for operation to complete
        const indexName = await this.waitForOperation(operation.name);
        return indexName;
    }

    private async createIndexEndpoint(): Promise<string> {
        const authClient = await this.auth.getClient();
        const accessToken = await authClient.getAccessToken();

        const endpointDisplayName = 'infinivista-knowledge-endpoint';
        const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/indexEndpoints`;

        const endpointConfig = {
            displayName: endpointDisplayName,
            description: 'Infinivista Knowledge Base Vector Search Endpoint',
            publicEndpointEnabled: true,
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(endpointConfig),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create index endpoint: ${response.status} - ${errorText}`);
        }

        const operation: any = await response.json();
        console.log('Index endpoint creation operation started:', operation.name);

        // Wait for operation to complete
        const endpointName = await this.waitForOperation(operation.name);
        return endpointName;
    }

    private async deployIndex(indexName: string, endpointName: string): Promise<void> {
        const authClient = await this.auth.getClient();
        const accessToken = await authClient.getAccessToken();

        const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/${endpointName}:deployIndex`;

        const deployConfig = {
            deployedIndex: {
                id: 'infinivista_knowledge_deployed',
                index: indexName,
                displayName: 'Infinivista Knowledge Deployed Index',
                automaticResources: {
                    minReplicaCount: 1,
                    maxReplicaCount: 1,
                },
            },
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(deployConfig),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to deploy index: ${response.status} - ${errorText}`);
        }

        const operation: any = await response.json();
        console.log('Index deployment operation started:', operation.name);
        console.log('\n📋 IMPORTANT: Index deployment typically takes 10-30 minutes.');
        console.log('🔄 You can check the deployment status in Google Cloud Console:');
        console.log(
            `   https://console.cloud.google.com/vertex-ai/matching-engine/index-endpoints?project=${this.projectId}`
        );

        // Try to wait for a reasonable time, then provide instructions to continue
        try {
            await this.waitForOperation(operation.name, 5);
            console.log('✅ Index deployment completed!');
        } catch (error: any) {
            if (error.message.includes('timed out')) {
                console.log('\n⏰ Deployment is still in progress (this is normal).');
                console.log('📝 Your environment variables are ready:');
                console.log('='.repeat(60));

                const endpointId = endpointName.split('/').pop();
                console.log(`VECTOR_SEARCH_ENDPOINT=${endpointName}`);
                console.log(`VERTEX_AI_VECTOR_SEARCH_INDEX_ENDPOINT_ID=${endpointId}`);
                console.log(`VERTEX_AI_VECTOR_SEARCH_DEPLOYED_INDEX_ID=infinivista_knowledge_deployed`);

                console.log('='.repeat(60));
                console.log('\n✨ You can start using the RAG service once deployment completes.');
                console.log(
                    '🔍 Check deployment status at: https://console.cloud.google.com/vertex-ai/matching-engine'
                );

                // Don't throw the error, just continue
                return;
            }
            throw error;
        }
    }

    private async importData(_indexName: string): Promise<void> {
        console.log('📤 Setting up data import for Vector Search index...');

        console.log('\n📋 IMPORTANT: To complete the setup, you need to import vector data:');
        console.log('   1. Ensure your knowledge base data is prepared:');
        console.log('      npm run ts-node src/scripts/prepare_knowledge_base.ts');
        console.log('   2. Import the data to Vector Search:');
        console.log('      npm run ts-node src/scripts/import_vector_data.ts');

        console.log('\n⚠️  The Vector Search index is deployed but empty until you import data.');
        console.log('   Queries will return "UNIMPLEMENTED" errors until data is imported.');

        console.log('\n📊 After import completion:');
        console.log('   - Index will be searchable (10-30 minutes)');
        console.log('   - RAG service will return proper responses');
        console.log('   - Check status in Google Cloud Console');
    }

    private async waitForOperation(operationName: string, timeoutMinutes: number = 5): Promise<string> {
        const authClient = await this.auth.getClient();
        const timeoutMs = timeoutMinutes * 60 * 1000;
        const startTime = Date.now();

        console.log(`⏳ Waiting up to ${timeoutMinutes} minutes for operation to complete...`);

        while (Date.now() - startTime < timeoutMs) {
            const accessToken = await authClient.getAccessToken();
            const response = await fetch(`https://${this.location}-aiplatform.googleapis.com/v1/${operationName}`, {
                headers: {
                    Authorization: `Bearer ${accessToken.token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to check operation status: ${response.status}`);
            }

            const operation: any = await response.json();

            if (operation.done) {
                if (operation.error) {
                    throw new Error(`Operation failed: ${JSON.stringify(operation.error)}`);
                }

                // Return the resource name from the response
                return operation.response?.name || operation.name;
            }

            const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
            const remainingSeconds = Math.round((timeoutMs - (Date.now() - startTime)) / 1000);

            console.log(`⏳ Operation in progress... (${elapsedSeconds}s elapsed, ~${remainingSeconds}s remaining)`);
            await this.delay(30000);
        }

        throw new Error(`Operation timed out after ${timeoutMinutes} minutes`);
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

if (require.main === module) {
    const setup = new VectorSearchSetup();
    setup
        .setupVectorSearch()
        .then(() => {
            console.log('✅ Vector Search setup completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Vector Search setup failed:', error);
            process.exit(1);
        });
}
