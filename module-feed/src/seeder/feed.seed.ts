import {faker} from '@faker-js/faker';
import {Logger} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {DataSource} from 'typeorm';

import {UserReference} from '@/entities/external/user-reference.entity';
import {UserReactStory} from '@/entities/local/user-react-story.entity';
import {AttachmentType} from '@/modules/feed/enum/attachment-type.enum';
import {groupVisibility} from '@/modules/feed/enum/group-visibility.enum';
import {PageCategoryEnum} from '@/modules/feed/enum/page-category.enum';
import {ReactionType} from '@/modules/feed/enum/reaction-type.enum';
import {visibilityEnum} from '@/modules/feed/enum/visibility.enum';

import {AppModule} from '../app.module';
import {Advertisement} from '../entities/local/advertisement.entity';
import {Comment} from '../entities/local/comment.entity';
import {Group} from '../entities/local/group.entity';
import {GroupRule} from '../entities/local/group-rule.entity';
import {HashTag} from '../entities/local/hashtag.entity';
import {LiveStreamHistory} from '../entities/local/live-stream-history.entity';
import {NewsFeed} from '../entities/local/newsfeed.entity';
import {Page} from '../entities/local/page.entity';
import {Post} from '../entities/local/post.entity';
import {PostAttachment} from '../entities/local/post-attachment';
import {Reel} from '../entities/local/reel.entity';
import {Story} from '../entities/local/story.entity';
import {Topic} from '../entities/local/topic.entity';
import {UserReactPost} from '../entities/local/user-react-post.entity';

interface UserData {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string;
    phoneNumber: string;
}
const videoLinks = [
    'https://res.cloudinary.com/dght74v9o/video/upload/v1735408641/samples/cld-sample-video.mp4',
    'https://res.cloudinary.com/demo/video/upload/dog.mp4',
    'https://res.cloudinary.com/demo/video/upload/elephants.mp4',
    'https://res.cloudinary.com/dcb72w5e4/video/upload/v1742292056/samples/sea-turtle.mp4',
    'https://res.cloudinary.com/dcb72w5e4/video/upload/v1742292058/samples/dance-2.mp4',
    'https://videos.pexels.com/video-files/31646575/13482899_2560_1440_60fps.mp4',
    'https://videos.pexels.com/video-files/27729226/12212883_1440_2560_30fps.mp4',
    'https://videos.pexels.com/video-files/12052148/12052148-uhd_1440_2560_30fps.mp4',
    'https://videos.pexels.com/video-files/30281926/12981407_2560_1440_25fps.mp4',
    'https://videos.pexels.com/video-files/31532164/13439846_1920_1080_25fps.mp4',
    'https://videos.pexels.com/video-files/31828537/13559922_2560_1440_24fps.mp4',
    'https://videos.pexels.com/video-files/27692822/12206536_1920_1080_30fps.mp4',
    'https://videos.pexels.com/video-files/31598701/13464386_1080_1920_25fps.mp4',
    'https://videos.pexels.com/video-files/29792714/12800431_1920_1080_60fps.mp4',
    'https://videos.pexels.com/video-files/3850436/3850436-hd_1920_1080_24fps.mp4',
    'https://videos.pexels.com/video-files/30772101/13163067_2560_1440_60fps.mp4',
    'https://videos.pexels.com/video-files/31775344/13536308_1440_2560_50fps.mp4',
    'https://videos.pexels.com/video-files/28034501/12288471_2560_1440_30fps.mp4',
    'https://videos.pexels.com/video-files/3945877/3945877-uhd_2560_1440_30fps.mp4',
    'https://videos.pexels.com/video-files/30784261/13167552_1440_2560_30fps.mp4',
];

