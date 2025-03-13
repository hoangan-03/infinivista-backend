import {IsNotEmpty, MaxLength} from 'class-validator';
import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base-class';
import {User} from '@/entities/user.entity';

import {SecurityQuestion} from './security-question.entity';

@Entity({name: 'security_answers'})
export class SecurityAnswer extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'varchar', length: 255})
    @IsNotEmpty({message: 'Answer must not be empty'})
    @MaxLength(255, {message: 'Answer must be shorter than 255 characters'})
    answer: string;

    @ManyToOne(() => SecurityQuestion, (question) => question.answers, {
        eager: true,
        cascade: true,
    })
    @JoinColumn({name: 'question_id'})
    question: SecurityQuestion;

    @Column({type: 'uuid'})
    question_id: string;

    @ManyToOne(() => User, (user) => user.securityAnswers, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({name: 'user_id'})
    user: User;

    @Column({type: 'uuid'})
    user_id: string;
}
