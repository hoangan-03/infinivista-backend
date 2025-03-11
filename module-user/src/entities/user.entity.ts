import {Inject} from '@nestjs/common';
import {ApiProperty} from '@nestjs/swagger';
import {Exclude} from 'class-transformer';
import {IsEnum, IsOptional} from 'class-validator';
import {
    AfterInsert,
    AfterUpdate,
    BeforeRemove,
    Column,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import {v4 as uuidv4} from 'uuid';

import {BaseEntity} from '@/entities/base-class';
import {Gender} from '@/modules/user/enums/gender.enum';
import {ProfilePrivacy} from '@/modules/user/enums/profile-privacy.enum';
import {UserEventsService} from '@/rabbitmq/userevent.service';

import {Friend} from './friend.entity';
import {FriendRequest} from './friend-request.entity';
import {SecurityAnswer} from './security-answer.entity';
import {Setting} from './setting.entity';
import {UserStatus} from './user-status.entity';

@Entity({name: 'users'})
export class User extends BaseEntity {
    @ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'User unique identifier',
    })
    @PrimaryGeneratedColumn('uuid')
    id: string = uuidv4();

    @ApiProperty({
        example: 'user@example.com',
        description: 'User email address',
    })
    @Column({type: 'varchar', length: 255, unique: true})
    email: string;

    @ApiProperty({
        example: 'johndoe',
        description: 'User username',
    })
    @Column({type: 'varchar', length: 255, unique: true})
    username: string;

    @Exclude()
    @Column({type: 'varchar', length: 255, nullable: true})
    password?: string;

    @ApiProperty({
        example: '+1234567890',
        description: 'User phone number',
        required: false,
    })
    @Column({type: 'varchar', length: 15, nullable: true})
    phoneNumber: string;

    @ApiProperty({
        example: '1990-01-01',
        description: 'User date of birth',
        required: false,
    })
    @Column({type: 'date', nullable: true})
    dob: Date;

    @ApiProperty({
        enum: Gender,
        enumName: 'Gender',
        example: Gender.MALE,
        description: 'User gender',
        required: false,
    })
    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @ApiProperty({
        example: 'John',
        description: 'User first name',
        required: false,
    })
    @Column({type: 'varchar', length: 255, nullable: true})
    firstName: string;

    @ApiProperty({
        example: 'Doe',
        description: 'User last name',
        required: false,
    })
    @Column({type: 'varchar', length: 255, nullable: true})
    lastName: string;

    @ApiProperty({
        example: 'https://example.com/profile.jpg',
        description: 'User profile image URL',
        required: false,
    })
    @Column({type: 'text', nullable: true})
    profileImageUrl: string;

    @ApiProperty({
        example: 'https://example.com/cover.jpg',
        description: 'User cover image URL',
        required: false,
    })
    @Column({type: 'text', nullable: true})
    coverImageUrl: string;

    @ApiProperty({
        type: () => UserStatus,
        description: 'User status',
    })
    @OneToOne(() => UserStatus, (status) => status.user, {
        cascade: true,
    })
    status: UserStatus;

    @ApiProperty({
        type: () => [Setting],
        description: 'User settings',
    })
    @OneToMany(() => Setting, (setting) => setting.user, {
        cascade: true,
    })
    settings: Setting[];

    @ApiProperty({
        example: 'https://example.com/profile.jpg',
        description: 'User profile image URL',
        required: false,
    })
    @Column({type: 'text', nullable: true})
    address: string;

    @OneToMany(() => SecurityAnswer, (securityAnswer) => securityAnswer.user)
    securityAnswers: SecurityAnswer[];

    @ApiProperty({
        example: 'public',
        description: 'Profile privacy level',
    })
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

    constructor(data: Partial<User> = {}) {
        super();
        Object.assign(this, data);
    }

    @ApiProperty({
        example: '302 Alibaba Street, Lagos, Nigeria',
        description: 'User address',
        required: false,
    })
    @Column({type: 'text', nullable: true})
    @Inject()
    private readonly userEventsService: UserEventsService;

    @AfterInsert()
    async afterInsert() {
        await this.userEventsService?.publishUserCreated({
            id: this.id,
            username: this.username,
            email: this.email,
            profileImageUrl: this.profileImageUrl,
        });
    }

    @AfterUpdate()
    async afterUpdate() {
        await this.userEventsService?.publishUserUpdated({
            id: this.id,
            username: this.username,
            profileImageUrl: this.profileImageUrl,
        });
    }

    @BeforeRemove()
    async beforeRemove() {
        await this.userEventsService?.publishUserDeleted({
            id: this.id,
        });
    }
}
