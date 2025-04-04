import {Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put, UseGuards} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {lastValueFrom} from 'rxjs';

import {CurrentUser} from '@/decorators/user.decorator';
import {CreatePostDto} from '@/dtos/feed-module/create-post.dto';
import {LiveStreamHistory} from '@/entities/feed-module/local/live-stream-history.entity';
import {NewsFeed} from '@/entities/feed-module/local/newsfeed.entity';
import {Post as PostEntity} from '@/entities/feed-module/local/post.entity';
import {Story} from '@/entities/feed-module/local/story.entity';
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
    @ApiResponse({status: 400, description: 'Bad Request'})
    async createNewsFeed(@CurrentUser() user, @Body() data: Partial<NewsFeed>): Promise<NewsFeed> {
        return await lastValueFrom(this.feedClient.send('CreateNewsFeedCommand', {id: user.id, data}));
    }

    // for testing purposes only
    @Get('news-feed')
    @ApiOperation({summary: 'Get all news feeds'})
    async getAllNewsFeeds(): Promise<NewsFeed[]> {
        return await lastValueFrom(this.feedClient.send('GetAllNewsFeedCommand', {}));
    }

    @Get('news-feed/user')
    @ApiOperation({summary: 'Get all posts in a newsfeed of a user'})
    async getAllNewsFeedsOfUser(@CurrentUser() user): Promise<NewsFeed[]> {
        console.log(`User ${user.id} is getting all posts of user ${user.id}`);
        return await lastValueFrom(this.feedClient.send('GetAllPostOfUserCommand', {id: user.id}));
    }

    @Get('news-feed/random')
    @ApiOperation({summary: 'Get a random news feed'})
    async getRandomNewsFeed(): Promise<NewsFeed> {
        return await lastValueFrom(this.feedClient.send('GetRandomNewsFeedCommand', {}));
    }

    @Get('news-feed/:id')
    @ApiOperation({summary: 'Get a news feed by ID'})
    async getNewsFeedById(@CurrentUser() user, @Param('id') id: string): Promise<NewsFeed> {
        console.log(`User ${user.id} is getting feed with ID ${id}`);
        return await lastValueFrom(this.feedClient.send('GetByIdNewsFeedCommand', {id}));
    }

    @Get('news-feed/:id/posts')
    @ApiOperation({summary: 'Get all posts in a news feed'})
    async getPostsByNewsFeedId(@Param('id') newsFeedId: string): Promise<PostEntity[]> {
        return await lastValueFrom(this.feedClient.send('GetPostsByIdNewsFeedCommand', {newsFeedId}));
    }

    @Post('news-feed/:id/post')
    @ApiOperation({summary: 'Create a post in a news feed'})
    @ApiBody({
        description: 'Post data',
        type: CreatePostDto,
    })
    async createPost(
        @CurrentUser() user,
        @Param('id') newsFeedId: string,
        @Body() postData: CreatePostDto
    ): Promise<PostEntity> {
        console.log(`User ${user.id} is creating a post in feed ${newsFeedId}`);
        return await lastValueFrom(this.feedClient.send('CreatePostNewsFeedCommand', {newsFeedId, postData}));
    }

    @Patch('news-feed/:id/posts')
    @ApiOperation({summary: 'Update a post in a news feed'})
    @ApiBody({
        description: 'Post data',
        type: CreatePostDto,
    })
    async updatePost(@Param('id') postId: string, @Body() postData: Partial<PostEntity>): Promise<PostEntity> {
        return await lastValueFrom(this.feedClient.send('UpdatePostNewsFeedCommand', {postId, postData}));
    }

    @Delete('news-feed/:id/posts')
    @ApiOperation({summary: 'Delete a post in a news feed'})
    async deletePost(@Param('id') postId: string): Promise<void> {
        return await lastValueFrom(this.feedClient.send('DeletePostNewsFeedCommand', {postId}));
    }

    @Post('news-feed/:id/story')
    @ApiOperation({summary: 'Create a story in a news feed'})
    async createStory(
        @CurrentUser() user,
        @Param('id') newsFeedId: string,
        @Body() storyData: Partial<Story>
    ): Promise<Story> {
        return await lastValueFrom(this.feedClient.send('CreateStoryNewsFeedCommand', {newsFeedId, storyData}));
    }

    @Get('news-feed/:id/stories')
    @ApiOperation({summary: 'Get all stories in a news feed'})
    async getStoriesByNewsFeedId(@CurrentUser() user, @Param('id') newsFeedId: string): Promise<Story[]> {
        return await lastValueFrom(this.feedClient.send('GetStoriesByIdNewsFeedCommand', {newsFeedId}));
    }

    @Post('news-feed/:id/livestream')
    @ApiOperation({summary: 'Start a livestream in a news feed'})
    async createLiveStream(
        @CurrentUser() user,
        @Param('id') newsFeedId: string,
        @Body() streamData: Partial<LiveStreamHistory>
    ): Promise<LiveStreamHistory> {
        return await lastValueFrom(this.feedClient.send('CreateLiveStreamCommand', {newsFeedId, streamData}));
    }

    @Put('livestream/:id/end')
    @ApiOperation({summary: 'End a livestream'})
    async endLiveStream(
        @CurrentUser() user,
        @Param('id') streamId: string,
        @Body('endTime') endTime: Date
    ): Promise<LiveStreamHistory> {
        return await lastValueFrom(this.feedClient.send('EndLiveStreamCommand', {streamId, endTime}));
    }

    // @Get('news-feed/:id/stats')
    // @ApiOperation({summary: 'Get engagement statistics for a news feed'})
    // async getEngagementStats(@CurrentUser() user, @Param('id') newsFeedId: string): Promise<any> {
    //     return await lastValueFrom(this.feedClient.send('GetEngagementStatsCommand', {newsFeedId}));
    // }
}
