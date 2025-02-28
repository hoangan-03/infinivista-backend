import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from "class-validator";
import { BaseEntity } from "@/entities/base-class";
import { PaymentMethodType } from "@/modules/user/enums/payment-method.enum";

@Entity({ name: "payment_methods" })
export class PaymentMethods extends BaseEntity {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "Unique identifier for the payment method",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    enum: PaymentMethodType,
    example: PaymentMethodType.PAYPAL,
    description: "Type of payment method",
  })
  @Column({
    type: "enum",
    enum: PaymentMethodType,
    default: PaymentMethodType.PAYPAL,
  })
  @IsNotEmpty({ message: "Payment method must not be empty" })
  payment_method: PaymentMethodType;

  @ApiProperty({
    example: "4242",
    description: "Last four digits of the card",
    required: false,
  })
  @Column({ type: "varchar", length: 4, nullable: true })
  @IsOptional()
  @Length(4, 4, { message: "Card last four must be exactly 4 digits" })
  card_last_four?: string;

  @ApiProperty({
    example: "tok_visa_12345",
    description: "Payment gateway token",
    required: false,
  })
  @Column({ type: "varchar", length: 255, nullable: true })
  @IsOptional()
  @IsString()
  payment_token?: string;

  @ApiProperty({
    example: "12/25",
    description: "Card expiration date (MM/YY)",
    required: false,
  })
  @Column({ type: "varchar", length: 5, nullable: true })
  @IsOptional()
  @Length(5, 5, { message: "Card expiration date must be in MM/YY format" })
  card_expiration_date?: string;
}
