import {
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Param,
    Patch,
    Post,
    Query,
    UploadedFile,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {FileInterceptor, FilesInterceptor} from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {lastValueFrom} from 'rxjs';

import {CurrentUser} from '@/decorators/user.decorator';
import {PaginationDto} from '@/dtos/common/pagination.dto';
import {CreatePostDto} from '@/dtos/feed-module/create-post.dto';
import {CreateStoryDto} from '@/dtos/feed-module/create-story.dto';
import {Comment} from '@/entities/feed-module/local/comment.entity';
import {LiveStreamHistory} from '@/entities/feed-module/local/live-stream-history.entity';
import {NewsFeed} from '@/entities/feed-module/local/newsfeed.entity';
import {Post as PostEntity} from '@/entities/feed-module/local/post.entity';
import {Reel} from '@/entities/feed-module/local/reel.entity';
import {Story} from '@/entities/feed-module/local/story.entity';
import {UserReactPost} from '@/entities/feed-module/local/user-react-post.entity';
import {UserReactStory} from '@/entities/feed-module/local/user-react-story.entity';
import {AttachmentType} from '@/enums/feed-module/attachment-type.enum';
import {ReactionType} from '@/enums/feed-module/reaction-type.enum';
import {JWTAuthGuard} from '@/guards/jwt-auth.guard';
import {JwtBlacklistGuard} from '@/guards/jwt-blacklist.guard';
import {PaginationResponseInterface} from '@/interfaces/common/pagination-response.interface';
import {FileUploadService} from '@/services/file-upload.service';

@ApiTags('Feed')
@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard, JWTAuthGuard)
@Controller('feed')
export class FeedController {
    constructor(
        @Inject('FEED_SERVICE') private feedClient: ClientProxy,
        private fileUploadService: FileUploadService
    ) {}

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

