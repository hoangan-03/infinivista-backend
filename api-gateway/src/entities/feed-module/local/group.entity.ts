import {ApiProperty} from '@nestjs/swagger';
import {Column, Entity, JoinColumn, JoinTable, ManyToMany, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';
import {visibilityEnum} from '@/enums/feed-module/visibility.enum';

import {UserReference} from '../external/user.entity';
import {GroupRule} from './group-rule.entity';
import {NewsFeed} from './newsfeed.entity';

@Entity()
export class Group extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the group',
        example: '550e8400-e29b-41d4-a716-446655440000',
        readOnly: true,
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        description: 'Name of the group',
        example: 'Photography Enthusiasts',
        required: true,
    })
    @Column()
    name: string;

    @ApiProperty({
        description: 'Description of the group',
        example: 'A community for sharing photography tips, tricks, and amazing shots',
        required: false,
    })
    @Column({nullable: true, type: 'text'})
    description?: string;

    @ApiProperty({
        description: 'Rules that members must follow in the group',
        type: () => [GroupRule],
        isArray: true,
        required: false,
    })
    groupRules?: GroupRule[];

    @ApiProperty({
        description: "URL to the group's profile image",
        example: 'https://storage.infinivista.com/groups/profile/photo-group.jpg',
        required: false,
    })
    @Column({nullable: true})
    profileImageUrl?: string;

    @ApiProperty({
        description: "URL to the group's cover image",
        example: 'https://storage.infinivista.com/groups/cover/photography-banner.jpg',
        required: false,
    })
    @Column({nullable: true})
    coverImageUrl?: string;

    @ApiProperty({
        description: 'City associated with the group',
        example: 'New York',
        required: false,
    })
    @Column({nullable: true})
    city?: string;

    @ApiProperty({
        description: 'Country associated with the group',
        example: 'United States',
        required: false,
    })
    @Column({nullable: true})
    country?: string;

    @ApiProperty({
        description: 'Visibility settings for the group',
        enum: visibilityEnum,
        example: visibilityEnum.PUBLIC,
        required: true,
    })
    @Column({
        type: 'enum',
        enum: visibilityEnum,
        default: visibilityEnum.PUBLIC,
    })
    visibility: visibilityEnum;

    @ApiProperty({
        description: 'Associated news feed for the group',
        type: () => NewsFeed,
        required: false,
    })
    @OneToOne(() => NewsFeed, (newsFeed) => newsFeed.id, {nullable: true})
    @JoinColumn({name: 'news_feed_id'})
    newsFeed?: NewsFeed;

    @ApiProperty({
        description: 'Owner/creator of the group',
        type: () => UserReference,
        required: true,
    })
    @OneToOne(() => UserReference, (userRef) => userRef.newsFeed)
    @JoinColumn({name: 'owner_id'})
    owner: UserReference;

    @Column({name: 'owner_id', nullable: true})
    owner_id: string;

    @ApiProperty({
        description: 'Users who are members of this group',
        type: () => [UserReference],
        isArray: true,
    })
    @ManyToMany(() => UserReference, (userRef) => userRef.memberInGroups)
    @JoinTable()
    members: UserReference[];
}
