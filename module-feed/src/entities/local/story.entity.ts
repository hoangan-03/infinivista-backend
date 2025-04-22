import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';
import {NewsFeed} from '@/entities/local/newsfeed.entity';
import {AttachmentType} from '@/modules/feed/enum/attachment-type.enum';

@Entity()
export class Story extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    story_url: string;

    @Column()
    duration: number;

    @Column({type: 'enum', enum: AttachmentType, nullable: false})
    attachementType: AttachmentType;

    @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.stories)
    newsFeed: NewsFeed;
}
