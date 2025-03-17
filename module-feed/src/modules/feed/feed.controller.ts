import {MessagePattern} from '@nestjs/microservices';

import {NewsFeed} from '@/entities/local/news-feed.entity';
import {Post as PostEntity} from '@/entities/local/post.entity';

import {FeedService} from './feed.service';

export class FeedController {
    constructor(private readonly feedService: FeedService) {}

    // News Feed Endpoints
    @MessagePattern('CreateNewsFeedCommand')
    async createNewsFeed(payload: {newsFeed: Partial<NewsFeed>}): Promise<NewsFeed> {
        return this.feedService.createNewsFeed(payload.newsFeed);
    }

    @MessagePattern('GetAllNewsFeedCommand')
    async getAllNewsFeeds(): Promise<NewsFeed[]> {
        return this.feedService.getAllNewsFeeds();
    }

    @MessagePattern('GetByIdNewsFeedCommand')
    async getNewsFeedById(payload: {id: number}): Promise<NewsFeed> {
        return this.feedService.getNewsFeedById(payload.id);
    }

    @MessagePattern('UpdateNewsFeedCommand')
    async updateNewsFeed(payload: {id: number; data: Partial<NewsFeed>}): Promise<NewsFeed> {
        return this.feedService.updateNewsFeed(payload.id, payload.data);
    }

    @MessagePattern('DeleteNewsFeedCommand')
    async deleteNewsFeed(payload: {id: number}): Promise<void> {
        return this.feedService.deleteNewsFeed(payload.id);
    }

    @MessagePattern('CreatePostNewsFeedCommand')
    async createPost(payload: {newsFeedId: number; postData: Partial<PostEntity>}): Promise<PostEntity> {
        return this.feedService.createPost(payload.newsFeedId, payload.postData);
    }

    // Add @AuthUser() to all your other endpoints...
    @MessagePattern('GetPostsByIdNewsFeedCommand')
    async getPostsByNewsFeedId(payload: {newsFeedId: number}): Promise<PostEntity[]> {
        return this.feedService.getPostsByNewsFeedId(payload.newsFeedId);
    }
}
