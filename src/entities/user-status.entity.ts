import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "@/entities/user.entity";
import { BaseEntity } from "@/entities/base-class";
import { SettingType } from "@/enum/setting.enum";

@Entity({ name: "user_status" })
export class UserStatus {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "User status unique identifier",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, (user) => user.settings, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "uuid" })
  user_id: string;

  @ApiProperty({
    example: false,
    description: "User online status",
    default: false,
  })
  @Column({ type: "boolean", default: false, nullable: true })
  isOnline: boolean;

  @ApiProperty({
    example: false,
    description: "User suspension status",
    default: false,
  })
  @Column({ type: "boolean", default: false, nullable: true })
  isSuspended: boolean;

  @ApiProperty({
    example: false,
    description: "User deletion status",
    default: false,
  })
  @Column({ type: "boolean", default: false, nullable: true })
  isDeleted: boolean;
  // for soft delete
}
