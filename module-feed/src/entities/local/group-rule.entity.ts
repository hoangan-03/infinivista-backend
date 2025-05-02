import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';

import {Group} from './group.entity';

@Entity()
export class GroupRule extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'text', nullable: false})
    title: string;

    @Column({type: 'text', nullable: true})
    description?: string;

    @ManyToOne(() => Group, (group) => group.groupRules)
    group: Group;
}
