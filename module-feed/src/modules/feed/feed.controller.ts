// module-feed/src/modules/feed/feed.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FeedService } from './feed.service';
import { NewsFeed } from '@/entities/news-feed.entity';
import { Post as PostEntity } from '@/entities/post.entity';
import { Story } from '@/entities/story.entity';
import { LiveStreamHistory } from '@/entities/live-stream-history.entity';
import { UserCommentsNewsFeed } from '@/entities/user-comments-news-feed.entity';
import { UserSharesNewsFeed } from '@/entities/user-shares-news-feed.entity';
import { UserViewsNewsFeed } from '@/entities/user-views-news-feed.entity';
import { UserReactsNewsFeed } from '@/entities/user-reacts-news-feed.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('feed')
@ApiBearerAuth()
@Controller('feed')
@UseGuards(JwtAuthGuard) // Apply auth guard to all routes
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  // News Feed Endpoints
  @Post('news-feed')
  async createNewsFeed(
    @AuthUser() user,
    @Body() data: Partial<NewsFeed>
  ): Promise<NewsFeed> {
    console.log(`User ${user.id} is creating a new feed`);
    return this.feedService.createNewsFeed(data);
  }

  @Get('news-feed')
  async getAllNewsFeeds(@AuthUser() user): Promise<NewsFeed[]> {
    console.log(`User ${user.id} is getting all feeds`);
    return this.feedService.getAllNewsFeeds();
  }

  @Get('news-feed/:id')
  async getNewsFeedById(
    @AuthUser() user,
    @Param('id', ParseIntPipe) id: number
  ): Promise<NewsFeed> {
    console.log(`User ${user.id} is getting feed with ID ${id}`);
    return this.feedService.getNewsFeedById(id);
  }

  @Put('news-feed/:id')
  async updateNewsFeed(
    @AuthUser() user,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<NewsFeed>
  ): Promise<NewsFeed> {
    console.log(`User ${user.id} is updating feed with ID ${id}`);
    return this.feedService.updateNewsFeed(id, data);
  }

  @Delete('news-feed/:id')
  async deleteNewsFeed(
    @AuthUser() user,
    @Param('id', ParseIntPipe) id: number
  ): Promise<void> {
    console.log(`User ${user.id} is deleting feed with ID ${id}`);
    return this.feedService.deleteNewsFeed(id);
  }

  // Post Endpoints
  @Post('news-feed/:id/post')
  async createPost(
    @AuthUser() user,
    @Param('id', ParseIntPipe) newsFeedId: number,
    @Body() postData: Partial<PostEntity>
  ): Promise<PostEntity> {
    console.log(`User ${user.id} is creating a post in feed ${newsFeedId}`);
    return this.feedService.createPost(newsFeedId, postData);
  }

  // Add @AuthUser() to all your other endpoints...

  // Example for the remaining endpoints:
  @Get('news-feed/:id/posts')
  async getPostsByNewsFeedId(
    @AuthUser() user,
    @Param('id', ParseIntPipe) newsFeedId: number
  ): Promise<PostEntity[]> {
    return this.feedService.getPostsByNewsFeedId(newsFeedId);
  }
}