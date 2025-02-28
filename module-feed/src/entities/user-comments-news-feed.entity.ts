import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { NewsFeed } from '@/entities/news-feed.entity';

@Entity()
export class UserCommentsNewsFeed {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  comment: string;

  @Column({ nullable: true })
  parent_comment_id: number;

  @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.comments)
  newsFeed: NewsFeed;
}
