export class RagQueryDto {
    query: string;

    maxChunks?: number = 3;
    category?: string;
}

export class RagResponseDto {
    success: boolean;

    data?: {
        query: string;
        answer: string;
        timestamp: string;
        chunksUsed: number;
    };

    error?: string;
}
