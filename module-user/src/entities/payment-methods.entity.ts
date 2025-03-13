import {IsNotEmpty, IsOptional, IsString, Length} from 'class-validator';
import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base-class';
import {PaymentMethodType} from '@/modules/user/enums/payment-method.enum';

@Entity({name: 'payment_methods'})
export class PaymentMethods extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: PaymentMethodType,
        default: PaymentMethodType.PAYPAL,
    })
    @IsNotEmpty({message: 'Payment method must not be empty'})
    payment_method: PaymentMethodType;

    @Column({type: 'varchar', length: 4, nullable: true})
    @IsOptional()
    @Length(4, 4, {message: 'Card last four must be exactly 4 digits'})
    card_last_four?: string;

    @Column({type: 'varchar', length: 255, nullable: true})
    @IsOptional()
    @IsString()
    payment_token?: string;

    @Column({type: 'varchar', length: 5, nullable: true})
    @IsOptional()
    @Length(5, 5, {message: 'Card expiration date must be in MM/YY format'})
    card_expiration_date?: string;
}
