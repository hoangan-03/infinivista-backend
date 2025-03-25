import {ApiProperty} from '@nestjs/swagger';

import {BaseEntity} from '../../base/base-class';
import {UserReference} from '../external/user.entity';
import {Post} from './post.entity';

export class Comment extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the comment',
        example: '550e8400-e29b-41d4-a716-446655440000',
        type: String,
    })
    id: string;

    @ApiProperty({
        description: 'Text content of the comment',
        example: 'This is a great post!',
        type: String,
    })
    text: string;

    @ApiProperty({
        description: 'Optional attachment URL for the comment',
        example: 'https://storage.infinivista.com/comments/image123.jpg',
        type: String,
        required: false,
    })
    attachment_url?: string;

    @ApiProperty({
        description: 'User who created the comment',
        type: () => UserReference,
    })
    user: UserReference;

    @ApiProperty({
        description: 'The post this comment belongs to',
        type: () => Post,
    })
    post: Post;
}
