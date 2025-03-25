import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {LiveStreamHistory} from '@/entities/local/live-stream-history.entity';
import {NewsFeed} from '@/entities/local/newsfeed.entity';
import {Post} from '@/entities/local/post.entity';
import {Reaction} from '@/entities/local/reaction.entity';
import {Story} from '@/entities/local/story.entity';

import {UserReferenceService} from '../user-reference/user-reference.service';

@Injectable()
export class FeedService {
    constructor(
        private readonly userReferenceService: UserReferenceService,
        @InjectRepository(NewsFeed)
        private readonly newsFeedRepository: Repository<NewsFeed>,
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
        @InjectRepository(Story)
        private readonly storyRepository: Repository<Story>,
        @InjectRepository(LiveStreamHistory)
        private readonly liveStreamRepository: Repository<LiveStreamHistory>,
        @InjectRepository(Reaction)
        private readonly reactionRepository: Repository<Reaction>
    ) {}

    async createNewsFeed(userId: string, data: Partial<NewsFeed>): Promise<NewsFeed> {
        const userRef = await this.userReferenceService.findById(userId);

        const existingFeed = await this.newsFeedRepository.findOne({
            where: {owner: {id: userId}},
        });

        if (existingFeed) {
            throw new Error('User already has a news feed');
        }

        const newsFeed = this.newsFeedRepository.create({
            ...data,
            owner: userRef,
        });

        return this.newsFeedRepository.save(newsFeed);
    }

    async getAllNewsFeeds(): Promise<NewsFeed[]> {
        return this.newsFeedRepository.find({
            relations: ['owner'],
        });
    }

    async getAllPostofUser(userId: string): Promise<Post[]> {
        const userFeed = await this.newsFeedRepository.findOne({
            where: {owner: {id: userId}},
        });
        if (!userFeed) {
            throw new NotFoundException(`News feed for user ${userId} not found`);
        }
        const userPosts = await this.postRepository.find({
            where: {newsFeed: {id: userFeed.id}},
            relations: ['posts', 'stories', 'liveStreams', 'comments', 'reactions', 'reel'],
        });

        if (!userPosts) {
            throw new NotFoundException('No posts found for this user');
        }

        return userPosts;
    }

    async getNewsFeedById(id: number): Promise<NewsFeed> {
        const newsFeed = await this.newsFeedRepository.findOne({
            where: {id},
            relations: ['posts', 'stories', 'liveStreams', 'comments', 'reactions', 'reel', 'owner'],
        });

        if (!newsFeed) {
            throw new NotFoundException(`News feed with ID ${id} not found`);
        }

        return newsFeed;
    }

    async updateNewsFeed(id: number, data: Partial<NewsFeed>): Promise<NewsFeed> {
        const newsFeed = await this.getNewsFeedById(id);
        this.newsFeedRepository.merge(newsFeed, data);
        return this.newsFeedRepository.save(newsFeed);
    }

    async deleteNewsFeed(id: number): Promise<void> {
        const result = await this.newsFeedRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`News feed with ID ${id} not found`);
        }
    }
    async createPost(newsFeedId: number, postData: Partial<Post>): Promise<Post> {
        const newsFeed = await this.getNewsFeedById(newsFeedId);

        const post = this.postRepository.create({
            ...postData,
            newsFeed,
        });

        return this.postRepository.save(post);
    }

    async getPostById(id: number): Promise<Post> {
        const post = await this.postRepository.findOne({
            where: {id},
            relations: ['newsFeed', 'newsFeed.owner'],
        });

        if (!post) {
            throw new NotFoundException(`Post with ID ${id} not found`);
        }

        return post;
    }

    async getPostsByNewsFeedId(newsFeedId: number): Promise<Post[]> {
        return this.postRepository.find({
            where: {newsFeed: {id: newsFeedId}},
            relations: ['newsFeed', 'newsFeed.owner'],
        });
    }

    async createStory(newsFeedId: number, storyData: Partial<Story>): Promise<Story> {
        const newsFeed = await this.getNewsFeedById(newsFeedId);

        const story = this.storyRepository.create({
            ...storyData,
            newsFeed,
        });

        return this.storyRepository.save(story);
    }

    async getStoriesByNewsFeedId(newsFeedId: number): Promise<Story[]> {
        return this.storyRepository.find({
            where: {newsFeed: {id: newsFeedId}},
            relations: ['newsFeed'],
        });
    }

    async createLiveStream(newsFeedId: number, streamData: Partial<LiveStreamHistory>): Promise<LiveStreamHistory> {
        const newsFeed = await this.getNewsFeedById(newsFeedId);

        const liveStream = this.liveStreamRepository.create({
            ...streamData,
            newsFeed,
        });

        return this.liveStreamRepository.save(liveStream);
    }

    async endLiveStream(streamId: number, endTime: Date): Promise<LiveStreamHistory> {
        const stream = await this.liveStreamRepository.findOne({where: {id: streamId}});

        if (!stream) {
            throw new NotFoundException(`Live stream with ID ${streamId} not found`);
        }

        stream.end_time = endTime;
        return this.liveStreamRepository.save(stream);
    }
}
