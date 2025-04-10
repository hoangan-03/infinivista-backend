import {Body, Controller, Delete, Get, Inject, Param, Patch, Post, UseGuards} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags} from '@nestjs/swagger';
import {lastValueFrom} from 'rxjs';

import {CurrentUser} from '@/decorators/user.decorator';
import {CommentPostDto} from '@/dtos/feed-module/comment-post.dto';
import {CreatePostDto} from '@/dtos/feed-module/create-post.dto';
import {CreateStoryDto} from '@/dtos/feed-module/create-story.dto';
import {Comment} from '@/entities/feed-module/local/comment.entity';
import {NewsFeed} from '@/entities/feed-module/local/newsfeed.entity';
import {Post as PostEntity} from '@/entities/feed-module/local/post.entity';
import {Story} from '@/entities/feed-module/local/story.entity';
import {UserReactPost} from '@/entities/feed-module/local/user-react-post.entity';
import {ReactionType} from '@/enums/feed-module/reaction-type';
import {JWTAuthGuard} from '@/guards/jwt-auth.guard';
import {JwtBlacklistGuard} from '@/guards/jwt-blacklist.guard';

@ApiTags('Feed')
@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard, JWTAuthGuard)
@Controller('feed')
export class FeedController {
    constructor(@Inject('FEED_SERVICE') private feedClient: ClientProxy) {}

    @Post('news-feed')
    @ApiOperation({summary: 'Create a new news feed'})
    @ApiResponse({status: 201, description: 'The news feed has been successfully created.'})
    @ApiResponse({status: 400, description: 'User already has a news feed.'})
    @ApiResponse({status: 401, description: 'Unauthorized'})
    async createNewsFeed(@CurrentUser() user, @Body() data: Partial<NewsFeed>): Promise<NewsFeed> {
        return await lastValueFrom(this.feedClient.send('CreateNewsFeedCommand', {id: user.id, data}));
    }

    @Get('news-feed')
    @ApiOperation({summary: 'Get new feed of current user'})
    async getAllNewsFeeds(@CurrentUser() user): Promise<NewsFeed[]> {
        return await lastValueFrom(this.feedClient.send('GetByIdNewsFeedCommand', {id: user.id}));
    }

    @Get('news-feed/random')
    @ApiOperation({summary: 'Get a random news feed'})
    async getRandomNewsFeed(): Promise<NewsFeed> {
        return await lastValueFrom(this.feedClient.send('GetRandomNewsFeedCommand', {}));
    }

    @Post('news-feed/post')
    @ApiOperation({summary: 'Create a post in a news feed'})
    @ApiBody({
        description: 'Post data',
        type: CreatePostDto,
    })
    async createPost(@Param('id') newsFeedId: string, @Body() postData: CreatePostDto): Promise<PostEntity> {
        return await lastValueFrom(this.feedClient.send('CreatePostNewsFeedCommand', {newsFeedId, postData}));
    }

    @Patch('news-feed/posts')
    @ApiOperation({summary: 'Update a post in a news feed'})
    @ApiBody({
        description: 'Post data',
        type: CreatePostDto,
    })
    async updatePost(@Param('id') postId: string, @Body() postData: CreatePostDto): Promise<PostEntity> {
        return await lastValueFrom(this.feedClient.send('UpdatePostNewsFeedCommand', {postId, postData}));
    }

    @Delete('news-feed/posts')
    @ApiOperation({summary: 'Delete a post in a news feed'})
    async deletePost(@Param('id') postId: string): Promise<void> {
        return await lastValueFrom(this.feedClient.send('DeletePostNewsFeedCommand', {postId}));
    }

    @Post('news-feed/story')
    @ApiBody({
        description: 'Story data',
        type: CreateStoryDto,
    })
    @ApiOperation({summary: 'Create a story in a news feed'})
    async createStory(@Param('id') newsFeedId: string, @Body() storyData: CreateStoryDto): Promise<Story> {
        return await lastValueFrom(this.feedClient.send('CreateStoryNewsFeedCommand', {newsFeedId, storyData}));
    }

    @Get('news-feed/posts/:id')
    @ApiOperation({summary: 'Get a post by ID'})
    @ApiResponse({
        status: 200,
        description: 'The post has been successfully retrieved.',
        type: PostEntity,
    })
    async getPostById(@Param('id') postId: string): Promise<PostEntity> {
        return await lastValueFrom(this.feedClient.send('GetAPostByIdCommand', {postId}));
    }

    @Get('news-feed/stories/:id')
    @ApiOperation({summary: 'Get a story by ID'})
    @ApiResponse({
        status: 200,
        description: 'The story has been successfully retrieved.',
        type: Story,
    })
    async getStoryById(@Param('id') storyId: string): Promise<Story> {
        return await lastValueFrom(this.feedClient.send('GetAStoryByIdCommand', {storyId}));
    }

    @Get('news-feed/:id')
    @ApiOperation({summary: 'Get a news feed by user ID'})
    async getNewsFeedById(@Param('id') id: string): Promise<NewsFeed> {
        return await lastValueFrom(this.feedClient.send('GetByIdNewsFeedCommand', {id}));
    }

    @Get('news-feed/:id/posts')
    @ApiOperation({summary: 'Get all posts in a news feed of a user'})
    async getPostsByNewsFeedId(@Param('id') userId: string): Promise<PostEntity[]> {
        return await lastValueFrom(this.feedClient.send('GetPostsByIdNewsFeedCommand', {userId}));
    }

