import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToOne,
  OneToMany,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcryptjs";
import { Exclude } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { Gender } from "@/modules/user/enums/gender.enum";
import { IsEnum, IsOptional } from "class-validator";
import { BaseEntity } from "@/entities/base-class";
import { Setting } from "./setting.entity";
import { SecurityAnswer } from "./security-answer.entity";
import { Address } from "./address.entity";

@Entity({ name: "users" })
export class User extends BaseEntity {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "User unique identifier",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string = uuidv4();

  @ApiProperty({
    example: "user@example.com",
    description: "User email address",
  })
  @Column({ type: "varchar", length: 255 })
  email: string;

  @ApiProperty({
    example: "johndoe",
    description: "User username",
  })
  @Column({ type: "varchar", length: 255 })
  username: string;

  @Exclude()
  @Column({ type: "varchar", length: 255})
  password?: string;

  @ApiProperty({
    example: "+1234567890",
    description: "User phone number",
    required: false,
  })
  @Column({ type: "varchar", length: 15, nullable: true })
  phoneNumber: string;

  @ApiProperty({
    example: "1990-01-01",
    description: "User date of birth",
    required: false,
  })
  @Column({ type: "date", nullable: true })
  dob: Date;

  @ApiProperty({
    enum: Gender,
    enumName: "Gender",
    example: Gender.MALE,
    description: "User gender",
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    example: "John",
    description: "User first name",
    required: false,
  })
  @Column({ type: "varchar", length: 255, nullable: true })
  firstName: string;

  @ApiProperty({
    example: "Doe",
    description: "User last name",
    required: false,
  })
  @Column({ type: "varchar", length: 255, nullable: true })
  lastName: string;

  @ApiProperty({
    example: "https://example.com/profile.jpg",
    description: "User profile image URL",
    required: false,
  })
  @Column({ type: "text", nullable: true })
  profileImageUrl: string;

  @ApiProperty({
    example: "https://example.com/cover.jpg",
    description: "User cover image URL",
    required: false,
  })
  @Column({ type: "text", nullable: true })
  coverImageUrl: string;

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
    type: () => [Setting],
    description: "User settings"
  })
  @OneToMany(() => Setting, (setting) => setting.user, {
    cascade: true
  })
  settings: Setting[];

  @ApiProperty({
    type: () => Address,
    description: "User's address",
  })
  @OneToOne(() => Address, (address) => address.user, {
    cascade: true,
  })
  address: Address;

  @OneToMany(() => SecurityAnswer, (securityAnswer) => securityAnswer.user)
  securityAnswers: SecurityAnswer[];

  constructor(data: Partial<User> = {}) {
    super();
    Object.assign(this, data);
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    const salt = await bcrypt.genSalt();
    if (this.password && !/^\$2[abxy]?\$\d+\$/.test(this.password)) {
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async checkPassword(plainPassword: string): Promise<boolean> {
    return this.password
      ? await bcrypt.compare(plainPassword, this.password)
      : false;
  }
}
