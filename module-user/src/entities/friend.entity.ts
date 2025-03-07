import { Entity, BaseEntity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from "typeorm";
import { User } from "./user.entity";

@Entity({ name: "friends" })
export class Friend extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, user => user.friends)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "uuid" })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "friend_id" })
  friend: User;

  @Column({ type: "uuid" })
  friend_id: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  group: string;
}

