import {faker} from '@faker-js/faker';
import {Controller, Logger} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';
import {InjectRepository} from '@nestjs/typeorm';
import * as amqp from 'amqplib';
import {Repository} from 'typeorm';

import {CommunityReference} from '@/entities/external/community-ref.entity';
import {UserReference} from '@/entities/external/user-ref.entity';
import {Advertisement} from '@/entities/local/advertisement.entity';
import {Comment} from '@/entities/local/comment.entity';
import {HashTag} from '@/entities/local/hashtag.entity';
import {LiveStreamHistory} from '@/entities/local/live-stream-history.entity';
import {NewsFeed} from '@/entities/local/newsfeed.entity';
import {Post} from '@/entities/local/post.entity';
import {PostAttachment} from '@/entities/local/post-attachment';
import {Reaction} from '@/entities/local/reaction.entity';
import {Reel} from '@/entities/local/reel.entity';
import {Story} from '@/entities/local/story.entity';
import {ReactionType} from '@/enum/reaction-type';
import {visibilityEnum} from '@/enum/visibility.enum';
@Controller()
export class SeedHandlerController {
    private readonly logger = new Logger(SeedHandlerController.name);

    constructor(
        @InjectRepository(UserReference)
        private readonly userReferenceRepository: Repository<UserReference>,
        @InjectRepository(CommunityReference)
        private readonly communityReferenceRepository: Repository<CommunityReference>,
        @InjectRepository(NewsFeed)
        private readonly newsFeedRepository: Repository<NewsFeed>,
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
        @InjectRepository(Story)
        private readonly storyRepository: Repository<Story>,
        @InjectRepository(Reaction)
        private readonly reactionRepository: Repository<Reaction>,
        @InjectRepository(PostAttachment)
        private readonly postAttachmentRepository: Repository<PostAttachment>,
        @InjectRepository(LiveStreamHistory)
        private readonly liveStreamRepository: Repository<LiveStreamHistory>,
        @InjectRepository(Advertisement)
        private readonly advertisementRepository: Repository<Advertisement>,
        @InjectRepository(Reel)
        private readonly reelRepository: Repository<Reel>,
        @InjectRepository(HashTag)
        private readonly hashTagRepository: Repository<HashTag>
    ) {}

    @MessagePattern('FEED_SEED_QUEUE')
    async seedFeed(payload: {command: 'seed'; userReferences: any[]}): Promise<void> {
        if (payload.command !== 'seed') return;

        this.logger.log(`Seeding feed module with ${payload.userReferences.length} user references`);

        try {
            // Clear existing data in reverse dependency order
            this.logger.log('Clearing existing feed data...');
            await this.commentRepository.clear();
            await this.postAttachmentRepository.clear();
            await this.postRepository.clear();
            await this.reactionRepository.clear();
            await this.storyRepository.clear();
            await this.liveStreamRepository.clear();
            await this.advertisementRepository.clear();
            await this.reelRepository.clear();
            await this.newsFeedRepository.clear();
            await this.hashTagRepository.clear();
            await this.userReferenceRepository.clear();
            await this.communityReferenceRepository.clear();

            // Create hashtags
            this.logger.log('Creating hashtags...');
            const hashtags = await this.createHashtags();

            // Create communities
            this.logger.log('Creating community references...');
            const communities = await this.createCommunities(3);

            // Create user references and news feeds
            this.logger.log('Creating user references and news feeds...');
            const userRefs: UserReference[] = [];
            for (const userRefData of payload.userReferences) {
                const userRef = await this.createUserReference(userRefData);
                userRefs.push(userRef);

                // Create a news feed for each user
                await this.createNewsFeed(userRef, hashtags, null); // Personal feed
            }

            // Create community news feeds
            this.logger.log('Creating community news feeds...');
            for (const community of communities) {
                // Assign random users to each community feed
                const randomUsers = faker.helpers.arrayElements(userRefs, faker.number.int({min: 2, max: 5}));
                await this.createNewsFeed(randomUsers[0], hashtags, community);
            }

            // Create posts, comments, reactions
            this.logger.log('Creating feed content...');
            const newsFeeds = await this.newsFeedRepository.find({
                relations: ['owner'],
            });

            for (const newsFeed of newsFeeds) {
                await this.createPostsForNewsFeed(newsFeed, userRefs);
                // await this.createReactionsForNewsFeed(newsFeed);
                await this.createStoryForNewsFeed(newsFeed);

                // Add either a reel or a livestream history (50/50 chance)
                if (faker.datatype.boolean()) {
                    await this.createReelForNewsFeed(newsFeed);
                } else {
                    await this.createLiveStreamHistoryForNewsFeed(newsFeed);
                }

                // 20% chance to create an advertisement
                if (faker.datatype.boolean({probability: 0.2})) {
                    await this.createAdvertisementForNewsFeed(newsFeed);
                }
            }

            // Send confirmation back to coordinator
            await this.sendSeedingComplete(userRefs.length);

            this.logger.log(`Feed seeding complete - Created ${newsFeeds.length} news feeds with content`);
        } catch (error: any) {
            this.logger.error(`Error seeding feed module: ${error.message}`);
            throw error;
        }
    }

    private async createUserReference(userRefData: any): Promise<UserReference> {
        // Create a more complete user reference with all provided fields
        const userRef = this.userReferenceRepository.create({
            id: userRefData.id,
            username: userRefData.username || `user-${userRefData.id.substring(0, 8)}`,
            firstName: userRefData.firstName || '',
            lastName: userRefData.lastName || '',
            email: userRefData.email || '',
            profileImageUrl: userRefData.profileImageUrl || '',
        });
        return this.userReferenceRepository.save(userRef);
    }

