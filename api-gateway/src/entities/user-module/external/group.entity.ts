// import {ApiProperty} from '@nestjs/swagger';
// import {Entity, ManyToMany, PrimaryColumn} from 'typeorm';

// import {User} from '../local/user.entity';

// @Entity()
// export class GroupReference {
//     @ApiProperty({
//         description: 'Unique identifier for the group',
//         example: '550e8400-e29b-41d4-a716-446655440000',
//     })
//     @PrimaryColumn()
//     id: string;

//     @ApiProperty({
//         description: 'Users who are members of this group',
//         type: () => [User],
//         isArray: true,
//     })
//     @ManyToMany(() => User, (user) => user.joinedGroups)
//     members: User[];
// }
