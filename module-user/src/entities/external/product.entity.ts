import {Column, Entity, ManyToMany, PrimaryColumn} from 'typeorm';

import {User} from '../local/user.entity';

@Entity()
export class ProductReference {
    @PrimaryColumn()
    id: string;

    @Column()
    product_id: string;

    @ManyToMany(() => User, (user) => user.wishlistProducts)
    wishlistedUsers: User[];
}