    @Get('news-feed/:id/stories')
    @ApiOperation({summary: 'Get all stories in a news feed of a user'})
    async getStoriesByNewsFeedId(@Param('id') newsFeedId: string): Promise<Story[]> {
        return await lastValueFrom(this.feedClient.send('GetStoriesByIdNewsFeedCommand', {newsFeedId}));
    }

    // Comment endpoints
    @Post('post/:postId/comment')
    @ApiOperation({summary: 'Add a comment to a post'})
    @ApiParam({name: 'postId', description: 'ID of the post'})
    @ApiBody({
        description: 'Comment data',
        type: CommentPostDto,
    })
    @ApiResponse({status: 201, description: 'Comment created successfully', type: Comment})
    async createComment(
        @CurrentUser() user,
        @Param('postId') postId: string,
        @Body('text') text: string,
        @Body('attachmentUrl') attachmentUrl?: string
    ): Promise<Comment> {
        return await lastValueFrom(
            this.feedClient.send('CreateCommentCommand', {
                postId,
                userId: user.id,
                text,
                attachmentUrl,
            })
        );
    }

    @Get('post/:postId/comments')
    @ApiOperation({summary: 'Get all comments for a post'})
    @ApiParam({name: 'postId', description: 'ID of the post'})
    @ApiResponse({status: 200, description: 'List of comments', type: [Comment]})
    @ApiResponse({status: 404, description: 'Post not found'})
    async getCommentsByPostId(@Param('postId') postId: string): Promise<Comment[]> {
        return await lastValueFrom(this.feedClient.send('GetCommentsByPostIdCommand', {postId}));
    }

    @Patch('comment/:commentId')
    @ApiOperation({summary: 'Update a comment'})
    @ApiParam({name: 'commentId', description: 'ID of the comment'})
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                text: {
                    type: 'string',
                    example: 'Updated comment text',
                },
                attachmentUrl: {
                    type: 'string',
                    example: 'https://example.com/new-image.jpg',
                },
            },
            required: ['text'],
        },
    })
    @ApiResponse({status: 200, description: 'Comment updated successfully', type: Comment})
    @ApiResponse({status: 404, description: 'Comment not found'})
    async updateComment(
        @CurrentUser() user,
        @Param('commentId') commentId: string,
        @Body('text') text: string,
        @Body('attachmentUrl') attachmentUrl?: string
    ): Promise<Comment> {
        return await lastValueFrom(
            this.feedClient.send('UpdateCommentCommand', {
                commentId,
                userId: user.id,
                text,
                attachmentUrl,
            })
        );
    }

    @Delete('comment/:commentId')
    @ApiOperation({summary: 'Delete a comment'})
    @ApiParam({name: 'commentId', description: 'ID of the comment'})
    @ApiResponse({status: 200, description: 'Comment deleted successfully'})
    @ApiResponse({status: 404, description: 'Comment not found'})
    async deleteComment(@CurrentUser() user, @Param('commentId') commentId: string): Promise<Comment> {
        return await lastValueFrom(
            this.feedClient.send('DeleteCommentCommand', {
                commentId,
                userId: user.id,
            })
        );
    }

    // Reaction endpoints
    @Post('post/:postId/reaction')
    @ApiOperation({summary: 'Add a reaction to a post'})
    @ApiParam({name: 'postId', description: 'ID of the post'})
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                reactionType: {
                    type: 'string',
                    enum: Object.values(ReactionType),
                    example: ReactionType.LIKE,
                },
            },
            required: ['reactionType'],
        },
    })
    @ApiResponse({status: 201, description: 'Reaction added successfully'})
    @ApiResponse({status: 403, description: 'User cannot react to their own post'})
    @ApiResponse({status: 404, description: 'Post not found'})
    async addReaction(
        @CurrentUser() user,
        @Param('postId') postId: string,
        @Body('reactionType') reactionType: ReactionType
    ): Promise<UserReactPost> {
        return await lastValueFrom(
            this.feedClient.send('AddReactionCommand', {
                userId: user.id,
                postId,
                reactionType,
            })
        );
    }

    @Get('post/:postId/reactions')
    @ApiOperation({summary: 'Get all reactions for a post'})
    @ApiParam({name: 'postId', description: 'ID of the post'})
    @ApiResponse({status: 200, description: 'List of reactions', type: [UserReactPost]})
    async getReactionsByPostId(@Param('postId') postId: string): Promise<UserReactPost[]> {
        return await lastValueFrom(this.feedClient.send('GetReactionsByPostIdCommand', {postId}));
    }

    @Delete('post/:postId/reaction')
    @ApiOperation({summary: 'Remove your reaction from a post'})
    @ApiParam({name: 'postId', description: 'ID of the post'})
    @ApiResponse({status: 200, description: 'Reaction removed successfully'})
    @ApiResponse({status: 404, description: 'Reaction not found'})
    async removeReaction(@CurrentUser() user, @Param('postId') postId: string): Promise<{success: boolean}> {
        return await lastValueFrom(
            this.feedClient.send('RemoveReactionCommand', {
                postId,
                userId: user.id,
            })
        );
    }

    @Get('post/:postId/reaction-counts')
    @ApiOperation({summary: 'Get reaction counts by type for a post'})
    @ApiParam({name: 'postId', description: 'ID of the post'})
    @ApiResponse({status: 200, description: 'Reaction counts by type', type: Object})
    @ApiResponse({status: 404, description: 'Post not found'})
    async getReactionCountByType(@Param('postId') postId: string): Promise<Record<ReactionType, number>> {
        return await lastValueFrom(this.feedClient.send('GetReactionCountByTypeCommand', {postId}));
    }
}
