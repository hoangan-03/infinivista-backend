// import {ApiProperty} from '@nestjs/swagger';
// import {Entity, ManyToMany, PrimaryColumn} from 'typeorm';

// import {User} from '../local/user.entity';

// @Entity()
// export class PageReference {
//     @ApiProperty({
//         description: 'Unique identifier for the page',
//         example: '550e8400-e29b-41d4-a716-446655440000',
//     })
//     @PrimaryColumn()
//     id: string;

//     @ApiProperty({
//         description: 'Users who have liked this page',
//         type: () => [User],
//         isArray: true,
//     })
//     @ManyToMany(() => User, (user) => user.likedPages)
//     likedUsers: User[];

//     @ApiProperty({
//         description: 'Users who are following this page',
//         type: () => [User],
//         isArray: true,
//     })
//     @ManyToMany(() => User, (user) => user.followedPages)
//     followedUsers: User[];
// }
