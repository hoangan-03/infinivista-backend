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
import {LiveStreamHistory} from '@/entities/feed-module/local/live-stream-history.entity';
import {NewsFeed} from '@/entities/feed-module/local/newsfeed.entity';
import {Post as PostEntity} from '@/entities/feed-module/local/post.entity';
import {Story} from '@/entities/feed-module/local/story.entity';
import {AttachmentType} from '@/enums/feed-module/attachment-type.enum';
import {JWTAuthGuard} from '@/guards/jwt-auth.guard';
import {JwtBlacklistGuard} from '@/guards/jwt-blacklist.guard';
import {PaginationResponseInterface} from '@/interfaces/common/pagination-response.interface';
import {FileUploadService} from '@/services/file-upload.service';

@ApiTags('Newsfeed')
@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard, JWTAuthGuard)
@Controller('newsfeed')
export class NewsFeedController {
    constructor(
        @Inject('FEED_SERVICE') private feedClient: ClientProxy,
        private fileUploadService: FileUploadService
    ) {}

    @Post('')
    @ApiOperation({summary: 'Create a new news feed'})
    @ApiResponse({status: 201, description: 'The news feed has been successfully created.'})
    @ApiResponse({status: 400, description: 'User already has a news feed.'})
    @ApiResponse({status: 401, description: 'Unauthorized'})
    async createNewsFeed(@CurrentUser() user, @Body() data: Partial<NewsFeed>): Promise<NewsFeed> {
        return await lastValueFrom(this.feedClient.send('CreateNewsFeedCommand', {id: user.id, data}));
    }

    @Get('')
    @ApiOperation({summary: 'Get new feed of current user'})
    async getAllNewsFeeds(@CurrentUser() user): Promise<NewsFeed[]> {
        return await lastValueFrom(this.feedClient.send('GetByIdNewsFeedCommand', {id: user.id}));
    }

    @Get('/discover')
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

    @Get('/friends')
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

    @Get('/foryou')
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

    @Post('/story')
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
                thumbnail_file: {
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
        @UploadedFile() file: Express.Multer.File,
        @UploadedFile() thumbnailFile: Express.Multer.File
    ): Promise<Story> {
        // Upload file to Google Drive
        const story_url = await this.fileUploadService.uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            'feed'
        );
        const thumbnail_url = await this.fileUploadService.uploadFile(
            thumbnailFile.buffer,
            thumbnailFile.originalname,
            thumbnailFile.mimetype,
            'feed'
        );
        // Create story DTO
        const storyData: CreateStoryDto = {
            story_url,
            thumbnail_url,
            duration,
            attachmentType,
        };

        return await lastValueFrom(this.feedClient.send('CreateStoryNewsFeedCommand', {newsFeedId, storyData}));
    }

    @Post('/post')
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

    @Patch('/posts/:id')
    @ApiParam({name: 'id', description: 'ID of the post'})
    @ApiOperation({summary: 'Update a post in a news feed'})
    @ApiBody({
        description: 'Post data',
        type: CreatePostDto,
    })
    async updatePost(@Param('id') postId: string, @Body() postData: CreatePostDto): Promise<PostEntity> {
        return await lastValueFrom(this.feedClient.send('UpdatePostNewsFeedCommand', {postId, postData}));
    }

    @Delete('/posts/:id')
    @ApiParam({name: 'id', description: 'ID of the post'})
    @ApiOperation({summary: 'Delete a post in a news feed'})
    async deletePost(@Param('id') postId: string): Promise<void> {
        return await lastValueFrom(this.feedClient.send('DeletePostNewsFeedCommand', {postId}));
    }

    @Get('/posts/:id')
    @ApiOperation({summary: 'Get a post by ID'})
    @ApiResponse({
        status: 200,
        description: 'The post has been successfully retrieved.',
        type: PostEntity,
    })
    async getPostById(@Param('id') postId: string): Promise<PostEntity> {
        return await lastValueFrom(this.feedClient.send('GetAPostByIdCommand', {postId}));
    }

    @Get('/stories/:id')
    @ApiOperation({summary: 'Get a story by ID'})
    @ApiResponse({
        status: 200,
        description: 'The story has been successfully retrieved.',
        type: Story,
    })
    async getStoryById(@Param('id') storyId: string): Promise<Story> {
        return await lastValueFrom(this.feedClient.send('GetAStoryByIdCommand', {storyId}));
    }

    @Delete('/stories/:id')
    @ApiOperation({summary: 'Delete a story by ID'})
    @ApiResponse({
        status: 200,
        description: 'The story has been successfully deleted.',
    })
    async deleteStory(@Param('id') storyId: string): Promise<void> {
        return await lastValueFrom(this.feedClient.send('DeleteStoryCommentCommand', {storyId}));
    }

    @Get('/:id')
    @ApiOperation({summary: 'Get a news feed by user ID'})
    async getNewsFeedById(@Param('id') id: string): Promise<NewsFeed> {
        return await lastValueFrom(this.feedClient.send('GetByIdNewsFeedCommand', {id}));
    }

    @Get('/:id/posts')
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

    @Get('/:id/stories')
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

    @Get('/:id/livestreams')
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
}
