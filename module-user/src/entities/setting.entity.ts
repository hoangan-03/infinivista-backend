import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "@/entities/user.entity";
import { BaseEntity } from "@/entities/base-class";
import { SettingType } from "@/modules/user/enums/setting.enum";

@Entity({ name: "settings" })
export class Setting extends BaseEntity {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "Setting unique identifier"
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User, (user) => user.settings, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "uuid" })
  user_id: string;
 
  @ApiProperty({
    enum: SettingType,
    example: SettingType.NOTIFICATION,
    description: "Setting type"
  })
  @Column({
    type: "enum",
    enum: SettingType,
  })
  type: SettingType;

  @ApiProperty({
    example: "true",
    description: "Setting value"
  })
  @Column({ type: "text" })
  value: string;
}