    @Get('news-feed/disover')
    @ApiOperation({summary: 'Get news feed "Discover" - popular posts'})
    @ApiQuery({type: PaginationDto})
    async getPopularNewsFeed(
        @CurrentUser() user,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<PostEntity>> {
        return await lastValueFrom(
            this.feedClient.send('GetPopularNewsFeedCommand', {
                id: user.id,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Get('news-feed/friends')
    @ApiOperation({summary: 'Get news feed "Friends" - posts from friends'})
    @ApiQuery({type: PaginationDto})
    async getFriendsNewsFeed(
        @CurrentUser() user,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<PostEntity>> {
        return await lastValueFrom(
            this.feedClient.send('GetFriendsNewsFeedCommand', {
                id: user.id,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Get('news-feed/foryou')
    @ApiOperation({summary: 'Get a news feed "For you" - random posts'})
    @ApiQuery({type: PaginationDto})
    async getRandomNewsFeed(
        @CurrentUser() user,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<PostEntity>> {
        return await lastValueFrom(
            this.feedClient.send('GetRandomNewsFeedCommand', {
                id: user.id,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Post('news-feed/post')
    @ApiOperation({summary: 'Create a post in a news feed'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'Content of the post',
                    example: 'This is a sample post content',
                },
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                },
                newsFeedId: {
                    type: 'string',
                    description: 'ID of the news feed',
                    example: '3dbbc955-92e7-4fef-acb6-206b27fd1d50',
                },
                attachmentTypes: {
                    type: 'string',
                    description: 'Comma-separated list of attachment types',
                    example: AttachmentType.IMAGE + ',' + AttachmentType.VIDEO,
                },
            },
            required: ['content', 'newsFeedId'],
        },
    })
    @UseInterceptors(FilesInterceptor('files', 10)) // Allow up to 10 files per post
    async createPost(
        @Body('content') content: string,
        @Body('newsFeedId') newsFeedId: string,
        @Body('attachmentTypes') attachmentTypesStr: string,
        @UploadedFiles() files: Array<Express.Multer.File>
    ): Promise<PostEntity> {
        // Parse the comma-separated attachment types
        const attachmentTypes: AttachmentType[] = attachmentTypesStr
            ? attachmentTypesStr.split(',').map((type) => type.trim() as AttachmentType)
            : [];

        const fileUploadResponses: Array<{url: string; fileName: string; mimeType: string}> = [];

        // Upload each file to Google Drive if files exist
        if (files && files.length > 0) {
            for (const file of files) {
                const fileUrl = await this.fileUploadService.uploadFile(
                    file.buffer,
                    file.originalname,
                    file.mimetype,
                    'feed'
                );

                fileUploadResponses.push({
                    url: fileUrl,
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                });
            }
        }

        // Create post data with content only
        const postData: CreatePostDto = {
            content,
        };

        return await lastValueFrom(
            this.feedClient.send('CreatePostAfterUploadingFilesCommand', {
                newsFeedId,
                postData,
                files: fileUploadResponses,
                attachmentType: attachmentTypes,
            })
        );
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
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                newsFeedId: {
                    type: 'string',
                    description: 'ID of the news feed',
                    example: '3dbbc955-92e7-4fef-acb6-206b27fd1d50',
                },
                duration: {type: 'number', example: 15},
                file: {
                    type: 'string',
                    format: 'binary',
                },
                attachmentType: {
                    type: 'string',
                    enum: Object.values(AttachmentType),
                    example: AttachmentType.IMAGE,
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({summary: 'Create a story in a news feed'})
    async createStory(
        @Body('newsFeedId') newsFeedId: string,
        @Body('duration') duration: number,
        @Body('attachmentType') attachmentType: AttachmentType,
        @UploadedFile() file: Express.Multer.File
    ): Promise<Story> {
        // Upload file to Google Drive
        const storyUrl = await this.fileUploadService.uploadFile(file.buffer, file.originalname, file.mimetype, 'feed');

        // Create story DTO
        const storyData: CreateStoryDto = {
            story_url: storyUrl,
            duration: duration || 15, // Default to 15 seconds if not specified
            attachmentType,
        };

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
    @ApiOperation({summary: 'Get paginated posts in a news feed of a user'})
    @ApiQuery({type: PaginationDto})
    async getPostsByNewsFeedId(
        @Param('id') newsfeedId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<PostEntity>> {
        return await lastValueFrom(
            this.feedClient.send('GetPostsByIdNewsFeedCommand', {
                newsfeedId,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Get('news-feed/:id/stories')
    @ApiOperation({summary: 'Get paginated stories in a news feed of a user'})
    @ApiQuery({type: PaginationDto})
    async getStoriesByNewsFeedId(
        @Param('id') newsFeedId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<Story>> {
        return await lastValueFrom(
            this.feedClient.send('GetStoriesByIdNewsFeedCommand', {
                newsFeedId,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Get('news-feed/:id/livestreams')
    @ApiOperation({summary: 'Get paginated live streams in a feed of a user'})
    @ApiParam({name: 'id', description: 'ID of the news feed'})
    @ApiQuery({type: PaginationDto})
    async getLiveStreamsByNewsFeedId(
        @Param('id') newsFeedId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<LiveStreamHistory>> {
        return await lastValueFrom(
            this.feedClient.send('GetLiveStreamsByNewsFeedIdCommand', {
                newsFeedId,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    // Comment endpoints
    @Post('post/:postId/comment')
    @ApiOperation({summary: 'Add a comment to a post'})
    @ApiParam({name: 'postId', description: 'ID of the post'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                text: {type: 'string', example: 'This is a comment'},
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
            required: ['text'],
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    @ApiResponse({status: 201, description: 'Comment created successfully', type: Comment})
    async createComment(
        @CurrentUser() user,
        @Param('postId') postId: string,
        @Body('text') text: string,
        @UploadedFile() file?: Express.Multer.File
    ): Promise<Comment> {
        let attachmentUrl;

        // Only upload if a file was provided
        if (file) {
            attachmentUrl = await this.fileUploadService.uploadFile(
                file.buffer,
                file.originalname,
                file.mimetype,
                'feed'
            );
        }

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
    @ApiOperation({summary: 'Get paginated comments for a post'})
    @ApiParam({name: 'postId', description: 'ID of the post'})
    @ApiQuery({type: PaginationDto})
    @ApiResponse({status: 200, description: 'List of comments', type: [Comment]})
    @ApiResponse({status: 404, description: 'Post not found'})
    async getCommentsByPostId(
        @Param('postId') postId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<Comment>> {
        return await lastValueFrom(
            this.feedClient.send('GetCommentsByPostIdCommand', {
                postId,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Patch('comment/:commentId')
    @ApiOperation({summary: 'Update a comment'})
    @ApiParam({name: 'commentId', description: 'ID of the comment'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                text: {type: 'string'},
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
            required: ['text'],
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    @ApiResponse({status: 200, description: 'Comment updated successfully', type: Comment})
    @ApiResponse({status: 404, description: 'Comment not found'})
    async updateComment(
        @CurrentUser() user,
        @Param('commentId') commentId: string,
        @Body('text') text: string,
        @UploadedFile() file?: Express.Multer.File
    ): Promise<Comment> {
        let attachmentUrl;

        // Only upload if a file was provided
        if (file) {
            attachmentUrl = await this.fileUploadService.uploadFile(
                file.buffer,
                file.originalname,
                file.mimetype,
                'feed'
            );
        }

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

    @Get('user/:userId/reels')
    @ApiOperation({summary: 'Get paginated random reels of a user'})
    @ApiParam({name: 'userId', description: 'ID of the user'})
    @ApiQuery({type: PaginationDto})
    async getRandomReelsByUserId(
        @Param('userId') userId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<Reel>> {
        return await lastValueFrom(
            this.feedClient.send('GetRandomReelsByUserIdCommand', {
                userId,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    // Story Comment endpoints
    @Post('story/:storyId/comment')
    @ApiOperation({summary: 'Add a comment to a story'})
    @ApiParam({name: 'storyId', description: 'ID of the story'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                text: {type: 'string', example: 'This is a story comment'},
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
            required: ['text'],
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    @ApiResponse({status: 201, description: 'Comment created successfully', type: Comment})
    async createStoryComment(
        @CurrentUser() user,
        @Param('storyId') storyId: string,
        @Body('text') text: string,
        @UploadedFile() file?: Express.Multer.File
    ): Promise<Comment> {
        let attachmentUrl;

        // Only upload if a file was provided
        if (file) {
            attachmentUrl = await this.fileUploadService.uploadFile(
                file.buffer,
                file.originalname,
                file.mimetype,
                'feed'
            );
        }

        return await lastValueFrom(
            this.feedClient.send('CreateStoryCommentCommand', {
                storyId,
                userId: user.id,
                text,
                attachmentUrl,
            })
        );
    }

    @Get('story/:storyId/comments')
    @ApiOperation({summary: 'Get paginated comments for a story'})
    @ApiParam({name: 'storyId', description: 'ID of the story'})
    @ApiQuery({type: PaginationDto})
    @ApiResponse({status: 200, description: 'List of comments', type: [Comment]})
    @ApiResponse({status: 404, description: 'Story not found'})
    async getCommentsByStoryId(
        @Param('storyId') storyId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<Comment>> {
        return await lastValueFrom(
            this.feedClient.send('GetCommentsByStoryIdCommand', {
                storyId,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Patch('story/comment/:commentId')
    @ApiOperation({summary: 'Update a comment on a story'})
    @ApiParam({name: 'commentId', description: 'ID of the comment'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                text: {type: 'string'},
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
            required: ['text'],
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    @ApiResponse({status: 200, description: 'Comment updated successfully', type: Comment})
    @ApiResponse({status: 404, description: 'Comment not found'})
    async updateStoryComment(
        @CurrentUser() user,
        @Param('commentId') commentId: string,
        @Body('text') text: string,
        @UploadedFile() file?: Express.Multer.File
    ): Promise<Comment> {
        let attachmentUrl;

        // Only upload if a file was provided
        if (file) {
            attachmentUrl = await this.fileUploadService.uploadFile(
                file.buffer,
                file.originalname,
                file.mimetype,
                'feed'
            );
        }

        return await lastValueFrom(
            this.feedClient.send('UpdateStoryCommentCommand', {
                commentId,
                userId: user.id,
                text,
                attachmentUrl,
            })
        );
    }

    @Delete('story/comment/:commentId')
    @ApiOperation({summary: 'Delete a comment on a story'})
    @ApiParam({name: 'commentId', description: 'ID of the comment'})
    @ApiResponse({status: 200, description: 'Comment deleted successfully'})
    @ApiResponse({status: 404, description: 'Comment not found'})
    async deleteStoryComment(@CurrentUser() user, @Param('commentId') commentId: string): Promise<Comment> {
        return await lastValueFrom(
            this.feedClient.send('DeleteStoryCommentCommand', {
                commentId,
                userId: user.id,
            })
        );
    }

    // Story Reaction endpoints
    @Post('story/:storyId/reaction')
    @ApiOperation({summary: 'Add a reaction to a story'})
    @ApiParam({name: 'storyId', description: 'ID of the story'})
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
    @ApiResponse({status: 404, description: 'Story not found'})
    async addStoryReaction(
        @CurrentUser() user,
        @Param('storyId') storyId: string,
        @Body('reactionType') reactionType: ReactionType
    ): Promise<UserReactStory> {
        return await lastValueFrom(
            this.feedClient.send('AddStoryReactionCommand', {
                userId: user.id,
                storyId,
                reactionType,
            })
        );
    }

    @Get('story/:storyId/reactions')
    @ApiOperation({summary: 'Get all reactions for a story'})
    @ApiParam({name: 'storyId', description: 'ID of the story'})
    @ApiResponse({status: 200, description: 'List of reactions', type: [UserReactStory]})
    async getReactionsByStoryId(@Param('storyId') storyId: string): Promise<UserReactStory[]> {
        return await lastValueFrom(this.feedClient.send('GetReactionsByStoryIdCommand', {storyId}));
    }

    @Delete('story/:storyId/reaction')
    @ApiOperation({summary: 'Remove your reaction from a story'})
    @ApiParam({name: 'storyId', description: 'ID of the story'})
    @ApiResponse({status: 200, description: 'Reaction removed successfully'})
    @ApiResponse({status: 404, description: 'Reaction not found'})
    async removeStoryReaction(@CurrentUser() user, @Param('storyId') storyId: string): Promise<{success: boolean}> {
        return await lastValueFrom(
            this.feedClient.send('RemoveStoryReactionCommand', {
                storyId,
                userId: user.id,
            })
        );
    }

    @Get('story/:storyId/reaction-counts')
    @ApiOperation({summary: 'Get reaction counts by type for a story'})
    @ApiParam({name: 'storyId', description: 'ID of the story'})
    @ApiResponse({status: 200, description: 'Reaction counts by type', type: Object})
    @ApiResponse({status: 404, description: 'Story not found'})
    async getStoryReactionCountByType(@Param('storyId') storyId: string): Promise<Record<ReactionType, number>> {
        return await lastValueFrom(this.feedClient.send('GetStoryReactionCountByTypeCommand', {storyId}));
    }
}
