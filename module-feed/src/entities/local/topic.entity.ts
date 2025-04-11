import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';

@Entity()
export class Topic extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'varchar', length: 255})
    topicName: string;

    @Column({type: 'text', nullable: true})
    topicDescription: string | null;
}
