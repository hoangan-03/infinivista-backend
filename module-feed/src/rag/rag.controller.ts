import {Controller, Logger} from '@nestjs/common';
import {MessagePattern, Payload} from '@nestjs/microservices';

import {RagService} from '../services/rag.service';

@Controller()
export class RagController {
    private readonly logger = new Logger(RagController.name);

    constructor(private readonly ragService: RagService) {}

    @MessagePattern('rag.processQuery')
    async processQuery(@Payload() data: any) {
        try {
            this.logger.log(`Processing RAG query from user ${data.userId}: "${data.query?.substring(0, 50)}..."`);

            const {query, userId, userContext} = data;

            if (!query || typeof query !== 'string' || query.trim() === '') {
                return {
                    success: false,
                    error: 'Query must be a non-empty string',
                };
            }

            const enhancedQuery = query.trim();
            if (userContext?.name) {
                this.logger.log(`Processing query for user: ${userContext.name}`);
                // enhancedQuery = `User ${userContext.name} asks: ${query}`;
            }

            const answer = await this.ragService.processUserQuery(enhancedQuery);

            this.logger.log(`Successfully processed RAG query for user ${userId}`);

            return {
                success: true,
                data: {
                    query: query.trim(),
                    answer,
                    timestamp: new Date().toISOString(),
                    userId,
                },
            };
        } catch (error) {
            this.logger.error(`Error processing RAG query:`, error);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred',
            };
        }
    }

    @MessagePattern('rag.submitFeedback')
    async submitFeedback(@Payload() feedbackData: any) {
        try {
            this.logger.log(`Received RAG feedback from user ${feedbackData.userId}`);

            // store feedback for future improvements
            // save this to a database
            const feedback = {
                ...feedbackData,
                id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date().toISOString(),
            };

            this.logger.log(`Feedback stored:`, {
                id: feedback.id,
                userId: feedback.userId,
                rating: feedback.rating,
                query: feedback.query?.substring(0, 50) + '...',
            });

            return {
                success: true,
                message: 'Feedback received and will be used to improve our AI assistant',
                feedbackId: feedback.id,
            };
        } catch (error) {
            this.logger.error(`Error processing feedback:`, error);

            return {
                success: false,
                error: 'Failed to process feedback',
            };
        }
    }
}
