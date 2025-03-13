import {IsNotEmpty, MaxLength} from 'class-validator';
import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';

import {SecurityAnswer} from './security-answer.entity';

@Entity({name: 'security_questions'})
export class SecurityQuestion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'varchar', length: 255})
    @IsNotEmpty({message: 'Question text must not be empty'})
    @MaxLength(255, {message: 'Question text must be shorter than 255 characters'})
    question: string;

    @OneToMany(() => SecurityAnswer, (securityAnswer) => securityAnswer.question)
    answers: SecurityAnswer[];
}
