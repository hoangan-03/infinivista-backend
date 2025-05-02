import {ApiProperty} from '@nestjs/swagger';
import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';

@Entity()
export class GroupRule extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the group rule',
        example: '550e8400-e29b-41d4-a716-446655440000',
        readOnly: true,
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        description: 'Title of the group rule',
        example: 'Be Respectful',
        required: true,
    })
    @Column()
    title: string;

    @ApiProperty({
        description: 'Detailed explanation of the group rule',
        example: 'Treat everyone with respect. Healthy debates are natural, but kindness is required.',
        required: false,
    })
    @Column({nullable: true, type: 'text'})
    description?: string;
}
