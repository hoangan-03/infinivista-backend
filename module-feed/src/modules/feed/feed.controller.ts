import {Controller} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';

import {LiveStreamHistory} from '@/entities/local/live-stream-history.entity';
import {NewsFeed} from '@/entities/local/newsfeed.entity';
import {Post as PostEntity} from '@/entities/local/post.entity';
import {Story} from '@/entities/local/story.entity';

import {FeedService} from './feed.service';

@Controller()
export class FeedController {
    constructor(private readonly feedService: FeedService) {}

    @MessagePattern('CreateNewsFeedCommand')
    async createNewsFeed(payload: {id: string; data: Partial<NewsFeed>}): Promise<NewsFeed> {
        return this.feedService.createNewsFeed(payload.id, payload.data);
    }

    @MessagePattern('GetAllNewsFeedCommand')
    async getAllNewsFeeds(): Promise<NewsFeed[]> {
        return this.feedService.getAllNewsFeeds();
    }

    @MessagePattern('GetAllPostOfUserCommand')
    async getAllNewsFeedsOfUser(payload: {id: string}): Promise<PostEntity[]> {
        return this.feedService.getAllPostofUser(payload.id);
    }

    @MessagePattern('GetByIdNewsFeedCommand')
    async getNewsFeedById(payload: {id: string}): Promise<NewsFeed> {
        return this.feedService.getNewsFeedById(payload.id);
    }

    @MessagePattern('UpdateNewsFeedCommand')
    async updateNewsFeed(payload: {id: string; data: Partial<NewsFeed>}): Promise<NewsFeed> {
        return this.feedService.updateNewsFeed(payload.id, payload.data);
    }

    @MessagePattern('DeleteNewsFeedCommand')
    async deleteNewsFeed(payload: {id: string}): Promise<void> {
        return this.feedService.deleteNewsFeed(payload.id);
    }

    @MessagePattern('CreatePostNewsFeedCommand')
    async createPost(payload: {newsFeedId: string; postData: Partial<PostEntity>}): Promise<PostEntity> {
        return this.feedService.createPost(payload.newsFeedId, payload.postData);
    }

    @MessagePattern('GetPostsByIdNewsFeedCommand')
    async getPostsByNewsFeedId(payload: {newsFeedId: string}): Promise<PostEntity[]> {
        return this.feedService.getPostsByNewsFeedId(payload.newsFeedId);
    }

    @MessagePattern('CreateStoryNewsFeedCommand')
    async createStory(payload: {newsFeedId: string; storyData: Partial<Story>}): Promise<Story> {
        return this.feedService.createStory(payload.newsFeedId, payload.storyData);
    }

    @MessagePattern('GetStoriesByIdNewsFeedCommand')
    async getStoriesByNewsFeedId(payload: {newsFeedId: string}): Promise<Story[]> {
        return this.feedService.getStoriesByNewsFeedId(payload.newsFeedId);
    }

    @MessagePattern('CreateLiveStreamCommand')
    async createLiveStream(payload: {
        newsFeedId: string;
        streamData: Partial<LiveStreamHistory>;
    }): Promise<LiveStreamHistory> {
        return this.feedService.createLiveStream(payload.newsFeedId, payload.streamData);
    }

    @MessagePattern('EndLiveStreamCommand')
    async endLiveStream(payload: {streamId: string; endTime: Date}): Promise<LiveStreamHistory> {
        return this.feedService.endLiveStream(payload.streamId, payload.endTime);
    }

    // @MessagePattern('GetEngagementStatsCommand')
    // async getEngagementStats(payload: {newsFeedId: string}): Promise<any> {
    //     return this.feedService.getEngagementStats(payload.newsFeedId);
    // }
}
