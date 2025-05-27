import {Body, Controller, HttpException, HttpStatus, Inject, Post, UseGuards} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {lastValueFrom} from 'rxjs';

import {CurrentUser} from '@/decorators/user.decorator';
import {RagErrorResponseDto, RagQueryDto, RagResponseDto} from '@/dtos/feed-module/rag.dto';
import {JWTAuthGuard} from '@/guards/jwt-auth.guard';

@ApiTags('RAG - AI Knowledge Assistant')
@Controller('rag')
@UseGuards(JWTAuthGuard)
@ApiBearerAuth()
export class RagController {
    constructor(@Inject('FEED_SERVICE') private readonly feedService: ClientProxy) {}

    @Post('query')
    @ApiOperation({
        summary: 'Process RAG Query',
        description: `
        Process a user query using RAG (Retrieval-Augmented Generation) to provide intelligent responses 
        based on your social media platform's knowledge base. This endpoint uses AI to understand your 
        question and provide relevant, contextual answers from the available documentation and data.
        
        **Features:**
        - Natural language query processing
        - Context-aware responses
        - Knowledge base integration
        - Real-time AI-powered assistance
        
        **Use Cases:**
        - Get help with platform features
        - Ask questions about functionality
        - Receive personalized assistance
        - Access contextual information
        `,
    })
    @ApiBody({
        type: RagQueryDto,
        description: 'User query to process with the RAG system',
        examples: {
            'feature-query': {
                summary: 'Platform Features Query',
                description: 'Ask about platform features and capabilities',
                value: {
                    query: 'What are the latest features in our social media platform?',
                },
            },
            'how-to-query': {
                summary: 'How-to Query',
                description: 'Get step-by-step instructions',
                value: {
                    query: 'How do I create a new post with images?',
                },
            },
            'technical-query': {
                summary: 'Technical Query',
                description: 'Ask technical questions about the platform',
                value: {
                    query: 'What privacy settings are available for my posts?',
                },
            },
            troubleshooting: {
                summary: 'Troubleshooting Query',
                description: 'Get help with issues or problems',
                value: {
                    query: 'Why am I not receiving notifications?',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Query processed successfully and AI response generated',
        type: RagResponseDto,
        examples: {
            'successful-response': {
                summary: 'Successful RAG Response',
                value: {
                    success: true,
                    data: {
                        query: 'What are the latest features in our social media platform?',
                        answer: 'Based on the available information, here are the latest features in our social media platform:\n\n1. **Enhanced Stories**: Create interactive stories with polls, questions, and reactions\n2. **AI-Powered Feed**: Personalized content recommendations using machine learning\n3. **Advanced Privacy Controls**: Granular settings for post visibility and data sharing\n4. **Group Collaboration**: Tools for team projects and community building\n5. **Real-time Messaging**: Instant communication with typing indicators and read receipts\n\nThese features are designed to enhance user engagement and provide a more personalized social media experience.',
                        timestamp: '2025-05-27T10:30:00.000Z',
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request - Invalid query or missing parameters',
        type: RagErrorResponseDto,
        examples: {
            'empty-query': {
                summary: 'Empty Query Error',
                value: {
                    success: false,
                    error: 'Query cannot be empty',
                },
            },
            'invalid-format': {
                summary: 'Invalid Format Error',
                value: {
                    success: false,
                    error: 'Query must be a valid string',
                },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Authentication required',
        schema: {
            type: 'object',
            properties: {
                statusCode: {type: 'number', example: 401},
                message: {type: 'string', example: 'Unauthorized'},
            },
        },
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error - RAG processing failed',
        type: RagErrorResponseDto,
        examples: {
            'processing-error': {
                summary: 'Processing Error',
                value: {
                    success: false,
                    error: 'Sorry, I encountered an error while processing your request. Please try again later.',
                },
            },
            'service-unavailable': {
                summary: 'Service Unavailable',
                value: {
                    success: false,
                    error: 'RAG service is temporarily unavailable. Please try again in a few moments.',
                },
            },
        },
    })
    async processQuery(@Body() ragQueryDto: RagQueryDto, @CurrentUser() user: any) {
        try {
            const {query} = ragQueryDto;

            if (!query || query.trim() === '') {
                throw new HttpException(
                    {
                        success: false,
                        error: 'Query cannot be empty',
                    },
                    HttpStatus.BAD_REQUEST
                );
            }

            const contextualQuery = {
                query: query.trim(),
                userId: user.id,
                userContext: {
                    name: user.name,
                    // other relevant user context
                },
            };

            // Send query to module-feed RAG service
            const response = await lastValueFrom(this.feedService.send('rag.processQuery', contextualQuery));

            return response;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            console.error('RAG Query Error:', error);

            throw new HttpException(
                {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'An unexpected error occurred while processing your query. Please try again later.',
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post('feedback')
    @ApiOperation({
        summary: 'Provide Feedback on RAG Response',
        description: `
        Submit feedback on the quality and relevance of a RAG response. This helps improve 
        the AI system's performance and accuracy over time.
        `,
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Original query that was asked',
                    example: 'How do I create a post?',
                },
                answer: {
                    type: 'string',
                    description: 'The answer that was provided',
                },
                rating: {
                    type: 'number',
                    minimum: 1,
                    maximum: 5,
                    description: 'Rating from 1 (poor) to 5 (excellent)',
                    example: 4,
                },
                feedback: {
                    type: 'string',
                    description: 'Optional detailed feedback',
                    example: 'The answer was helpful but could include more specific steps.',
                },
            },
            required: ['query', 'answer', 'rating'],
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Feedback submitted successfully',
        schema: {
            type: 'object',
            properties: {
                success: {type: 'boolean', example: true},
                message: {type: 'string', example: 'Thank you for your feedback!'},
            },
        },
    })
    async submitFeedback(@Body() feedbackDto: any, @CurrentUser() user: any) {
        try {
            const feedbackData = {...feedbackDto, userId: user.id, timestamp: new Date().toISOString()};

            await lastValueFrom(this.feedService.send('rag.submitFeedback', feedbackData));

            return {
                success: true,
                message: 'Thank you for your feedback! It helps us improve our AI assistant.',
            };
        } catch (error) {
            console.error('RAG Feedback Error:', error);
            throw new HttpException(
                {
                    success: false,
                    error: 'Failed to submit feedback. Please try again later.',
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
