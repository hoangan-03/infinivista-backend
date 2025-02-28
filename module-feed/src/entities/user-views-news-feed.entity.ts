import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { NewsFeed } from './news-feed.entity';

@Entity()
export class UserViewsNewsFeed {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  viewed_at: Date;

  @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.views)
  newsFeed: NewsFeed;
}
