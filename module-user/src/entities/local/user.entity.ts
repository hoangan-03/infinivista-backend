import {Exclude} from 'class-transformer';
import {IsEnum, IsOptional} from 'class-validator';
import {Column, Entity, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn} from 'typeorm';
import {v4 as uuidv4} from 'uuid';

import {BaseEntity} from '@/entities/local/base-class';
import {Gender} from '@/modules/user/enums/gender.enum';
import {ProfilePrivacy} from '@/modules/user/enums/profile-privacy.enum';

import {GroupReference} from '../external/group.entity';
import {NewsFeedReference} from '../external/news-feed.entity';
import {PageReference} from '../external/page.entity';
import {ProductReference} from '../external/product.entity';
import {Friend} from './friend.entity';
import {FriendRequest} from './friend-request.entity';
import {SecurityAnswer} from './security-answer.entity';
import {Setting} from './setting.entity';
import {UserStatus} from './user-status.entity';

@Entity({name: 'users'})
export class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string = uuidv4();

    @Column({type: 'varchar', length: 255, unique: true})
    email: string;

    @Column({type: 'varchar', length: 255, unique: true})
    username: string;

    @Column({type: 'varchar', length: 255, nullable: true})
    @Exclude({toPlainOnly: true})
    password?: string;

    @Column({type: 'varchar', length: 15, nullable: true})
    phoneNumber: string;

    @Column({type: 'date', nullable: true})
    dob: Date;

    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @Column({type: 'varchar', length: 255, nullable: true})
    firstName: string;

    @Column({type: 'varchar', length: 255, nullable: true})
    lastName: string;

    @Column({type: 'text', nullable: true})
    profileImageUrl: string;

    @Column({type: 'text', nullable: true})
    coverImageUrl: string;

    @OneToOne(() => UserStatus, (status) => status.user, {
        cascade: true,
    })
    status: UserStatus;

    @OneToMany(() => Setting, (setting) => setting.user, {
        cascade: true,
    })
    settings: Setting[];

    @Column({type: 'text', nullable: true})
    address: string;

    @OneToMany(() => SecurityAnswer, (securityAnswer) => securityAnswer.user)
    securityAnswers: SecurityAnswer[];

    @Column({
        type: 'enum',
        enum: ['public', 'friends', 'private'],
        default: 'public',
    })
    profilePrivacy: ProfilePrivacy;

    // Existing relationships
    @OneToMany(() => Friend, (friend) => friend.user)
    friends: Friend[];

    @OneToMany(() => FriendRequest, (request) => request.sender)
    sentFriendRequests: FriendRequest[];

    @OneToMany(() => FriendRequest, (request) => request.recipient)
    receivedFriendRequests: FriendRequest[];

    @ManyToMany(() => GroupReference, (group) => group.members)
    joinedGroups: GroupReference[];

    @ManyToMany(() => PageReference, (page) => page.likedUsers)
    likedPages: PageReference[];

    @ManyToMany(() => PageReference, (page) => page.followedUsers)
    followedPages: PageReference[];

    @ManyToMany(() => NewsFeedReference, (newsFeed) => newsFeed.sharedUsers)
    sharedNewsFeeds: NewsFeedReference[];

    @ManyToMany(() => ProductReference, (product) => product.wishlistedUsers)
    wishlistProducts: ProductReference[];

    constructor(data: Partial<User> = {}) {
        super();
        Object.assign(this, data);
    }

    // @ApiProperty({
    //     example: '302 Alibaba Street, Lagos, Nigeria',
    //     description: 'User address',
    //     required: false,
    // })
    // @Column({type: 'text', nullable: true})
    // @Inject()
    // private readonly userEventsService: UserEventsService;

    // @AfterInsert()
    // async afterInsert() {
    //     await this.userEventsService?.publishUserCreated({
    //         id: this.id,
    //         username: this.username,
    //         email: this.email,
    //         profileImageUrl: this.profileImageUrl,
    //     });
    // }

    // @AfterUpdate()
    // async afterUpdate() {
    //     await this.userEventsService?.publishUserUpdated({
    //         id: this.id,
    //         username: this.username,
    //         profileImageUrl: this.profileImageUrl,
    //     });
    // }

    // @BeforeRemove()
    // async beforeRemove() {
    //     await this.userEventsService?.publishUserDeleted({
    //         id: this.id,
    //     });
    // }
}
