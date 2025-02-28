import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { NewsFeed } from '@/entities/news-feed.entity';

@Entity()
export class Advertisement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  start_time: Date;

  @Column({ type: 'timestamp' })
  end_time: Date;

  @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.advertisements)
  newsFeed: NewsFeed;
}
