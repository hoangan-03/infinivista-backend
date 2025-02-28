import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { NewsFeed } from './news-feed.entity';
import { Reaction } from './reaction.entity';

@Entity()
export class UserReactsNewsFeed {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.reactions)
  newsFeed: NewsFeed;

  @ManyToOne(() => Reaction)
  reaction: Reaction;
}
