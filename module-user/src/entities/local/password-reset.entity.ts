import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn} from 'typeorm';

import {PasswordResetEnum} from '@/modules/auth/enums/password-reset.enum';

@Entity({name: 'password_resets'})
export class PasswordReset {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'varchar', length: 255})
    email: string;

    @Column({type: 'varchar', length: 255})
    token: string;

    @Column({type: 'varchar', length: 20})
    type: PasswordResetEnum;

    @CreateDateColumn()
    created_at: Date;
}