    // Send confirmation that seeding is complete
    private async sendSeedingComplete(userCount: number): Promise<void> {
        try {
            const connection = await amqp.connect(`amqp://${'localhost'}:${5675}`);
            const channel = await connection.createChannel();

            await channel.assertQueue('FEED_SEED_RESULT', {durable: false});
            channel.sendToQueue(
                'FEED_SEED_RESULT',
                Buffer.from(
                    JSON.stringify({
                        status: 'complete',
                        message: `Feed module seeded successfully with ${userCount} user references`,
                    })
                )
            );

            await channel.close();
            await connection.close();
        } catch (error: any) {
            this.logger.error(`Failed to send seeding confirmation: ${error.message}`);
        }
    }

    private async createCommunities(count: number): Promise<CommunityReference[]> {
        const communities: CommunityReference[] = [];
        for (let i = 0; i < count; i++) {
            const community = this.communityReferenceRepository.create({
                id: faker.string.uuid(),
            });
            await this.communityReferenceRepository.save(community);
            communities.push(community);
        }
        return communities;
    }

    private async createHashtags(): Promise<HashTag[]> {
        const hashtagNames = [
            'technology',
            'travel',
            'food',
            'fitness',
            'fashion',
            'art',
            'music',
            'photography',
            'nature',
            'business',
        ];

        const hashtags: HashTag[] = [];
        for (const name of hashtagNames) {
            const hashtag = this.hashTagRepository.create({
                name,
            });
            await this.hashTagRepository.save(hashtag);
            hashtags.push(hashtag);
        }
        return hashtags;
    }

    private async createNewsFeed(
        owner: UserReference,
        hashtags: HashTag[],
        community: CommunityReference | null
    ): Promise<NewsFeed> {
        const newsFeed = this.newsFeedRepository.create({
            description: community
                ? `Community feed for ${faker.company.name()}`
                : `Personal feed for ${'user with id' + owner.id}`,
            visibility: faker.helpers.arrayElement(Object.values(visibilityEnum)),
            owner,
            community: community || undefined,
            tags: faker.helpers.arrayElements(hashtags, faker.number.int({min: 0, max: 3})),
        });

        return this.newsFeedRepository.save(newsFeed);
    }

    private async createPostsForNewsFeed(newsFeed: NewsFeed, allUsers: UserReference[]): Promise<void> {
        // Create 1-5 posts per news feed
        const postCount = faker.number.int({min: 1, max: 5});

        for (let i = 0; i < postCount; i++) {
            const post = this.postRepository.create({
                content: faker.lorem.paragraph(),
                newsFeed,
            });
            await this.postRepository.save(post);

            // Add 0-3 attachments to the post
            const attachmentCount = faker.number.int({min: 0, max: 3});
            for (let j = 0; j < attachmentCount; j++) {
                const attachment = this.postAttachmentRepository.create({
                    attachment_url: faker.image.url(),
                    post,
                });
                await this.postAttachmentRepository.save(attachment);
            }

            // Add 0-5 comments to the post
            const commentCount = faker.number.int({min: 0, max: 5});
            for (let j = 0; j < commentCount; j++) {
                // Random user comments
                const randomUser = faker.helpers.arrayElement(allUsers);
                const comment = this.commentRepository.create({
                    text: faker.lorem.sentence(),
                    attachment_url: faker.datatype.boolean({probability: 0.2}) ? faker.image.url() : '',
                    user: randomUser,
                    post,
                });
                await this.commentRepository.save(comment);
            }
        }
    }

    // private async createReactionsForNewsFeed(newsFeed: NewsFeed): Promise<void> {
    //     // Add 0-10 reactions to the news feed
    //     const reactionCount = faker.number.int({min: 0, max: 10});
    //     const reactionTypes = ['LIKE', 'HEART', 'CARE', 'SAD', 'WOW', 'ANGRY'];

    //     for (let i = 0; i < reactionCount; i++) {
    //         const reaction = this.reactionRepository.create({
    //             reaction_type: faker.helpers.arrayElement(reactionTypes) as ReactionType,
    //             reaction_image_url: faker.image.url(),
    //             newsFeed,
    //         });
    //         await this.reactionRepository.save(reaction);
    //     }
    // }

    private async createStoryForNewsFeed(newsFeed: NewsFeed): Promise<void> {
        // 50% chance to have a story
        if (faker.datatype.boolean()) {
            const story = this.storyRepository.create({
                story_url: faker.image.url(),
                duration: faker.number.int({min: 5, max: 30}), // 5-30 seconds
                newsFeed,
            });
            await this.storyRepository.save(story);
        }
    }

    private async createReelForNewsFeed(newsFeed: NewsFeed): Promise<void> {
        const reel = this.reelRepository.create({
            reel_url: faker.internet.url(),
            duration: faker.number.int({min: 15, max: 60}), // 15-60 seconds
            newsFeed,
        });
        await this.reelRepository.save(reel);
    }

    private async createLiveStreamHistoryForNewsFeed(newsFeed: NewsFeed): Promise<void> {
        const startDate = faker.date.recent({days: 30});
        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + faker.number.int({min: 15, max: 120}));

        const livestream = this.liveStreamRepository.create({
            stream_url: faker.internet.url(),
            start_time: startDate,
            end_time: endDate,
            newsFeed,
        });
        await this.liveStreamRepository.save(livestream);
    }

    private async createAdvertisementForNewsFeed(newsFeed: NewsFeed): Promise<void> {
        const startDate = faker.date.recent({days: 5});
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + faker.number.int({min: 1, max: 30}));

        const advertisement = this.advertisementRepository.create({
            start_time: startDate,
            end_time: endDate,
            newsFeed,
        });
        await this.advertisementRepository.save(advertisement);
    }
}
