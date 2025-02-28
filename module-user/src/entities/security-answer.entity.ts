import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, MaxLength } from "class-validator";
import { BaseEntity } from "@/entities/base-class";
import { User } from "@/entities/user.entity";
import { SecurityQuestion } from "./security-question.entity";

@Entity({ name: "security_answers" })
export class SecurityAnswer extends BaseEntity {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "Unique identifier for the security answer",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    example: "Smith",
    description: "User's answer to the security question",
  })
  @Column({ type: "varchar", length: 255 })
  @IsNotEmpty({ message: "Answer must not be empty" })
  @MaxLength(255, { message: "Answer must be shorter than 255 characters" })
  answer: string;

  @ApiProperty({
    type: () => SecurityQuestion,
    description: "The related security question",
  })
  @ManyToOne(() => SecurityQuestion, (question) => question.answers, {
    eager: true,
    cascade: true
  })
  @JoinColumn({ name: "question_id" })
  question: SecurityQuestion;

  @Column({ type: "uuid" })
  question_id: string;

  @ApiProperty({
    type: () => User,
    description: "The user who answered the question",
  })
  @ManyToOne(() => User, (user) => user.securityAnswers, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: "user_id" })
  user: User;
    
  @Column({ type: "uuid" })
  user_id: string;
}
