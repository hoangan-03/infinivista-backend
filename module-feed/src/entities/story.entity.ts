import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { NewsFeed } from '@/entities/news-feed.entity';
import { BaseEntity } from "@/entities/base-class";

@Entity()
export class Story extends BaseEntity  {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  story_url: string;

  @Column({ type: 'int' })
  duration: number;

  @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.stories)
  newsFeed: NewsFeed;
}
