import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FeedController } from "./feed.controller";
import { Advertisement } from "@/entities/advertisement.entity";
import { LiveStreamHistory } from "@/entities/live-stream-history.entity";
import { NewsFeed } from "@/entities/news-feed.entity";
import { Reaction } from "@/entities/reaction.entity";
import { Reel } from "@/entities/reel.entity";
import { Story } from "@/entities/story.entity";
import { UserCommentsNewsFeed } from "@/entities/user-comments-news-feed.entity";
import { UserHasNewsFeed } from "@/entities/user-has-news-feed.entity";
import { UserReactsNewsFeed } from "@/entities/user-reacts-news-feed.entity";
import { UserSharesNewsFeed } from "@/entities/user-shares-news-feed.entity";
import { UserViewsNewsFeed } from "@/entities/user-views-news-feed.entity";
import { FeedService } from "./feed.service";
import { Post } from "@/entities/post.entity";
@Module({
  imports: [TypeOrmModule.forFeature([Advertisement, LiveStreamHistory, NewsFeed, Post, Reaction, Reel, Story,UserCommentsNewsFeed, UserHasNewsFeed, UserReactsNewsFeed, UserSharesNewsFeed, UserViewsNewsFeed])],
  controllers: [FeedController],
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}
