import {faker} from '@faker-js/faker';
import {Logger} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {DataSource} from 'typeorm';

import {UserReactStory} from '@/entities/local/user-react-story.entity';
import {AttachmentType} from '@/modules/feed/enum/attachment-type.enum';
import {ReactionType} from '@/modules/feed/enum/reaction-type.enum';
import {visibilityEnum} from '@/modules/feed/enum/visibility.enum';

import {AppModule} from '../app.module';
import {CommunityReference} from '../entities/external/community-ref.entity';
import {UserReference} from '../entities/external/user-ref.entity';
import {Advertisement} from '../entities/local/advertisement.entity';
import {Comment} from '../entities/local/comment.entity';
import {HashTag} from '../entities/local/hashtag.entity';
import {LiveStreamHistory} from '../entities/local/live-stream-history.entity';
import {NewsFeed} from '../entities/local/newsfeed.entity';
import {Post} from '../entities/local/post.entity';
import {PostAttachment} from '../entities/local/post-attachment';
import {Reel} from '../entities/local/reel.entity';
import {Story} from '../entities/local/story.entity';
import {Topic} from '../entities/local/topic.entity';
import {UserReactPost} from '../entities/local/user-react-post.entity';

// Interface to match the user data structure from module-user
interface UserData {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string;
    // Add any other fields you need
}

