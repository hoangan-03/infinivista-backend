import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/local/base-class';
import {SocialLinkType} from '@/modules/user/enums/social-link.enum';

import {User} from './user.entity';

@Entity({name: 'social_links'})
export class SocialLink extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: SocialLinkType,
    })
    type: SocialLinkType;

    @Column({type: 'varchar', length: 255})
    link: string;

    @ManyToOne(() => User, (user) => user.socialLinks)
    user: User;

    @Column({type: 'uuid'})
    user_id: string;
}
