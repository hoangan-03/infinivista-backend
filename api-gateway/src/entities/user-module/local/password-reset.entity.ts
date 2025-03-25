import {ApiProperty} from '@nestjs/swagger';

export class PasswordReset {
    @ApiProperty({
        description: 'Unique identifier for the password reset request',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'Email address for the user requesting password reset',
        example: 'user@example.com',
    })
    email: string;

    @ApiProperty({
        description: 'Secure token for password reset verification',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    token: string;

    @ApiProperty({
        description: 'Type of password reset',
        enum: ['STANDARD', 'SECURITY_QUESTION', 'ADMIN_RESET'],
        example: 'STANDARD',
    })
    type: PasswordReset;

    @ApiProperty({
        description: 'When the reset request was created',
        example: '2023-01-01T12:00:00Z',
    })
    created_at: Date;
}
