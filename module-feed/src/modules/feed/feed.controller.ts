import {Controller} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';

import {LiveStreamHistory} from '@/entities/local/live-stream-history.entity';
import {NewsFeed} from '@/entities/local/newsfeed.entity';
import {Post as PostEntity} from '@/entities/local/post.entity';
import {Story} from '@/entities/local/story.entity';
import {Comment} from '@/entities/local/comment.entity';
import {ReactionType} from '@/enum/reaction-type';
import {UserReactPost} from '@/entities/local/user-react-post.entity';

import {FeedService} from './feed.service';

@Controller()
export class FeedController {
    constructor(private readonly feedService: FeedService) {}

    @MessagePattern('CreateNewsFeedCommand')
    async createNewsFeed(payload: {id: string; data: Partial<NewsFeed>}): Promise<NewsFeed> {
        return this.feedService.createNewsFeed(payload.id, payload.data);
    }

    @MessagePattern('GetRandomNewsFeedCommand')
    async getRandomNewsFeed(): Promise<PostEntity[]> {
        return this.feedService.getRandomNewsFeed();
    }

    @MessagePattern('GetByIdNewsFeedCommand')
    async getNewsFeedById(payload: {id: string}): Promise<NewsFeed> {
        return this.feedService.getNewsFeedById(payload.id);
    }

    @MessagePattern('CreatePostNewsFeedCommand')
    async createPost(payload: {newsFeedId: string; postData: Partial<PostEntity>}): Promise<PostEntity> {
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
    async getPostsByNewsFeedId(payload: {newsFeedId: string}): Promise<PostEntity[]> {
        return this.feedService.getPostsByNewsFeedId(payload.newsFeedId);
    }

    @MessagePattern('GetStoriesByIdNewsFeedCommand')
    async getStoriesByNewsFeedId(payload: {newsFeedId: string}): Promise<Story[]> {
        return this.feedService.getStoriesByNewsFeedId(payload.newsFeedId);
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
    async getCommentsByPostId(payload: {postId: string}): Promise<Comment[]> {
        return this.feedService.getCommentsByPostId(payload.postId);
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
    async removeReaction(payload: {postId: string; userId: string}): Promise<boolean> {
        return this.feedService.removeReaction(payload.postId, payload.userId);
    }

    @MessagePattern('GetReactionCountByTypeCommand')
    async getReactionCountByType(payload: {postId: string}): Promise<Record<ReactionType, number>> {
        return this.feedService.getReactionCountByType(payload.postId);
    }
}
