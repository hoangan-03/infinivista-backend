import {ApiProperty} from '@nestjs/swagger';
import {Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';
import {PageCategoryEnum} from '@/enums/feed-module/page-category.enum';

import {UserReference} from '../external/user.entity';
import {NewsFeed} from './newsfeed.entity';

@Entity()
export class Page extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the page',
        example: '550e8400-e29b-41d4-a716-446655440000',
        readOnly: true,
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        description: 'Name of the page',
        example: 'Infinivista Official',
        required: true,
    })
    @Column()
    name: string;

    @ApiProperty({
        description: 'Description of the page',
        example: 'The official page for Infinivista - connecting people worldwide',
        required: false,
    })
    @Column({nullable: true, type: 'text'})
    description?: string;

    @ApiProperty({
        description: "URL to the page's profile image",
        example: 'https://storage.infinivista.com/pages/profile/infinivista-logo.jpg',
        required: false,
    })
    @Column({nullable: true})
    profileImageUrl?: string;

    @ApiProperty({
        description: "URL to the page's cover image",
        example: 'https://storage.infinivista.com/pages/cover/infinivista-banner.jpg',
        required: false,
    })
    @Column({nullable: true})
    coverImageUrl?: string;

    @ApiProperty({
        description: 'Category of the page',
        enum: PageCategoryEnum,
        example: PageCategoryEnum.BUSINESS,
        required: true,
    })
    @Column({
        type: 'enum',
        enum: PageCategoryEnum,
        default: PageCategoryEnum.OTHER,
    })
    category: PageCategoryEnum;

    @ApiProperty({
        description: 'Website URL associated with the page',
        example: 'https://www.infinivista.com',
        required: false,
    })
    @Column({nullable: true})
    website?: string;

    @ApiProperty({
        description: 'Contact email for the page',
        example: 'contact@infinivista.com',
        required: false,
    })
    @Column({nullable: true})
    email?: string;

    @ApiProperty({
        description: 'Contact phone number for the page',
        example: '+1-555-123-4567',
        required: false,
    })
    @Column({nullable: true})
    phoneNumber?: string;

    @ApiProperty({
        description: "Physical address of the page's represented entity",
        example: '123 Tech Boulevard, Suite 400',
        required: false,
    })
    @Column({nullable: true})
    address?: string;

    @ApiProperty({
        description: "City where the page's entity is located",
        example: 'San Francisco',
        required: false,
    })
    @Column({nullable: true})
    city?: string;

    @ApiProperty({
        description: "Country where the page's entity is located",
        example: 'United States',
        required: false,
    })
    @Column({nullable: true})
    country?: string;

    @ApiProperty({
        description: 'Associated news feed for the page',
        type: () => NewsFeed,
        required: false,
    })
    @OneToOne(() => NewsFeed, (newsFeed) => newsFeed.id, {nullable: true})
    @JoinColumn({name: 'news_feed_id'})
    newsFeed?: NewsFeed;

    @ApiProperty({
        description: 'Owner of the page',
        type: () => UserReference,
        required: true,
    })
    @ManyToOne(() => UserReference, (userRef) => userRef.newsFeed)
    @JoinColumn({name: 'owner_id'})
    owner: UserReference;

    @Column({name: 'owner_id', nullable: true})
    owner_id: string;

    @ApiProperty({
        description: 'Users who follow this page',
        type: () => [UserReference],
        isArray: true,
    })
    @ManyToMany(() => UserReference, (userRef) => userRef.followedPages)
    @JoinTable()
    followers: UserReference[];
}
