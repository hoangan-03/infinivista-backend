import {Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, UseGuards} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {lastValueFrom} from 'rxjs';

import {CurrentUser} from '@/decorators/user.decorator';
import {LiveStreamHistory} from '@/entities/feed-module/local/live-stream-history.entity';
import {NewsFeed} from '@/entities/feed-module/local/news-feed.entity';
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

    @Get('news-feed')
    @ApiOperation({summary: 'Get all news feeds'})
    async getAllNewsFeeds(@CurrentUser() user): Promise<NewsFeed[]> {
        console.log(`User ${user.id} is getting all feeds`);
        return await lastValueFrom(this.feedClient.send('GetAllNewsFeedCommand', {}));
    }

    @Get('news-feed/user')
    @ApiOperation({summary: 'Get all news feeds of a user'})
    async getAllNewsFeedsOfUser(@CurrentUser() user): Promise<NewsFeed[]> {
        console.log(`User ${user.id} is getting all feeds of user ${user.id}`);
        return await lastValueFrom(this.feedClient.send('GetAllNewsFeedOfUserCommand', {id: user.id}));
    }

    @Get('news-feed/:id')
    @ApiOperation({summary: 'Get a news feed by ID'})
    async getNewsFeedById(@CurrentUser() user, @Param('id', ParseIntPipe) id: number): Promise<NewsFeed> {
        console.log(`User ${user.id} is getting feed with ID ${id}`);
        return await lastValueFrom(this.feedClient.send('GetByIdNewsFeedCommand', {id}));
    }

    @Put('news-feed/:id')
    @ApiOperation({summary: 'Update a news feed'})
    async updateNewsFeed(
        @CurrentUser() user,
        @Param('id', ParseIntPipe) id: number,
        @Body() data: Partial<NewsFeed>
    ): Promise<NewsFeed> {
        console.log(`User ${user.id} is updating feed with ID ${id}`);
        return await lastValueFrom(this.feedClient.send('UpdateNewsFeedCommand', {id, data}));
    }

    @Delete('news-feed/:id')
    @ApiOperation({summary: 'Delete a news feed'})
    async deleteNewsFeed(@CurrentUser() user, @Param('id', ParseIntPipe) id: number): Promise<void> {
        console.log(`User ${user.id} is deleting feed with ID ${id}`);
        return await lastValueFrom(this.feedClient.send('DeleteNewsFeedCommand', {id}));
    }

    // Post Endpoints
    @Post('news-feed/:id/post')
    @ApiOperation({summary: 'Create a post in a news feed'})
    async createPost(
        @CurrentUser() user,
        @Param('id', ParseIntPipe) newsFeedId: number,
        @Body() postData: Partial<PostEntity>
    ): Promise<PostEntity> {
        console.log(`User ${user.id} is creating a post in feed ${newsFeedId}`);
        return await lastValueFrom(this.feedClient.send('CreatePostNewsFeedCommand', {newsFeedId, postData}));
    }

    @Get('news-feed/:id/posts')
    @ApiOperation({summary: 'Get all posts in a news feed'})
    async getPostsByNewsFeedId(
        @CurrentUser() user,
        @Param('id', ParseIntPipe) newsFeedId: number
    ): Promise<PostEntity[]> {
        return await lastValueFrom(this.feedClient.send('GetPostsByIdNewsFeedCommand', {newsFeedId}));
    }

    @Post('news-feed/:id/story')
    @ApiOperation({summary: 'Create a story in a news feed'})
    async createStory(
        @CurrentUser() user,
        @Param('id', ParseIntPipe) newsFeedId: number,
        @Body() storyData: Partial<Story>
    ): Promise<Story> {
        return await lastValueFrom(this.feedClient.send('CreateStoryNewsFeedCommand', {newsFeedId, storyData}));
    }

    @Get('news-feed/:id/stories')
    @ApiOperation({summary: 'Get all stories in a news feed'})
    async getStoriesByNewsFeedId(@CurrentUser() user, @Param('id', ParseIntPipe) newsFeedId: number): Promise<Story[]> {
        return await lastValueFrom(this.feedClient.send('GetStoriesByIdNewsFeedCommand', {newsFeedId}));
    }

    @Post('news-feed/:id/livestream')
    @ApiOperation({summary: 'Start a livestream in a news feed'})
    async createLiveStream(
        @CurrentUser() user,
        @Param('id', ParseIntPipe) newsFeedId: number,
        @Body() streamData: Partial<LiveStreamHistory>
    ): Promise<LiveStreamHistory> {
        return await lastValueFrom(this.feedClient.send('CreateLiveStreamCommand', {newsFeedId, streamData}));
    }

    @Put('livestream/:id/end')
    @ApiOperation({summary: 'End a livestream'})
    async endLiveStream(
        @CurrentUser() user,
        @Param('id', ParseIntPipe) streamId: number,
        @Body('endTime') endTime: Date
    ): Promise<LiveStreamHistory> {
        return await lastValueFrom(this.feedClient.send('EndLiveStreamCommand', {streamId, endTime}));
    }

    // @Get('news-feed/:id/stats')
    // @ApiOperation({summary: 'Get engagement statistics for a news feed'})
    // async getEngagementStats(@CurrentUser() user, @Param('id', ParseIntPipe) newsFeedId: number): Promise<any> {
    //     return await lastValueFrom(this.feedClient.send('GetEngagementStatsCommand', {newsFeedId}));
    // }
}
