import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, MaxLength } from "class-validator";
import { SecurityAnswer } from "./security-answer.entity";

@Entity({ name: "security_questions" })
export class SecurityQuestion {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "Unique identifier for the security question",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    example: "What is your mother's maiden name?",
    description: "The text of the security question",
  })
  @Column({ type: "varchar", length: 255 })
  @IsNotEmpty({ message: "Question text must not be empty" })
  @MaxLength(255, { message: "Question text must be shorter than 255 characters" })
  question: string;

  @OneToMany(() => SecurityAnswer, (securityAnswer) => securityAnswer.question)
  answers: SecurityAnswer[];
}
