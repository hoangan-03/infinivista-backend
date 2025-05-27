import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsString} from 'class-validator';

export class RagQueryDto {
    @ApiProperty({
        description: 'User query to process with RAG system',
        example: 'What are the latest features in our social media platform?',
    })
    @IsString()
    @IsNotEmpty()
    query: string;
}

export class RagResponseDto {
    @ApiProperty({
        description: 'Whether the request was successful',
        example: true,
    })
    success: boolean;

    @ApiProperty({
        description: 'Response data containing the RAG result',
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Original user query',
                example: 'What are the latest features?',
            },
            answer: {
                type: 'string',
                description: 'AI-generated answer based on knowledge base',
                example: 'Based on the available information, here are the latest features...',
            },
            timestamp: {
                type: 'string',
                description: 'Timestamp of the response',
                example: '2024-01-01T00:00:00.000Z',
            },
        },
    })
    data: {
        query: string;
        answer: string;
        timestamp: string;
    };
}

export class RagErrorResponseDto {
    @ApiProperty({
        description: 'Whether the request was successful',
        example: false,
    })
    success: boolean;

    @ApiProperty({
        description: 'Error message',
        example: 'Query cannot be empty',
    })
    error: string;
}
