import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base-class';
import {User} from '@/entities/user.entity';
import {SettingType} from '@/modules/user/enums/setting.enum';

@Entity({name: 'settings'})
export class Setting extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.settings, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({name: 'user_id'})
    user: User;

    @Column({type: 'uuid'})
    user_id: string;

    @Column({
        type: 'enum',
        enum: SettingType,
    })
    type: SettingType;

    @Column({type: 'text'})
    value: string;
}
