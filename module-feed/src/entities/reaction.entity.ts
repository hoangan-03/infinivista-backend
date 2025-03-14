import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base-class';
@Entity()
export class Reaction extends BaseEntity {
    @PrimaryGeneratedColumn()
    reaction_id: number;

    @Column({type: 'enum', enum: ['LIKE', 'HEART', 'CARE', 'SAD', 'WOW', 'ANGRY']})
    reaction_type: string;

    @Column()
    reaction_image_url: string;
}
