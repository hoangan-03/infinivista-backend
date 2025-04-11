import {Controller} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';

import {Comment} from '@/entities/local/comment.entity';
import {LiveStreamHistory} from '@/entities/local/live-stream-history.entity';
import {NewsFeed} from '@/entities/local/newsfeed.entity';
import {Post as PostEntity} from '@/entities/local/post.entity';
import {Reel} from '@/entities/local/reel.entity';
import {Story} from '@/entities/local/story.entity';
import {UserReactPost} from '@/entities/local/user-react-post.entity';
import {ReactionType} from '@/enum/reaction-type';
import {PaginationResponseInterface} from '@/interfaces/pagination-response.interface';

import {CreatePostDto} from './dto/create-post.dto';
import {FeedService} from './feed.service';

@Controller()
export class FeedController {
    constructor(private readonly feedService: FeedService) {}

    @MessagePattern('CreateNewsFeedCommand')
    async createNewsFeed(payload: {id: string; data: Partial<NewsFeed>}): Promise<NewsFeed> {
        return this.feedService.createNewsFeed(payload.id, payload.data);
    }

    @MessagePattern('GetRandomNewsFeedCommand')
    async getRandomNewsFeed(payload: {
        id: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<PostEntity>> {
        return this.feedService.getRandomNewsFeed(payload.id, payload.page, payload.limit);
    }

    @MessagePattern('GetByIdNewsFeedCommand')
    async getNewsFeedById(payload: {id: string}): Promise<NewsFeed> {
        return this.feedService.getNewsFeedById(payload.id);
    }

    @MessagePattern('CreatePostNewsFeedCommand')
    async createPost(payload: {newsFeedId: string; postData: CreatePostDto}): Promise<PostEntity> {
        return this.feedService.createPost(payload.newsFeedId, payload.postData);
    }

    @MessagePattern('UpdatePostNewsFeedCommand')
    async updatePost(payload: {postId: string; postData: Partial<PostEntity>}): Promise<PostEntity> {
        return this.feedService.updatePost(payload.postId, payload.postData);
    }

    @MessagePattern('DeletePostNewsFeedCommand')
    async deletePost(payload: {postId: string}): Promise<PostEntity> {
        return this.feedService.deletePost(payload.postId);
    }

    @MessagePattern('GetPostsByIdNewsFeedCommand')
    async getPostsByNewsFeedId(payload: {
        userId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<PostEntity>> {
        return this.feedService.getPostsByNewsFeedId(payload.userId, payload.page, payload.limit);
    }

    @MessagePattern('GetStoriesByIdNewsFeedCommand')
    async getStoriesByNewsFeedId(payload: {
        newsFeedId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<Story>> {
        return this.feedService.getStoriesByNewsFeedId(payload.newsFeedId, payload.page, payload.limit);
    }

    @MessagePattern('GetAPostByIdCommand')
    async getAPostById(payload: {postId: string}): Promise<PostEntity> {
        return this.feedService.getPostById(payload.postId);
    }

    @MessagePattern('GetAStoryByIdCommand')
    async getAStoryById(payload: {storyId: string}): Promise<Story> {
        return this.feedService.getStoryById(payload.storyId);
    }

    @MessagePattern('CreateStoryNewsFeedCommand')
    async createStory(payload: {newsFeedId: string; storyData: Partial<Story>}): Promise<Story> {
        return this.feedService.createStory(payload.newsFeedId, payload.storyData);
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

    // Comment endpoints
    @MessagePattern('CreateCommentCommand')
    async createComment(payload: {
        postId: string;
        userId: string;
        text: string;
        attachmentUrl?: string;
    }): Promise<Comment> {
        return this.feedService.createComment(payload.postId, payload.userId, payload.text, payload.attachmentUrl);
    }

    @MessagePattern('GetCommentsByPostIdCommand')
    async getCommentsByPostId(payload: {
        postId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<Comment>> {
        return this.feedService.getCommentsByPostId(payload.postId, payload.page, payload.limit);
    }

    @MessagePattern('UpdateCommentCommand')
    async updateComment(payload: {
        commentId: string;
        userId: string;
        text: string;
        attachmentUrl?: string;
    }): Promise<Comment> {
        return this.feedService.updateComment(payload.commentId, payload.userId, payload.text, payload.attachmentUrl);
    }

    @MessagePattern('DeleteCommentCommand')
    async deleteComment(payload: {commentId: string; userId: string}): Promise<Comment> {
        return this.feedService.deleteComment(payload.commentId, payload.userId);
    }

    // Reaction endpoints
    @MessagePattern('AddReactionCommand')
    async addReaction(payload: {userId: string; postId: string; reactionType: ReactionType}): Promise<UserReactPost> {
        return this.feedService.addReaction(payload.userId, payload.postId, payload.reactionType);
    }

    @MessagePattern('GetReactionsByPostIdCommand')
    async getReactionsByPostId(payload: {postId: string}): Promise<UserReactPost[]> {
        return this.feedService.getReactionsByPostId(payload.postId);
    }

    @MessagePattern('RemoveReactionCommand')
    async removeReaction(payload: {postId: string; userId: string}): Promise<{success: boolean}> {
        return this.feedService.removeReaction(payload.postId, payload.userId);
    }

    @MessagePattern('GetReactionCountByTypeCommand')
    async getReactionCountByType(payload: {postId: string}): Promise<Record<ReactionType, number>> {
        return this.feedService.getReactionCountByType(payload.postId);
    }

    @MessagePattern('GetRandomReelsByUserIdCommand')
    async getRandomReelsByUserId(payload: {
        userId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<Reel>> {
        return this.feedService.getRandomReelsByUserId(payload.userId, payload.page, payload.limit);
    }

    @MessagePattern('GetLiveStreamsByNewsFeedIdCommand')
    async getLiveStreamsByNewsFeedId(payload: {
        newsFeedId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<LiveStreamHistory>> {
        return this.feedService.getLiveStreamsByNewsFeedId(payload.newsFeedId, payload.page, payload.limit);
    }
}
