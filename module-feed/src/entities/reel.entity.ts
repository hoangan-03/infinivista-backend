import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { NewsFeed } from '@/entities/news-feed.entity';
import { BaseEntity } from "@/entities/base-class";
@Entity()
export class Reel extends BaseEntity  {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reel_video_url: string;

  @Column({ type: 'int' })
  duration: number;

  @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.reels)
  newsFeed: NewsFeed;
}
