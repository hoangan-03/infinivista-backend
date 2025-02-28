import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { NewsFeed } from '@/entities/news-feed.entity';
import { BaseEntity } from "@/entities/base-class";
@Entity()
export class Post extends BaseEntity  {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  post_attachment: string;

  @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.posts)
  newsFeed: NewsFeed;
}
