import { Entity, BaseEntity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from "typeorm";
import { User } from "./user.entity";
import { FriendStatus } from "@/modules/user/enums/friend-status.enum";

@Entity({ name: "friend_requests" })
export class FriendRequest extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, user => user.sentFriendRequests)
  @JoinColumn({ name: "sender_id" })
  sender: User;

  @Column({ type: "uuid" })
  sender_id: string;

  @ManyToOne(() => User, user => user.receivedFriendRequests)
  @JoinColumn({ name: "recipient_id" })
  recipient: User;

  @Column({ type: "uuid" })
  recipient_id: string;

  @Column({ 
    type: "enum", 
    enum: ["pending", "accepted", "declined"],
    default: "pending"
  })
  status: FriendStatus;
}
