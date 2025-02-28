import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "@/entities/user.entity";
import { BaseEntity } from "@/entities/base-class";

@Entity({ name: "user_status" })
export class UserStatus extends BaseEntity {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "User status unique identifier"
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ type: () => User })
  @OneToOne(() => User, (user) => user.status, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "uuid" })
  user_id: string;

  @ApiProperty({
    example: false,
    description: "User online status"
  })
  @Column({ type: "boolean", default: false })
  isOnline: boolean;

  @ApiProperty({
    example: false,
    description: "User suspension status"
  })
  @Column({ type: "boolean", default: false })
  isSuspended: boolean;

  @ApiProperty({
    example: false,
    description: "User deletion status"
  })
  @Column({ type: "boolean", default: false })
  isDeleted: boolean;
}