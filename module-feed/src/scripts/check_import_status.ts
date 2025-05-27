/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as dotenv from 'dotenv';
import {GoogleAuth} from 'google-auth-library';

dotenv.config();

export class ImportStatusChecker {
    private auth: GoogleAuth;
    private projectId: string;
    private location: string;

    constructor() {
        this.auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
        this.projectId = process.env.GCP_PROJECT_ID!;
        this.location = process.env.GCP_REGION!;
    }

    async checkStatus(): Promise<void> {
        console.log('🔍 Checking Vector Search import status...');

        try {
            // Check index status
            await this.checkIndexStatus();

            // Check recent operations - with better error handling
            await this.checkRecentOperationsDetailed();

            // Check specific operation if provided
            const args = process.argv.slice(2);
            const operationId = args.find((arg) => arg.startsWith('op:'))?.replace('op:', '');
            if (operationId) {
                await this.checkSpecificOperation(operationId);
            }
        } catch (error) {
            console.error('❌ Error checking status:', error);
        }
    }

    private async checkIndexStatus(): Promise<void> {
        const authClient = await this.auth.getClient();
        const accessToken = await authClient.getAccessToken();

        const indexId = '1724289319050412032';
        const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/indexes/${indexId}`;

        const response = await fetch(endpoint, {
            headers: {
                Authorization: `Bearer ${accessToken.token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get index status: ${response.status}`);
        }

        const index: any = await response.json();

        console.log('\n📊 INDEX STATUS:');
        console.log('='.repeat(50));
        console.log(`Name: ${index.displayName}`);
        console.log(`State: ${index.indexStats?.vectorsCount ? '✅ Has Data' : '⚠️  No Data Yet'}`);
        console.log(`Vectors Count: ${index.indexStats?.vectorsCount || 0}`);
        console.log(`Created: ${new Date(index.createTime).toLocaleString()}`);
        console.log(`Updated: ${new Date(index.updateTime).toLocaleString()}`);

        if (index.indexStats?.vectorsCount > 0) {
            console.log('🎉 Index has data! Import completed successfully.');
            console.log(`Expected: 14 vectors, Current: ${index.indexStats.vectorsCount}`);

            if (index.indexStats.vectorsCount < 14) {
                console.log('⚠️  Import may be incomplete - expected 14 vectors but found fewer');
            }
        } else {
            console.log('⏳ Index is empty. Import may still be in progress.');
        }
    }

    private async checkRecentOperationsDetailed(): Promise<void> {
        const authClient = await this.auth.getClient();
        const accessToken = await authClient.getAccessToken();

        const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/operations`;

        console.log('\n🔄 CHECKING OPERATIONS:');
        console.log('='.repeat(50));

        // Try different filters to find operations
        const filters = [
            '', // All operations
            'metadata.@type="type.googleapis.com/google.cloud.aiplatform.v1.UpdateIndexOperationMetadata"',
            'metadata.@type="type.googleapis.com/google.cloud.aiplatform.v1.CreateIndexOperationMetadata"',
        ];

        for (const filter of filters) {
            try {
                const filterUrl = filter ? `${endpoint}?filter=${encodeURIComponent(filter)}` : endpoint;
                console.log(`\n📋 Checking operations${filter ? ' with filter' : ' (all)'}...`);

                const response = await fetch(filterUrl, {
                    headers: {
                        Authorization: `Bearer ${accessToken.token}`,
                    },
                });

                if (response.ok) {
                    const operations: any = await response.json();

                    if (operations.operations?.length > 0) {
                        console.log(`Found ${operations.operations.length} operations`);

                        // Show the most recent 5 operations
                        const recentOps = operations.operations
                            .slice(0, 5)
                            .sort(
                                (a: any, b: any) =>
                                    new Date(b.metadata?.createTime || b.metadata?.updateTime || 0).getTime() -
                                    new Date(a.metadata?.createTime || a.metadata?.updateTime || 0).getTime()
                            );

                        for (const op of recentOps) {
                            this.displayOperationDetails(op);
                        }
                        break; // Found operations, no need to try other filters
                    } else {
                        console.log('No operations found with this filter');
                    }
                } else {
                    console.log(`Failed to fetch operations: ${response.status}`);
                }
            } catch (error) {
                console.log(`Error with filter: ${error}`);
            }
        }
    }

    private displayOperationDetails(op: any): void {
        const status = op.done ? '✅ Complete' : '⏳ In Progress';
        const startTime = new Date(op.metadata?.createTime || op.metadata?.updateTime).toLocaleString();
        const opType = this.getOperationType(op);
        const duration = this.calculateDuration(op);

        console.log(`\n${status} | ${opType} | Started: ${startTime}${duration ? ` | Duration: ${duration}` : ''}`);
        console.log(`   📍 Operation: ${op.name}`);

        if (!op.done) {
            console.log('   🔄 This operation is still running...');

            // Show progress if available
            if (op.metadata?.progressMessage) {
                console.log(`   📋 Progress: ${op.metadata.progressMessage}`);
            }

            if (op.metadata?.partialFailures?.length > 0) {
                console.log(`   ⚠️  Partial failures: ${op.metadata.partialFailures.length}`);
            }
        }

        if (op.error) {
            console.log(`   ❌ Error: ${op.error.message}`);
            if (op.error.details) {
                console.log(`   📝 Details: ${JSON.stringify(op.error.details, null, 2)}`);
            }
        }

        if (op.response && op.done) {
            console.log(`   ✅ Completed successfully`);
        }
    }

    private getOperationType(op: any): string {
        const metadataType = op.metadata?.['@type'] || '';

        if (metadataType.includes('UpdateIndex')) return 'Index Update/Import';
        if (metadataType.includes('CreateIndex')) return 'Index Creation';
        if (metadataType.includes('DeployIndex')) return 'Index Deployment';
        if (metadataType.includes('UndeployIndex')) return 'Index Undeployment';

        return 'Unknown Operation';
    }

    private calculateDuration(op: any): string | null {
        const startTime = op.metadata?.createTime;
        const endTime = op.metadata?.updateTime || (op.done ? new Date().toISOString() : null);

        if (!startTime) return null;

        const start = new Date(startTime).getTime();
        const end = endTime ? new Date(endTime).getTime() : Date.now();

        const durationMs = end - start;
        const minutes = Math.floor(durationMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else {
            return `${minutes}m`;
        }
    }

    private async checkSpecificOperation(operationId: string): Promise<void> {
        console.log(`\n🔍 CHECKING SPECIFIC OPERATION: ${operationId}`);
        console.log('='.repeat(50));

        try {
            const authClient = await this.auth.getClient();
            const accessToken = await authClient.getAccessToken();

            const operationUrl = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/operations/${operationId}`;

            const response = await fetch(operationUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken.token}`,
                },
            });

            if (response.ok) {
                const operation = await response.json();
                this.displayOperationDetails(operation);
            } else {
                console.log(`Failed to fetch operation: ${response.status}`);
            }
        } catch (error) {
            console.log(`Error checking operation: ${error}`);
        }
    }

    async waitForCompletion(maxWaitMinutes: number = 60): Promise<void> {
        console.log(`⏰ Monitoring import progress for up to ${maxWaitMinutes} minutes...`);

        const checkInterval = 3 * 60 * 1000; // Check every 3 minutes for long operations
        const maxChecks = maxWaitMinutes / 3;

        for (let i = 0; i < maxChecks; i++) {
            console.log(`\n📋 Check ${i + 1}/${maxChecks} (${new Date().toLocaleString()})`);

            try {
                await this.checkIndexStatus();
                await this.checkRecentOperationsDetailed();

                // Check if we have the expected number of vectors
                const authClient = await this.auth.getClient();
                const accessToken = await authClient.getAccessToken();
                const indexId = '1724289319050412032';
                const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/indexes/${indexId}`;

                const response = await fetch(endpoint, {
                    headers: {Authorization: `Bearer ${accessToken.token}`},
                });

                if (response.ok) {
                    const index: any = await response.json();
                    if (index.indexStats?.vectorsCount >= 14) {
                        console.log('🎉 Import completed! Vector Search index now has all expected data.');
                        return;
                    } else if (index.indexStats?.vectorsCount > 0) {
                        console.log(`⏳ Partial import: ${index.indexStats.vectorsCount}/14 vectors imported`);
                    }
                }
            } catch (error) {
                console.log('⚠️  Error during check:', error);
            }

            if (i < maxChecks - 1) {
                console.log(`⏳ Waiting 3 minutes before next check...`);
                await new Promise((resolve) => setTimeout(resolve, checkInterval));
            }
        }

        console.log(`⏰ Monitoring timeout after ${maxWaitMinutes} minutes.`);
        console.log('🔍 Check Google Cloud Console Activity tab for more details:');
        console.log(`   https://console.cloud.google.com/vertex-ai/operations?project=${this.projectId}`);
    }

    async debugVectorData(): Promise<void> {
        console.log('🔍 Debugging vector data and embeddings...');

        // Check what we prepared
        const dataPath = require('path').join(process.cwd(), 'data', 'infinivista-vector-data.json');
        if (require('fs').existsSync(dataPath)) {
            console.log('\n📄 Checking prepared data file...');
            const content = require('fs').readFileSync(dataPath, 'utf-8');
            const lines = content.trim().split('\n');

            console.log(`Found ${lines.length} entries in prepared data:`);

            lines.slice(0, 3).forEach((line, index) => {
                const entry = JSON.parse(line);
                console.log(`\nEntry ${index + 1}:`);
                console.log(`  ID: ${entry.id}`);
                console.log(`  Embedding length: ${entry.embedding.length}`);
                console.log(
                    `  First 3 embedding values: [${entry.embedding
                        .slice(0, 3)
                        .map((v) => v.toFixed(4))
                        .join(', ')}]`
                );

                if (entry.restricts) {
                    console.log(`  Category: ${entry.restricts[0]?.allowList?.[0] || 'none'}`);
                }
            });
        }

        // Test embedding generation for the exact query
        console.log('\n🧪 Testing embedding generation for query...');
        const testQuery = 'How to Create Posts in Infinivista';
        const hash = this.simpleHash(testQuery);
        const embedding = this.generateDeterministicEmbedding(hash, 768);

        console.log(`Query: "${testQuery}"`);
        console.log(`Hash: ${hash}`);
        console.log(
            `Embedding first 3 values: [${embedding
                .slice(0, 3)
                .map((v) => v.toFixed(4))
                .join(', ')}]`
        );
    }

    private simpleHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
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
}

// CLI interface
if (require.main === module) {
    const checker = new ImportStatusChecker();

    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'debug') {
        checker
            .debugVectorData()
            .then(() => {
                console.log('✅ Debug completed');
                process.exit(0);
            })
            .catch((error) => {
                console.error('❌ Debug failed:', error);
                process.exit(1);
            });
    } else if (command === 'watch') {
        const waitMinutes = parseInt(args[1]) || 60; // Default to 60 minutes for long operations
        checker
            .waitForCompletion(waitMinutes)
            .then(() => {
                console.log('✅ Monitoring completed');
                process.exit(0);
            })
            .catch((error) => {
                console.error('❌ Monitoring failed:', error);
                process.exit(1);
            });
    } else {
        checker
            .checkStatus()
            .then(() => {
                console.log('\n✅ Status check completed');
                console.log('\n💡 Tips:');
                console.log(
                    '• Use "npm run ts-node src/scripts/check_import_status.ts watch 90" for extended monitoring'
                );
                console.log('• Check Google Cloud Console Activity tab for real-time updates');
                console.log('• Large imports can take 1-2 hours in some cases');
                process.exit(0);
            })
            .catch((error) => {
                console.error('❌ Status check failed:', error);
                process.exit(1);
            });
    }
}