export const seedFeedDatabase = async (dataSource: DataSource) => {
    const app = await NestFactory.createApplicationContext(AppModule);
    const logger = new Logger('FeedSeeder');

    try {
        logger.log('Starting feed module seeding...');

        // Get repositories
        const userReferenceRepo = dataSource.getRepository(UserReference);
        const communityReferenceRepo = dataSource.getRepository(CommunityReference);
        const newsFeedRepo = dataSource.getRepository(NewsFeed);
        const postRepo = dataSource.getRepository(Post);
        const postAttachmentRepo = dataSource.getRepository(PostAttachment);
        const commentRepo = dataSource.getRepository(Comment);
        const hashTagRepo = dataSource.getRepository(HashTag);
        const storyRepo = dataSource.getRepository(Story);
        const liveStreamRepo = dataSource.getRepository(LiveStreamHistory);
        const advertisementRepo = dataSource.getRepository(Advertisement);
        const reelRepo = dataSource.getRepository(Reel);
        const topicRepo = dataSource.getRepository(Topic);
        const userReactPostRepo = dataSource.getRepository(UserReactPost);
        const userReactStoryRepo = dataSource.getRepository(UserReactStory);

        logger.log('Clearing existing data...');
        await userReactPostRepo.query('TRUNCATE TABLE "user_react_post" CASCADE');
        await userReactStoryRepo.query('TRUNCATE TABLE "user_react_story" CASCADE');
        await commentRepo.query('TRUNCATE TABLE "comment" CASCADE');
        await postAttachmentRepo.query('TRUNCATE TABLE "post_attachment" CASCADE');
        await postRepo.query('TRUNCATE TABLE "post" CASCADE');
        await storyRepo.query('TRUNCATE TABLE "story" CASCADE');
        await liveStreamRepo.query('TRUNCATE TABLE "live_stream_history" CASCADE');
        await advertisementRepo.query('TRUNCATE TABLE "advertisement" CASCADE');
        await reelRepo.query('TRUNCATE TABLE "reel" CASCADE');
        await newsFeedRepo.query('TRUNCATE TABLE "news_feed" CASCADE');
        await hashTagRepo.query('TRUNCATE TABLE "hash_tag" CASCADE');
        await userReferenceRepo.query('TRUNCATE TABLE "user_references" CASCADE');
        await communityReferenceRepo.query('TRUNCATE TABLE "community_reference" CASCADE');

        // Connect to the user module database to get real user data
        logger.log('Connecting to user module database...');

        // Create a separate connection to the user module database
        const userModuleConnection = new DataSource({
            type: 'postgres',
            host: 'localhost',
            port: 5435,
            username: 'postgres',
            password: 'postgres',
            database: 'infinivista-user',
        });

        await userModuleConnection.initialize();
        logger.log('Connected to user module database successfully');

        // Get all users from the user module database
        const users: UserData[] = await userModuleConnection.query(`
            SELECT u.id, u.email, u.username, u."firstName", u."lastName", u."profileImageUrl"
            FROM users u
            ORDER BY u.id
        `);

        logger.log(`Retrieved ${users.length} users from user module database`);

        // Create user references with exact IDs and data from user module
        logger.log('Creating user references with actual user data...');
        const userRefs: UserReference[] = [];

        for (const userData of users) {
            const userRef = userReferenceRepo.create({
                id: userData.id,
                email: userData.email,
                username: userData.username,
                firstName: userData.firstName,

                lastName: userData.lastName,
                profileImageUrl: userData.profileImageUrl,
            });
            await userReferenceRepo.save(userRef);
            userRefs.push(userRef);

            logger.log(`Created user reference for ${userData.username} with ID ${userData.id}`);
        }

        // Close the user module connection
        await userModuleConnection.destroy();
        logger.log('Closed connection to user module database');

        // Create 20 hashtags
        logger.log('Creating hashtags...');
        const hashtagNames = [
            'technology',
            'travel',
            'food',
            'fitness',
            'art',
            'music',
            'photography',
            'nature',
            'books',
            'fashion',
            'education',
            'business',
            'gaming',
            'sports',
            'science',
            'health',
            'movies',
            'design',
            'cooking',
            'pets',
        ];

        const hashtags: HashTag[] = [];
        for (const name of hashtagNames) {
            const hashtag = hashTagRepo.create({name});
            await hashTagRepo.save(hashtag);
            hashtags.push(hashtag);
        }

        // Use existing topics from database instead of creating new ones
        logger.log('Fetching existing topics...');
        const topics = await topicRepo.find();

        if (!topics || topics.length === 0) {
            logger.warn('No topics found in the database! Please run topic seed script first.');
        } else {
            logger.log(`Found ${topics.length} existing topics in the database`);
        }

        // Create news feeds for each user (one per user)
        logger.log('Creating news feeds...');
        const newsFeeds: NewsFeed[] = [];

        for (const userRef of userRefs) {
            try {
                // First, create the news feed without many-to-many relationships
                const newsFeed = newsFeedRepo.create({
                    description: `Personal feed for ${userRef.firstName || userRef.username}`,
                    visibility: faker.helpers.arrayElement(Object.values(visibilityEnum)),
                });

                // Need to save first to get an ID
                const savedFeed = await newsFeedRepo.save(newsFeed);

                // Now update the owner relationship with direct SQL to avoid ORM issues
                await dataSource
                    .createQueryBuilder()
                    .update(NewsFeed)
                    .set({owner_id: userRef.id})
                    .where('id = :id', {id: savedFeed.id})
                    .execute();

                logger.log(`Set owner_id for news feed ${savedFeed.id} to user ${userRef.id}`);

                // Refresh the feed to get the updated entity with owner - include relations
                const refreshedFeed = await newsFeedRepo.findOne({
                    where: {id: savedFeed.id},
                    relations: ['owner'], // Include owner relation
                });

                if (refreshedFeed) {
                    newsFeeds.push(refreshedFeed);
                    logger.log(`Created news feed for ${userRef.username}`);
                }
            } catch (error: any) {
                logger.error(`Error creating news feed for user ${userRef.username}: ${error.message}`);
                logger.error(error.stack);
                // Continue with next user even if one fails
            }
        }

        // Create posts, comments, attachments, and reactions (more per feed)
        logger.log('Creating posts with attachments and comments...');

        for (const newsFeed of newsFeeds) {
            // 5-15 posts per news feed
            const postCount = faker.number.int({min: 5, max: 15});
            // Add safety check for owner
            const ownerName = newsFeed.owner?.username || 'unknown user';
            logger.log(`Creating ${postCount} posts for feed of ${ownerName}`);

            for (let i = 0; i < postCount; i++) {
                // Create post with random topics
                const post = postRepo.create({
                    content: faker.lorem.paragraphs(faker.number.int({min: 1, max: 3})),
                    newsFeed,
                    topics:
                        topics.length > 0
                            ? faker.helpers.arrayElements(topics, faker.number.int({min: 1, max: 3}))
                            : [],
                });
                await postRepo.save(post);

                // 0-5 attachments per post
                const attachmentCount = faker.number.int({min: 0, max: 5});
                for (let j = 0; j < attachmentCount; j++) {
                    const attachment = postAttachmentRepo.create({
                        attachment_url: faker.image.url(),
                        attachmentType: faker.helpers.arrayElement(Object.values(AttachmentType)),
                        post,
                    });
                    await postAttachmentRepo.save(attachment);
                }

                // 3-10 comments per post
                const commentCount = faker.number.int({min: 3, max: 10});
                for (let k = 0; k < commentCount; k++) {
                    // Random user comments
                    const randomUser = faker.helpers.arrayElement(userRefs);
                    const comment = commentRepo.create({
                        text: faker.lorem.sentence(),
                        attachment_url: faker.datatype.boolean({probability: 0.3}) ? faker.image.url() : undefined,
                        user: randomUser,
                        post,
                    });
                    await commentRepo.save(comment);
                }

                // Add reactions to posts (5-15 reactions per post)
                const reactionCount = faker.number.int({min: 5, max: 15});
                const reactionTypes = Object.values(ReactionType);

                // Select random users to react to this post
                const reactingUsers = faker.helpers.arrayElements(userRefs, Math.min(reactionCount, userRefs.length));

                for (const user of reactingUsers) {
                    const reaction = userReactPostRepo.create({
                        user_id: user.id,
                        post_id: post.id,
                        reactionType: faker.helpers.arrayElement(reactionTypes),
                    });
                    await userReactPostRepo.save(reaction);
                }
            }

            // Create stories (1-3 per user with 70% chance)
            if (faker.datatype.boolean({probability: 0.7})) {
                const storyCount = faker.number.int({min: 1, max: 3});
                for (let i = 0; i < storyCount; i++) {
                    const story = storyRepo.create({
                        story_url: faker.image.url(),
                        duration: faker.number.int({min: 5, max: 30}), // seconds
                        attachmentType: faker.helpers.arrayElement(Object.values(AttachmentType)),
                        newsFeed,
                    });
                    await storyRepo.save(story);

                    // Add 0-5 comments to each story
                    const storyCommentCount = faker.number.int({min: 0, max: 5});
                    for (let c = 0; c < storyCommentCount; c++) {
                        const randomUser = faker.helpers.arrayElement(userRefs);
                        const comment = commentRepo.create({
                            text: faker.lorem.sentence(),
                            attachment_url: faker.datatype.boolean({probability: 0.2}) ? faker.image.url() : undefined,
                            user: randomUser,
                            story: story, // Associate with story instead of post
                        });
                        await commentRepo.save(comment);
                    }

                    // Add reactions to stories (0-8 reactions per story)
                    const storyReactionCount = faker.number.int({min: 0, max: 8});
                    const reactionTypes = Object.values(ReactionType);

                    // Select random users to react to this story
                    const reactingUsers = faker.helpers.arrayElements(
                        userRefs,
                        Math.min(storyReactionCount, userRefs.length)
                    );

                    for (const user of reactingUsers) {
                        const reaction = userReactStoryRepo.create({
                            user_id: user.id,
                            story_id: story.id,
                            reactionType: faker.helpers.arrayElement(reactionTypes),
                        });
                        await userReactStoryRepo.save(reaction);
                    }
                }
            }

            // Create reels (2-5 per feed with 60% chance)
            if (faker.datatype.boolean({probability: 0.6})) {
                const reelCount = faker.number.int({min: 2, max: 5});
                for (let i = 0; i < reelCount; i++) {
                    const reel = reelRepo.create({
                        reel_url: faker.internet.url(),
                        duration: faker.number.int({min: 15, max: 60}), // seconds
                        newsFeed,
                    });
                    await reelRepo.save(reel);
                }
            }

            // Create livestreams (1-2 per feed with 40% chance)
            if (faker.datatype.boolean({probability: 0.4})) {
                const livestreamCount = faker.number.int({min: 1, max: 2});
                for (let i = 0; i < livestreamCount; i++) {
                    const startDate = faker.date.recent({days: 30});
                    const endDate = new Date(startDate.getTime() + faker.number.int({min: 900000, max: 7200000})); // 15-120 minutes

                    const livestream = liveStreamRepo.create({
                        stream_url: faker.internet.url(),
                        start_time: startDate,
                        end_time: endDate,
                        view_count: faker.number.int({min: 0, max: 100000}),
                        newsFeed,
                    });
                    await liveStreamRepo.save(livestream);
                }
            }

            // Create advertisement (20% chance)
            // if (faker.datatype.boolean({probability: 0.2})) {
            //     const startDate = faker.date.recent({days: 5});
            //     const endDate = new Date(startDate.getTime() + 86400000 * faker.number.int({min: 1, max: 30})); // 1-30 days

            //     const advertisement = advertisementRepo.create({
            //         start_time: startDate,
            //         end_time: endDate,
            //         newsFeed,
            //     });
            //     await advertisementRepo.save(advertisement);
            // }
        }

        // Log some stats about what was created
        const postCount = await postRepo.count();
        const commentCount = await commentRepo.count();
        const attachmentCount = await postAttachmentRepo.count();
        const postReactionCount = await userReactPostRepo.count();
        const storyReactionCount = await userReactStoryRepo.count();
        const storyCount = await storyRepo.count();
        const reelCount = await reelRepo.count();
        const livestreamCount = await liveStreamRepo.count();

        logger.log(`
Feed module seeding summary:
- ${userRefs.length} user references
- ${newsFeeds.length} news feeds
- ${postCount} posts
- ${commentCount} comments
- ${attachmentCount} post attachments
- ${postReactionCount} post reactions
- ${storyReactionCount} story reactions
- ${storyCount} stories
- ${reelCount} reels
- ${livestreamCount} livestreams
`);

        logger.log('Feed module seeding completed successfully!');
    } catch (error: any) {
        logger.error(`Error during seeding: ${error.message}`);
        logger.error(error.stack);
        process.exitCode = 1;
    } finally {
        await app.close();
    }
};
