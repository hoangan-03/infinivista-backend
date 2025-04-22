import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {AttachmentType} from '@/modules/feed/enum/attachment-type.enum';

import {Post} from './post.entity';

@Entity()
export class PostAttachment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    attachment_url: string;

    @Column({type: 'enum', enum: AttachmentType, nullable: false})
    attachementType: AttachmentType;

    @ManyToOne(() => Post, (post) => post.postAttachments)
    post: Post;
}