export const seedFeedDatabase = async (dataSource: DataSource) => {
    const app = await NestFactory.createApplicationContext(AppModule);
    const logger = new Logger('FeedSeeder');

    try {
        logger.log('Starting feed module seeding...');

        // Get repositories
        const userReferenceRepo = dataSource.getRepository(UserReference);
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
        const pageRepo = dataSource.getRepository(Page);
        const groupRepo = dataSource.getRepository(Group);
        const groupRuleRepo = dataSource.getRepository(GroupRule);

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
        await groupRuleRepo.query('TRUNCATE TABLE "group_rule" CASCADE');
        await groupRepo.query('TRUNCATE TABLE "group" CASCADE');
        await pageRepo.query('TRUNCATE TABLE "page" CASCADE');

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
            SELECT u.id, u.email, u.username, u."firstName", u."lastName", u."profileImageUrl", u."phoneNumber"
            FROM users u
            ORDER BY u.id
        `);

        logger.log(`Retrieved ${users.length} users from user module database`);

        // Find admin users
        const adminUser = users.find((user) => user.username === 'admin' || user.email === 'admin@example.com');
        const admin2User = users.find((user) => user.username === 'admin2' || user.email === 'admin2@example.com');

        if (!adminUser) {
            logger.warn('First admin user not found in the database');
        } else {
            logger.log(`Found admin user: ${adminUser.username} (${adminUser.id})`);
        }

        if (!admin2User) {
            logger.warn('Second admin user not found in the database');
        } else {
            logger.log(`Found second admin user: ${admin2User.username} (${admin2User.id})`);
        }

        // Create user references with exact IDs and data from user module
        logger.log('Creating user references with actual user data...');
        const userRefs: UserReference[] = [];
        let adminUserRef: UserReference | undefined;
        let admin2UserRef: UserReference | undefined;

        for (const userData of users) {
            const userRef = userReferenceRepo.create({
                id: userData.id,
                email: userData.email,
                username: userData.username,
                firstName: userData.firstName,
                lastName: userData.lastName,
                profileImageUrl: userData.profileImageUrl,
                phoneNumber: userData.phoneNumber,
            });
            await userReferenceRepo.save(userRef);
            userRefs.push(userRef);

            // Keep reference to admin users
            if (userData.username === 'admin' || userData.email === 'admin@example.com') {
                adminUserRef = userRef;
            } else if (userData.username === 'admin2' || userData.email === 'admin2@example.com') {
                admin2UserRef = userRef;
            }

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

        // Create group rules first
        logger.log('Creating group rules...');
        const commonGroupRules = [
            {
                title: 'Be Respectful',
                description: 'Treat everyone with respect. Healthy debates are natural, but kindness is required.',
            },
            {title: 'No Spam', description: "Don't spam the group with repetitive content or advertisements."},
            {title: 'Stay On Topic', description: "Keep your posts relevant to the group's purpose."},
            {title: 'No Harassment', description: 'Harassment or bullying will not be tolerated.'},
            {title: 'Keep It Civil', description: 'No hate speech, discrimination, or offensive content.'},
        ];

        const storedGroupRules: GroupRule[] = [];
        for (const rule of commonGroupRules) {
            const groupRule = groupRuleRepo.create(rule);
            await groupRuleRepo.save(groupRule);
            storedGroupRules.push(groupRule);
        }

        // Create pages
        logger.log('Creating pages...');
        const pages: Page[] = [];
        const pageCategories = Object.values(PageCategoryEnum);
        const pageNames = [
            'Infinivista Official',
            'Travel Photography',
            'Tech Enthusiasts',
            'Fitness Lovers',
            'Digital Nomads Group',
            'Cooking Masters',
            'Art & Design Hub',
        ];

        // Create pages with admins as owners for first two pages and generate random content
        for (let i = 0; i < pageNames.length; i++) {
            const pageOwner =
                i === 0
                    ? adminUserRef
                    : i === 1 && admin2UserRef
                      ? admin2UserRef
                      : faker.helpers.arrayElement(userRefs);
            const page = pageRepo.create({
                name: pageNames[i],
                description: faker.lorem.paragraph(),
                profileImageUrl: faker.image.url(),
                coverImageUrl: faker.image.url(),
                category: faker.helpers.arrayElement(pageCategories),
                website: faker.internet.url(),
                email: faker.internet.email(),
                phoneNumber: faker.phone.number(),
                address: faker.location.streetAddress(),
                city: faker.location.city(),
                country: faker.location.country(),
                owner: pageOwner,
            });

            await pageRepo.save(page);

            // Add followers - a random selection of users
            const followerCount = faker.number.int({min: 5, max: userRefs.length - 1});
            const followers = faker.helpers.arrayElements(userRefs, followerCount);

            // SQL approach for many-to-many - FIX: Change column name from "userReferenceId" to "userReferencesId"
            for (const follower of followers) {
                try {
                    await dataSource.query(
                        'INSERT INTO "page_followers_user_references" ("pageId", "userReferencesId") VALUES ($1, $2)',
                        [page.id, follower.id]
                    );
                } catch (error: any) {
                    logger.warn(`Failed to add follower ${follower.id} to page ${page.id}: ${error.message}`);
                }
            }

            pages.push(page);
        }

        // Create groups
        logger.log('Creating groups...');
        const groups: Group[] = [];
        const groupNames = [
            'Photography Enthusiasts',
            'Software Developers',
            'Fitness Motivation',
            'Food Lovers',
            'Book Club',
            'Travel Addicts',
            'Music Discussion',
        ];

        // Create groups with admin owners for first two groups
        for (let i = 0; i < groupNames.length; i++) {
            const groupOwner =
                i === 0
                    ? adminUserRef
                    : i === 1 && admin2UserRef
                      ? admin2UserRef
                      : faker.helpers.arrayElement(userRefs);

            const group = groupRepo.create({
                name: groupNames[i],
                description: faker.lorem.paragraph(),
                profileImageUrl: faker.image.url(),
                coverImageUrl: faker.image.url(),
                city: faker.location.city(),
                country: faker.location.country(),
                visibility: i === 0 ? groupVisibility.PUBLIC : groupVisibility.PRIVATE,
                owner: groupOwner,
            });

            // Assign 2-4 rules to each group
            group.groupRules = faker.helpers.arrayElements(storedGroupRules, faker.number.int({min: 2, max: 4}));

            await groupRepo.save(group);

            // Add members - a random selection of users
            const memberCount = faker.number.int({min: 5, max: userRefs.length - 1});
            const members = faker.helpers.arrayElements(userRefs, memberCount);

            // SQL approach for many-to-many - FIX: Change column name from "userReferenceId" to "userReferencesId"
            for (const member of members) {
                try {
                    await dataSource.query(
                        'INSERT INTO "group_members_user_references" ("groupId", "userReferencesId") VALUES ($1, $2)',
                        [group.id, member.id]
                    );
                } catch (error: any) {
                    logger.warn(`Failed to add member ${member.id} to group ${group.id}: ${error.message}`);
                }
            }

            groups.push(group);
        }

        // Create news feeds for each user, page, and group
        logger.log('Creating news feeds...');
        const newsFeeds: NewsFeed[] = [];
        let adminNewsFeed: NewsFeed | undefined;
        let admin2NewsFeed: NewsFeed | undefined;

        // Create user news feeds
        for (const userRef of userRefs) {
            try {
                const newsFeed = newsFeedRepo.create({
                    description:
                        userRef === adminUserRef
                            ? 'Official Infinivista Admin Feed'
                            : userRef === admin2UserRef
                              ? 'Secondary Infinivista Admin Feed'
                              : `Personal feed for ${userRef.firstName || userRef.username}`,
                    visibility:
                        userRef === adminUserRef || userRef === admin2UserRef
                            ? visibilityEnum.PUBLIC // Admin feeds are always public
                            : faker.helpers.arrayElement(Object.values(visibilityEnum)),
                });

                const savedFeed = await newsFeedRepo.save(newsFeed);

                await dataSource
                    .createQueryBuilder()
                    .update(NewsFeed)
                    .set({owner_id: userRef.id})
                    .where('id = :id', {id: savedFeed.id})
                    .execute();

                const refreshedFeed = await newsFeedRepo.findOne({
                    where: {id: savedFeed.id},
                    relations: ['owner'],
                });

                if (refreshedFeed) {
                    newsFeeds.push(refreshedFeed);

                    if (userRef === adminUserRef) {
                        adminNewsFeed = refreshedFeed;
                        logger.log(`Created first admin news feed for ${userRef.username}`);
                    } else if (userRef === admin2UserRef) {
                        admin2NewsFeed = refreshedFeed;
                        logger.log(`Created second admin news feed for ${userRef.username}`);
                    } else {
                        logger.log(`Created news feed for ${userRef.username}`);
                    }
                }
            } catch (error: any) {
                logger.error(`Error creating news feed for user ${userRef.username}: ${error.message}`);
            }
        }

        // Create news feeds for pages
        logger.log('Creating news feeds for pages...');
        for (const page of pages) {
            try {
                const newsFeed = newsFeedRepo.create({
                    description: `${page.name} Official Feed`,
                    visibility: visibilityEnum.PUBLIC,
                    pageOwner: page,
                });

                const savedFeed = await newsFeedRepo.save(newsFeed);

                await dataSource
                    .createQueryBuilder()
                    .update(Page)
                    .set({news_feed_id: savedFeed.id})
                    .where('id = :id', {id: page.id})
                    .execute();

                logger.log(`Created news feed for page: ${page.name}`);

                const pagePostCount = faker.number.int({min: 10, max: 20});
                for (let i = 0; i < pagePostCount; i++) {
                    const post = postRepo.create({
                        content: faker.lorem.paragraphs(faker.number.int({min: 1, max: 3})),
                        newsFeed,
                        topics:
                            topics.length > 0
                                ? faker.helpers.arrayElements(topics, faker.number.int({min: 1, max: 3}))
                                : [],
                        owner: page.owner, // Set the page owner as the post owner
                    });
                    await postRepo.save(post);

                    const attachmentCount = faker.number.int({min: 0, max: 3});
                    for (let j = 0; j < attachmentCount; j++) {
                        const attachmentType = faker.helpers.arrayElement(Object.values(AttachmentType));
                        const attachment = postAttachmentRepo.create({
                            attachment_url:
                                attachmentType === AttachmentType.VIDEO
                                    ? faker.helpers.arrayElement(videoLinks)
                                    : faker.image.url(),
                            attachmentType,
                            post,
                        });
                        await postAttachmentRepo.save(attachment);
                    }

                    const reactionCount = faker.number.int({min: 10, max: 30});
                    const reactingUsers = faker.helpers.arrayElements(
                        userRefs,
                        Math.min(reactionCount, userRefs.length)
                    );

                    for (const user of reactingUsers) {
                        const reaction = userReactPostRepo.create({
                            user_id: user.id,
                            post_id: post.id,
                            reactionType: faker.helpers.arrayElement(Object.values(ReactionType)),
                        });
                        await userReactPostRepo.save(reaction);
                    }
                }
            } catch (error: any) {
                logger.error(`Error creating news feed for page ${page.name}: ${error.message}`);
            }
        }

        // Create news feeds for groups
        logger.log('Creating news feeds for groups...');
        for (const group of groups) {
            try {
                const newsFeed = newsFeedRepo.create({
                    description: `${group.name} Group Feed`,
                    visibility: groupVisibility.PUBLIC ? visibilityEnum.PUBLIC : visibilityEnum.PRIVATE,
                    groupOwner: group,
                });

                const savedFeed = await newsFeedRepo.save(newsFeed);

                await dataSource
                    .createQueryBuilder()
                    .update(Group)
                    .set({news_feed_id: savedFeed.id})
                    .where('id = :id', {id: group.id})
                    .execute();

                logger.log(`Created news feed for group: ${group.name}`);

                const groupPostCount = faker.number.int({min: 30, max: 50});
                for (let i = 0; i < groupPostCount; i++) {
                    const memberIds: {userReferencesId: string}[] = await dataSource.query(
                        'SELECT "userReferencesId" FROM "group_members_user_references" WHERE "groupId" = $1',
                        [group.id]
                    );

                    if (memberIds.length > 0) {
                        const randomMemberId = faker.helpers.arrayElement(memberIds).userReferencesId;
                        const memberUser = await userReferenceRepo.findOne({where: {id: randomMemberId}});

                        if (memberUser) {
                            const post = postRepo.create({
                                content: faker.lorem.paragraphs(faker.number.int({min: 1, max: 2})),
                                newsFeed,
                                topics:
                                    topics.length > 0
                                        ? faker.helpers.arrayElements(topics, faker.number.int({min: 1, max: 3}))
                                        : [],
                                owner: memberUser, // Set the group member as the post owner
                            });
                            await postRepo.save(post);

                            if (faker.datatype.boolean()) {
                                const attachmentCount = faker.number.int({min: 0, max: 3});
                                for (let j = 0; j < attachmentCount; j++) {
                                    const attachmentType = faker.helpers.arrayElement(Object.values(AttachmentType));
                                    const attachment = postAttachmentRepo.create({
                                        attachment_url:
                                            attachmentType === AttachmentType.VIDEO
                                                ? faker.helpers.arrayElement(videoLinks)
                                                : faker.image.url(),
                                        attachmentType,
                                        post,
                                    });
                                    await postAttachmentRepo.save(attachment);
                                }
                            }

                            const reactionCount = faker.number.int({min: 3, max: 10});
                            for (let r = 0; r < reactionCount && r < memberIds.length; r++) {
                                const memberId = memberIds[r].userReferencesId;
                                const reaction = userReactPostRepo.create({
                                    user_id: memberId,
                                    post_id: post.id,
                                    reactionType: faker.helpers.arrayElement(Object.values(ReactionType)),
                                });
                                await userReactPostRepo.save(reaction);
                            }
                        }
                    }
                }
            } catch (error: any) {
                logger.error(`Error creating news feed for group ${group.name}: ${error.message}`);
            }
        }

        // Create posts, comments, attachments, and reactions for regular users
        logger.log('Creating posts with attachments and comments...');

        for (const newsFeed of newsFeeds.filter((feed) => feed !== adminNewsFeed && feed !== admin2NewsFeed)) {
            const postCount = faker.number.int({min: 1, max: 2});
            const ownerName = newsFeed.owner?.id || 'unknown user';
            logger.log(`Creating ${postCount} posts for feed of ${ownerName}`);

            for (let i = 0; i < postCount; i++) {
                const post = postRepo.create({
                    content: faker.lorem.paragraphs(faker.number.int({min: 1, max: 3})),
                    newsFeed,
                    topics:
                        topics.length > 0
                            ? faker.helpers.arrayElements(topics, faker.number.int({min: 1, max: 3}))
                            : [],
                    owner: newsFeed.owner, // Set the newsfeed's owner as the post owner
                });
                await postRepo.save(post);

                const attachmentCount = faker.number.int({min: 0, max: 3});
                for (let j = 0; j < attachmentCount; j++) {
                    const attachmentType = faker.helpers.arrayElement(Object.values(AttachmentType));
                    const attachment = postAttachmentRepo.create({
                        attachment_url:
                            attachmentType === AttachmentType.VIDEO
                                ? faker.helpers.arrayElement(videoLinks)
                                : faker.image.url(),
                        attachmentType,
                        post,
                    });
                    await postAttachmentRepo.save(attachment);
                }

                const commentCount = faker.number.int({min: 2, max: 5});
                for (let k = 0; k < commentCount; k++) {
                    const randomUser = faker.helpers.arrayElement(userRefs);
                    const comment = commentRepo.create({
                        text: faker.lorem.sentence(),
                        attachment_url: faker.datatype.boolean({probability: 0.3}) ? faker.image.url() : undefined,
                        user: randomUser,
                        post,
                    });
                    await commentRepo.save(comment);
                }

                const reactionCount = faker.number.int({min: 5, max: 15});
                const reactionTypes = Object.values(ReactionType);

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

            if (faker.datatype.boolean({probability: 0.7})) {
                const storyCount = faker.number.int({min: 1, max: 3});
                for (let i = 0; i < storyCount; i++) {
                    const attachmentType = faker.helpers.arrayElement(Object.values(AttachmentType));
                    const story = storyRepo.create({
                        story_url:
                            attachmentType === AttachmentType.VIDEO
                                ? faker.helpers.arrayElement(videoLinks)
                                : faker.image.url(),
                        duration: faker.number.int({min: 5, max: 30}),
                        attachmentType,
                        newsFeed,
                    });
                    await storyRepo.save(story);

                    const storyCommentCount = faker.number.int({min: 0, max: 5});
                    for (let c = 0; c < storyCommentCount; c++) {
                        const randomUser = faker.helpers.arrayElement(userRefs);
                        const comment = commentRepo.create({
                            text: faker.lorem.sentence(),
                            attachment_url: faker.datatype.boolean({probability: 0.2}) ? faker.image.url() : undefined,
                            user: randomUser,
                            story: story,
                        });
                        await commentRepo.save(comment);
                    }

                    const storyReactionCount = faker.number.int({min: 0, max: 8});
                    const reactionTypes = Object.values(ReactionType);

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

            if (faker.datatype.boolean({probability: 0.6})) {
                const reelCount = faker.number.int({min: 2, max: 5});
                for (let i = 0; i < reelCount; i++) {
                    const reel = reelRepo.create({
                        reel_url: faker.internet.url(),
                        duration: faker.number.int({min: 15, max: 60}),
                        newsFeed,
                    });
                    await reelRepo.save(reel);
                }
            }

            if (faker.datatype.boolean({probability: 0.4})) {
                const livestreamCount = faker.number.int({min: 1, max: 2});
                for (let i = 0; i < livestreamCount; i++) {
                    const startDate = faker.date.recent({days: 30});
                    const endDate = new Date(startDate.getTime() + faker.number.int({min: 900000, max: 7200000}));

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
        }

        // Create enhanced content for admin feeds
        if (adminNewsFeed && adminUserRef) {
            logger.log('Creating enhanced content for first admin user feed...');

            const adminPostCount = faker.number.int({min: 15, max: 25});
            logger.log(`Creating ${adminPostCount} posts for first admin feed`);

            for (let i = 0; i < adminPostCount; i++) {
                const post = postRepo.create({
                    content: faker.lorem.paragraphs(faker.number.int({min: 4, max: 8})),
                    newsFeed: adminNewsFeed,
                    topics:
                        topics.length > 0
                            ? faker.helpers.arrayElements(topics, faker.number.int({min: 4, max: 6}))
                            : [],
                    owner: adminUserRef, // Set the admin user as the post owner
                });
                await postRepo.save(post);

                const attachmentCount = faker.number.int({min: 6, max: 12});
                for (let j = 0; j < attachmentCount; j++) {
                    const attachmentType = faker.helpers.arrayElement(Object.values(AttachmentType));
                    const attachment = postAttachmentRepo.create({
                        attachment_url:
                            attachmentType === AttachmentType.VIDEO
                                ? faker.helpers.arrayElement(videoLinks)
                                : faker.image.url(),
                        attachmentType,
                        post,
                    });
                    await postAttachmentRepo.save(attachment);
                }

                const commentCount = faker.number.int({min: 14, max: 35});
                for (let k = 0; k < commentCount; k++) {
                    const randomUser = faker.helpers.arrayElement(userRefs);
                    const comment = commentRepo.create({
                        text: faker.lorem.sentence(),
                        attachment_url: faker.datatype.boolean({probability: 0.4}) ? faker.image.url() : undefined,
                        user: randomUser,
                        post,
                    });
                    await commentRepo.save(comment);
                }

                const reactionCount = faker.number.int({min: 250, max: 1200});
                const reactionTypes = Object.values(ReactionType);

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

            const adminStoryCount = faker.number.int({min: 12, max: 20});
            logger.log(`Creating ${adminStoryCount} stories for first admin feed`);

            for (let i = 0; i < adminStoryCount; i++) {
                const attachmentType = faker.helpers.arrayElement(Object.values(AttachmentType));
                const story = storyRepo.create({
                    story_url:
                        attachmentType === AttachmentType.VIDEO
                            ? faker.helpers.arrayElement(videoLinks)
                            : faker.image.url(),
                    duration: faker.number.int({min: 10, max: 30}),
                    attachmentType,
                    newsFeed: adminNewsFeed,
                });
                await storyRepo.save(story);

                const storyCommentCount = faker.number.int({min: 5, max: 10});
                for (let c = 0; c < storyCommentCount; c++) {
                    const randomUser = faker.helpers.arrayElement(userRefs);
                    const comment = commentRepo.create({
                        text: faker.lorem.sentence(),
                        attachment_url: faker.datatype.boolean({probability: 0.3}) ? faker.image.url() : undefined,
                        user: randomUser,
                        story: story,
                    });
                    await commentRepo.save(comment);
                }

                const storyReactionCount = faker.number.int({min: 40, max: 60});
                const reactionTypes = Object.values(ReactionType);

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

            const adminReelCount = faker.number.int({min: 1, max: 1});
            logger.log(`Creating ${adminReelCount} reels for first admin feed`);

            for (let i = 0; i < adminReelCount; i++) {
                const reel = reelRepo.create({
                    reel_url: faker.internet.url(),
                    duration: faker.number.int({min: 20, max: 60}),
                    newsFeed: adminNewsFeed,
                });
                await reelRepo.save(reel);
            }

            const adminLivestreamCount = faker.number.int({min: 1, max: 1});
            logger.log(`Creating ${adminLivestreamCount} livestreams for first admin feed`);

            for (let i = 0; i < adminLivestreamCount; i++) {
                const startDate = faker.date.recent({days: 45});
                const streamDuration = faker.number.int({min: 1800000, max: 10800000});
                const endDate = new Date(startDate.getTime() + streamDuration);

                const livestream = liveStreamRepo.create({
                    stream_url: faker.internet.url(),
                    start_time: startDate,
                    end_time: endDate,
                    view_count: faker.number.int({min: 50000, max: 5000000}),
                    newsFeed: adminNewsFeed,
                });
                await liveStreamRepo.save(livestream);
            }
        }

        if (admin2NewsFeed && admin2UserRef) {
            logger.log('Creating enhanced content for second admin user feed...');

            const admin2PostCount = faker.number.int({min: 10, max: 20});
            logger.log(`Creating ${admin2PostCount} posts for second admin feed`);

            for (let i = 0; i < admin2PostCount; i++) {
                const post = postRepo.create({
                    content: faker.lorem.paragraphs(faker.number.int({min: 3, max: 6})),
                    newsFeed: admin2NewsFeed,
                    topics:
                        topics.length > 0
                            ? faker.helpers.arrayElements(topics, faker.number.int({min: 3, max: 5}))
                            : [],
                    owner: admin2UserRef,
                });
                await postRepo.save(post);

                const attachmentCount = faker.number.int({min: 4, max: 8});
                for (let j = 0; j < attachmentCount; j++) {
                    const attachmentType = faker.helpers.arrayElement(Object.values(AttachmentType));
                    const attachment = postAttachmentRepo.create({
                        attachment_url:
                            attachmentType === AttachmentType.VIDEO
                                ? faker.helpers.arrayElement(videoLinks)
                                : faker.image.url(),
                        attachmentType,
                        post,
                    });
                    await postAttachmentRepo.save(attachment);
                }

                const commentCount = faker.number.int({min: 10, max: 25});
                for (let k = 0; k < commentCount; k++) {
                    const randomUser = faker.helpers.arrayElement(userRefs);
                    const comment = commentRepo.create({
                        text: faker.lorem.sentence(),
                        attachment_url: faker.datatype.boolean({probability: 0.4}) ? faker.image.url() : undefined,
                        user: randomUser,
                        post,
                    });
                    await commentRepo.save(comment);
                }

                const reactionCount = faker.number.int({min: 150, max: 800});
                const reactionTypes = Object.values(ReactionType);

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

            const admin2StoryCount = faker.number.int({min: 8, max: 15});
            logger.log(`Creating ${admin2StoryCount} stories for second admin feed`);

            for (let i = 0; i < admin2StoryCount; i++) {
                const attachmentType = faker.helpers.arrayElement(Object.values(AttachmentType));
                const story = storyRepo.create({
                    story_url:
                        attachmentType === AttachmentType.VIDEO
                            ? faker.helpers.arrayElement(videoLinks)
                            : faker.image.url(),
                    duration: faker.number.int({min: 10, max: 30}),
                    attachmentType,
                    newsFeed: admin2NewsFeed,
                });
                await storyRepo.save(story);

                const storyCommentCount = faker.number.int({min: 3, max: 8});
                for (let c = 0; c < storyCommentCount; c++) {
                    const randomUser = faker.helpers.arrayElement(userRefs);
                    const comment = commentRepo.create({
                        text: faker.lorem.sentence(),
                        attachment_url: faker.datatype.boolean({probability: 0.3}) ? faker.image.url() : undefined,
                        user: randomUser,
                        story: story,
                    });
                    await commentRepo.save(comment);
                }

                const storyReactionCount = faker.number.int({min: 30, max: 50});
                const reactionTypes = Object.values(ReactionType);

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

            const admin2ReelCount = faker.number.int({min: 1, max: 1});
            logger.log(`Creating ${admin2ReelCount} reels for second admin feed`);

            for (let i = 0; i < admin2ReelCount; i++) {
                const reel = reelRepo.create({
                    reel_url: faker.internet.url(),
                    duration: faker.number.int({min: 20, max: 60}),
                    newsFeed: admin2NewsFeed,
                });
                await reelRepo.save(reel);
            }

            const admin2LivestreamCount = faker.number.int({min: 1, max: 1});
            logger.log(`Creating ${admin2LivestreamCount} livestreams for second admin feed`);

            for (let i = 0; i < admin2LivestreamCount; i++) {
                const startDate = faker.date.recent({days: 30});
                const streamDuration = faker.number.int({min: 1500000, max: 7200000});
                const endDate = new Date(startDate.getTime() + streamDuration);

                const livestream = liveStreamRepo.create({
                    stream_url: faker.internet.url(),
                    start_time: startDate,
                    end_time: endDate,
                    view_count: faker.number.int({min: 30000, max: 3000000}),
                    newsFeed: admin2NewsFeed,
                });
                await liveStreamRepo.save(livestream);
            }
        }

        const postCount = await postRepo.count();
        const commentCount = await commentRepo.count();
        const attachmentCount = await postAttachmentRepo.count();
        const postReactionCount = await userReactPostRepo.count();
        const storyReactionCount = await userReactStoryRepo.count();
        const storyCount = await storyRepo.count();
        const reelCount = await reelRepo.count();
        const livestreamCount = await liveStreamRepo.count();
        const pageCount = await pageRepo.count();
        const groupCount = await groupRepo.count();
        const ruleCount = await groupRuleRepo.count();

        logger.log(`
Feed module seeding summary:
- ${userRefs.length} user references
- ${newsFeeds.length} news feeds
- ${pageCount} pages
- ${groupCount} groups
- ${ruleCount} group rules
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
