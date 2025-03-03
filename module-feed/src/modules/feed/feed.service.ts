import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOneOptions } from "typeorm";
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { NewsFeed } from "@/entities/news-feed.entity";
import { Post } from "@/entities/post.entity";
import { Story } from "@/entities/story.entity";
import { LiveStreamHistory } from "@/entities/live-stream-history.entity";
import { UserCommentsNewsFeed } from "@/entities/user-comments-news-feed.entity";
import { UserSharesNewsFeed } from "@/entities/user-shares-news-feed.entity";
import { UserViewsNewsFeed } from "@/entities/user-views-news-feed.entity";
import { UserReactsNewsFeed } from "@/entities/user-reacts-news-feed.entity";
import { Reaction } from "@/entities/reaction.entity";

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(NewsFeed)
    private readonly newsFeedRepository: Repository<NewsFeed>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    @InjectRepository(LiveStreamHistory)
    private readonly liveStreamRepository: Repository<LiveStreamHistory>,
    @InjectRepository(UserCommentsNewsFeed)
    private readonly commentsRepository: Repository<UserCommentsNewsFeed>,
    @InjectRepository(UserSharesNewsFeed)
    private readonly sharesRepository: Repository<UserSharesNewsFeed>,
    @InjectRepository(UserViewsNewsFeed)
    private readonly viewsRepository: Repository<UserViewsNewsFeed>,
    @InjectRepository(UserReactsNewsFeed)
    private readonly reactsRepository: Repository<UserReactsNewsFeed>,
    @InjectRepository(Reaction)
    private readonly reactionRepository: Repository<Reaction>
  ) {}

  // News Feed Management
  async createNewsFeed(data: Partial<NewsFeed>): Promise<NewsFeed> {
    const newsFeed = this.newsFeedRepository.create(data);
    return this.newsFeedRepository.save(newsFeed);
  }

  async getAllNewsFeeds(): Promise<NewsFeed[]> {
    return this.newsFeedRepository.find();
  }

  async getNewsFeedById(id: number): Promise<NewsFeed> {
    const newsFeed = await this.newsFeedRepository.findOne({ 
      where: { news_feed_id: id },
      relations: ['posts', 'stories', 'liveStreams', 'comments', 'shares', 'views', 'reactions'] 
    });
    
    if (!newsFeed) {
      throw new NotFoundException(`News feed with ID ${id} not found`);
    }
    
    return newsFeed;
  }

  async updateNewsFeed(id: number, data: Partial<NewsFeed>): Promise<NewsFeed> {
    const newsFeed = await this.getNewsFeedById(id);
    this.newsFeedRepository.merge(newsFeed, data);
    return this.newsFeedRepository.save(newsFeed);
  }

  async deleteNewsFeed(id: number): Promise<void> {
    const result = await this.newsFeedRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`News feed with ID ${id} not found`);
    }
  }

  // Post Management
  async createPost(newsFeedId: number, postData: Partial<Post>): Promise<Post> {
    const newsFeed = await this.getNewsFeedById(newsFeedId);
    
    const post = this.postRepository.create({
      ...postData,
      newsFeed
    });
    
    return this.postRepository.save(post);
  }

  async getPostById(id: number): Promise<Post> {
    const post = await this.postRepository.findOne({ 
      where: { id },
      relations: ['newsFeed'] 
    });
    
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    
    return post;
  }

  async getPostsByNewsFeedId(newsFeedId: number): Promise<Post[]> {
    return this.postRepository.find({
      where: { newsFeed: { news_feed_id: newsFeedId } },
      relations: ['newsFeed']
    });
  }

  // Story Management
  async createStory(newsFeedId: number, storyData: Partial<Story>): Promise<Story> {
    const newsFeed = await this.getNewsFeedById(newsFeedId);
    
    const story = this.storyRepository.create({
      ...storyData,
      newsFeed
    });
    
    return this.storyRepository.save(story);
  }

  async getStoriesByNewsFeedId(newsFeedId: number): Promise<Story[]> {
    return this.storyRepository.find({
      where: { newsFeed: { news_feed_id: newsFeedId } },
      relations: ['newsFeed']
    });
  }

  // Live Stream Management
  async createLiveStream(newsFeedId: number, streamData: Partial<LiveStreamHistory>): Promise<LiveStreamHistory> {
    const newsFeed = await this.getNewsFeedById(newsFeedId);
    
    const liveStream = this.liveStreamRepository.create({
      ...streamData,
      newsFeed
    });
    
    return this.liveStreamRepository.save(liveStream);
  }

  async endLiveStream(streamId: number, endTime: Date): Promise<LiveStreamHistory> {
    const stream = await this.liveStreamRepository.findOne({ where: { id: streamId } });
    
    if (!stream) {
      throw new NotFoundException(`Live stream with ID ${streamId} not found`);
    }
    
    stream.end_time = endTime;
    return this.liveStreamRepository.save(stream);
  }

  // Engagement Management
  async addComment(newsFeedId: number, comment: string, parentCommentId?: number): Promise<UserCommentsNewsFeed> {
    const newsFeed = await this.getNewsFeedById(newsFeedId);
    
    const newComment = this.commentsRepository.create({
      comment,
      parent_comment_id: parentCommentId,
      newsFeed
    });
    
    return this.commentsRepository.save(newComment);
  }

  async addReaction(newsFeedId: number, reactionId: number): Promise<UserReactsNewsFeed> {
    const newsFeed = await this.getNewsFeedById(newsFeedId);
    const reaction = await this.reactionRepository.findOne({ where: { reaction_id: reactionId } });
    
    if (!reaction) {
      throw new NotFoundException(`Reaction with ID ${reactionId} not found`);
    }
    
    const userReaction = this.reactsRepository.create({
      newsFeed,
      reaction
    });
    
    return this.reactsRepository.save(userReaction);
  }

  async recordShare(newsFeedId: number): Promise<UserSharesNewsFeed> {
    const newsFeed = await this.getNewsFeedById(newsFeedId);
    
    const share = this.sharesRepository.create({
      newsFeed,
      shared_at: new Date()
    });
    
    return this.sharesRepository.save(share);
  }

  async recordView(newsFeedId: number): Promise<UserViewsNewsFeed> {
    const newsFeed = await this.getNewsFeedById(newsFeedId);
    
    const view = this.viewsRepository.create({
      newsFeed,
      viewed_at: new Date()
    });
    
    return this.viewsRepository.save(view);
  }

  // Analytics
  async getEngagementStats(newsFeedId: number): Promise<any> {
    // Removed the unused newsFeed retrieval

    const commentCount = await this.commentsRepository.count({
      where: { newsFeed: { news_feed_id: newsFeedId } }
    });
    
    const shareCount = await this.sharesRepository.count({
      where: { newsFeed: { news_feed_id: newsFeedId } }
    });
    
    const viewCount = await this.viewsRepository.count({
      where: { newsFeed: { news_feed_id: newsFeedId } }
    });
    
    const reactionCount = await this.reactsRepository.count({
      where: { newsFeed: { news_feed_id: newsFeedId } }
    });
    
    return {
      newsFeedId,
      commentCount,
      shareCount,
      viewCount,
      reactionCount
    };
  }
}