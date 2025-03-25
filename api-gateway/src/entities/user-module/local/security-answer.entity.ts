import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, MaxLength} from 'class-validator';

import {BaseEntity} from '../../base/base-class';
import {SecurityQuestion} from './security-question.entity';
import {User} from './user.entity';

export class SecurityAnswer extends BaseEntity {
    @ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Unique identifier for the security answer',
    })
    id: string;

    @ApiProperty({
        example: 'Smith',
        description: "User's answer to the security question",
    })
    @IsNotEmpty({message: 'Answer must not be empty'})
    @MaxLength(255, {message: 'Answer must be shorter than 255 characters'})
    answer: string;

    @ApiProperty({
        type: () => SecurityQuestion,
        description: 'The related security question',
    })
    question: SecurityQuestion;

    question_id: string;

    @ApiProperty({
        type: () => User,
        description: 'The user who answered the question',
    })
    user: User;

    user_id: string;
}
