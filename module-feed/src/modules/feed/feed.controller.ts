import {Controller} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';

import {UserReference} from '@/entities/external/user-reference.entity';
import {Comment} from '@/entities/local/comment.entity';
import {Group} from '@/entities/local/group.entity';
import {GroupRule} from '@/entities/local/group-rule.entity';
import {LiveStreamHistory} from '@/entities/local/live-stream-history.entity';
import {NewsFeed} from '@/entities/local/newsfeed.entity';
import {Page} from '@/entities/local/page.entity';
import {Post as PostEntity} from '@/entities/local/post.entity';
import {Reel} from '@/entities/local/reel.entity';
import {Story} from '@/entities/local/story.entity';
import {UserReactPost} from '@/entities/local/user-react-post.entity';
import {UserReactStory} from '@/entities/local/user-react-story.entity';
import {PaginationResponseInterface} from '@/interfaces/pagination-response.interface';
import {ReactionType} from '@/modules/feed/enum/reaction-type.enum';
import {FileUploadService} from '@/services/file-upload.service';

import {CreateGroupDto} from './dto/create-group.dto';
import {CreatePageDto} from './dto/create-page.dto';
import {CreatePostDto} from './dto/create-post.dto';
import {CreateStoryDto} from './dto/create-story.dto';
import {FileUploadDto, FileUploadResponseDto} from './dto/file-upload.dto';
import {UpdateGroupDto} from './dto/update-group.dto';
import {UpdatePageDto} from './dto/update-page.dto';
import {AttachmentType} from './enum/attachment-type.enum';
import {FeedService} from './feed.service';

@Controller()
export class FeedController {
    constructor(
        private readonly feedService: FeedService,
        private readonly fileUploadService: FileUploadService
    ) {}

    @MessagePattern('CreateNewsFeedCommand')
    async createNewsFeed(payload: {id: string; data: Partial<NewsFeed>}): Promise<NewsFeed> {
        return this.feedService.createNewsFeed(payload.id, payload.data);
    }

    @MessagePattern('GetPopularNewsFeedCommand')
    async getPopularNewsFeed(payload: {
        id: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<PostEntity>> {
        return this.feedService.getPopularPostNewsFeed(payload.id, payload.page, payload.limit);
    }

    @MessagePattern('GetFriendsNewsFeedCommand')
    async getFriendsNewsFeed(payload: {
        id: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<PostEntity>> {
        return this.feedService.getFriendsPostNewsFeed(payload.id, payload.page, payload.limit);
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
        return this.feedService.getNewsFeedByUserId(payload.id);
    }

    // @MessagePattern('CreatePostNewsFeedCommand')
    // async createPost(payload: {newsFeedId: string; postData: CreatePostDto}): Promise<PostEntity> {
    //     return this.feedService.createPost(payload.newsFeedId, payload.postData);
    // }

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
        newsfeedId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<PostEntity>> {
        return this.feedService.getPostsByNewsFeedId(payload.newsfeedId, payload.page, payload.limit);
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
    async createStory(payload: {newsFeedId: string; storyData: CreateStoryDto}): Promise<Story> {
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

    @MessagePattern('UploadAttachmentToPostCommand')
    async uploadAttachmentFile(payload: FileUploadDto): Promise<FileUploadResponseDto> {
        const url = await this.fileUploadService.uploadFile(
            Buffer.from(payload.buffer),
            payload.fileName,
            payload.mimeType
        );

        return {
            url,
            fileName: payload.fileName,
            mimeType: payload.mimeType,
        };
    }
    /**
     * Create a post with attachments after uploading files
     */
    @MessagePattern('CreatePostInPageAfterUploadingFilesCommand')
    async createPostInPageAfterUploadingFiles(payload: {
        userId: string;
        newsFeedId: string;
        postData: CreatePostDto;
        files: Array<{url: string; fileName: string; mimeType: string}>;
        attachmentType: AttachmentType[];
    }): Promise<PostEntity> {
        return this.feedService.createPostInPageAfterUploadingFiles(
            payload.userId,
            payload.newsFeedId,
            payload.postData,
            payload.files,
            payload.attachmentType
        );
    }
    /**
     * Create a post with attachments after uploading files
     */
    @MessagePattern('CreatePostAfterUploadingFilesCommand')
    async createPostAfterUploadingFiles(payload: {
        newsFeedId: string;
        postData: CreatePostDto;
        files: Array<{url: string; fileName: string; mimeType: string}>;
        attachmentType: AttachmentType[];
    }): Promise<PostEntity> {
        return this.feedService.createPostAfterUploadingFiles(
            payload.newsFeedId,
            payload.postData,
            payload.files,
            payload.attachmentType
        );
    }

    // Story Comment endpoints
    @MessagePattern('CreateStoryCommentCommand')
    async createStoryComment(payload: {
        storyId: string;
        userId: string;
        text: string;
        attachmentUrl?: string;
    }): Promise<Comment> {
        return this.feedService.createStoryComment(
            payload.storyId,
            payload.userId,
            payload.text,
            payload.attachmentUrl
        );
    }

    @MessagePattern('GetCommentsByStoryIdCommand')
    async getCommentsByStoryId(payload: {
        storyId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<Comment>> {
        return this.feedService.getCommentsByStoryId(payload.storyId, payload.page, payload.limit);
    }

    @MessagePattern('DeleteStoryCommentCommand')
    async deleteStoryComment(payload: {commentId: string; userId: string}): Promise<Comment> {
        return this.feedService.deleteStoryComment(payload.commentId, payload.userId);
    }

    // Story Reaction endpoints
    @MessagePattern('AddStoryReactionCommand')
    async addStoryReaction(payload: {
        userId: string;
        storyId: string;
        reactionType: ReactionType;
    }): Promise<UserReactStory> {
        return this.feedService.addStoryReaction(payload.userId, payload.storyId, payload.reactionType);
    }

    @MessagePattern('GetReactionsByStoryIdCommand')
    async getReactionsByStoryId(payload: {storyId: string}): Promise<UserReactStory[]> {
        return this.feedService.getReactionsByStoryId(payload.storyId);
    }

    @MessagePattern('RemoveStoryReactionCommand')
    async removeStoryReaction(payload: {storyId: string; userId: string}): Promise<{success: boolean}> {
        return this.feedService.removeStoryReaction(payload.storyId, payload.userId);
    }

    @MessagePattern('GetStoryReactionCountByTypeCommand')
    async getStoryReactionCountByType(payload: {storyId: string}): Promise<Record<ReactionType, number>> {
        return this.feedService.getStoryReactionCountByType(payload.storyId);
    }

    // Page management endpoints
    @MessagePattern('GetAllPages')
    async getAllPages(payload: {page?: number; limit?: number}): Promise<PaginationResponseInterface<Page>> {
        return this.feedService.getAllPages(payload.page, payload.limit);
    }

    @MessagePattern('GetMyPages')
    async getMyPages(payload: {
        userId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<Page>> {
        return this.feedService.getMyPages(payload.userId, payload.page, payload.limit);
    }

    @MessagePattern('CreatePage')
    async createPage(payload: {ownerId: string; pageData: CreatePageDto}): Promise<Page> {
        return this.feedService.createPage(payload.ownerId, payload.pageData);
    }

    @MessagePattern('GetPageById')
    async getPageById(payload: {id: string}): Promise<Page> {
        return this.feedService.getPageById(payload.id);
    }

    @MessagePattern('UpdatePage')
    async updatePage(payload: {userId: string; pageId: string; updateData: UpdatePageDto}): Promise<Page> {
        return this.feedService.updatePage(payload.userId, payload.pageId, payload.updateData);
    }

    @MessagePattern('DeletePage')
    async deletePage(payload: {userId: string; pageId: string}): Promise<{success: boolean}> {
        return this.feedService.deletePage(payload.userId, payload.pageId);
    }

    @MessagePattern('FollowPage')
    async followPage(payload: {userId: string; pageId: string}): Promise<{success: boolean}> {
        return this.feedService.followPage(payload.userId, payload.pageId);
    }

    @MessagePattern('UnfollowPage')
    async unfollowPage(payload: {userId: string; pageId: string}): Promise<{success: boolean}> {
        return this.feedService.unfollowPage(payload.userId, payload.pageId);
    }

    @MessagePattern('GetPageFollowers')
    async getPageFollowers(payload: {
        pageId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<UserReference>> {
        return this.feedService.getPageFollowers(payload.pageId, payload.page, payload.limit);
    }

    @MessagePattern('GetPagePosts')
    async getPagePosts(payload: {
        pageId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<PostEntity>> {
        return this.feedService.getPagePosts(payload.pageId, payload.page, payload.limit);
    }

    @MessagePattern('UpdatePageProfileImage')
    async updatePageProfileImage(payload: {userId: string; pageId: string; imageUrl: string}): Promise<Page> {
        return this.feedService.updatePageProfileImage(payload.userId, payload.pageId, payload.imageUrl);
    }

    @MessagePattern('UpdatePageCoverImage')
    async updatePageCoverImage(payload: {userId: string; pageId: string; imageUrl: string}): Promise<Page> {
        return this.feedService.updatePageCoverImage(payload.userId, payload.pageId, payload.imageUrl);
    }

    // Group management endpoints
    @MessagePattern('GetAllGroups')
    async getAllGroups(payload: {page?: number; limit?: number}): Promise<PaginationResponseInterface<Group>> {
        return this.feedService.getAllGroups(payload.page, payload.limit);
    }

    @MessagePattern('GetMyGroups')
    async getMyGroups(payload: {
        userId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<Group>> {
        return this.feedService.getMyGroups(payload.userId, payload.page, payload.limit);
    }

    @MessagePattern('CreateGroup')
    async createGroup(payload: {ownerId: string; groupData: CreateGroupDto}): Promise<Group> {
        return this.feedService.createGroup(payload.ownerId, payload.groupData);
    }

    @MessagePattern('GetGroupById')
    async getGroupById(payload: {id: string}): Promise<Group> {
        return this.feedService.getGroupById(payload.id);
    }

    @MessagePattern('UpdateGroup')
    async updateGroup(payload: {userId: string; groupId: string; updateData: UpdateGroupDto}): Promise<Group> {
        return this.feedService.updateGroup(payload.userId, payload.groupId, payload.updateData);
    }

    @MessagePattern('DeleteGroup')
    async deleteGroup(payload: {userId: string; groupId: string}): Promise<{success: boolean}> {
        return this.feedService.deleteGroup(payload.userId, payload.groupId);
    }

    @MessagePattern('JoinGroup')
    async joinGroup(payload: {userId: string; groupId: string}): Promise<{success: boolean}> {
        return this.feedService.joinGroup(payload.userId, payload.groupId);
    }

    @MessagePattern('LeaveGroup')
    async leaveGroup(payload: {userId: string; groupId: string}): Promise<{success: boolean}> {
        return this.feedService.leaveGroup(payload.userId, payload.groupId);
    }

    @MessagePattern('GetGroupMembers')
    async getGroupMembers(payload: {
        groupId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<UserReference>> {
        return this.feedService.getGroupMembers(payload.groupId, payload.page, payload.limit);
    }

    @MessagePattern('GetGroupPosts')
    async getGroupPosts(payload: {
        groupId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<PostEntity>> {
        return this.feedService.getGroupPosts(payload.groupId, payload.page, payload.limit);
    }

    @MessagePattern('CreateGroupPost')
    async createGroupPost(payload: {
        userId: string;
        groupId: string;
        postData: CreatePostDto;
        files: Array<{url: string; fileName: string; mimeType: string}>;
        attachmentType: AttachmentType[];
    }): Promise<PostEntity> {
        return this.feedService.createGroupPost(
            payload.userId,
            payload.groupId,
            payload.postData,
            payload.files,
            payload.attachmentType
        );
    }

    @MessagePattern('UpdateGroupProfileImage')
    async updateGroupProfileImage(payload: {userId: string; groupId: string; imageUrl: string}): Promise<Group> {
        return this.feedService.updateGroupProfileImage(payload.userId, payload.groupId, payload.imageUrl);
    }

    @MessagePattern('UpdateGroupCoverImage')
    async updateGroupCoverImage(payload: {userId: string; groupId: string; imageUrl: string}): Promise<Group> {
        return this.feedService.updateGroupCoverImage(payload.userId, payload.groupId, payload.imageUrl);
    }

    @MessagePattern('AddGroupRule')
    async addGroupRule(payload: {
        userId: string;
        groupId: string;
        rule: {title: string; description: string};
    }): Promise<GroupRule> {
        return this.feedService.addGroupRule(payload.userId, payload.groupId, payload.rule);
    }

    @MessagePattern('RemoveGroupRule')
    async removeGroupRule(payload: {userId: string; groupId: string; ruleId: string}): Promise<{success: boolean}> {
        return this.feedService.removeGroupRule(payload.userId, payload.groupId, payload.ruleId);
    }
}
