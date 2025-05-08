import {faker} from '@faker-js/faker';
import {Logger} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import axios from 'axios';
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
import {UserSharePost} from '../entities/local/user-share-post.entity';
import {imageLinks, videoLinks} from './self-seeder';

/**
 * Extracts potential interests from a user's text content
 * @param text Text to analyze for interests
 * @returns Array of likely interests based on text
 */
function extractInterestsFromText(text: string): string[] {
    // Common interests to look for in text
    const commonInterests = [
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

    // Check which interests appear in the text
    const foundInterests = commonInterests.filter((interest) => text.toLowerCase().includes(interest.toLowerCase()));

    // If none found, return random selection
    if (foundInterests.length === 0) {
        return faker.helpers.arrayElements(commonInterests, faker.number.int({min: 1, max: 3}));
    }

    return foundInterests;
}

/**
 * Determines appropriate topics for a page based on its name and category
 * @param pageName The name of the page
 * @param pageCategory The category of the page
 * @returns Array of relevant topics
 */
function determinePageTopics(pageName: string, pageCategory?: string): string[] {
    // Default topics that could apply to any page
    const defaultTopics = ['business', 'community', 'updates', 'news', 'events'];

    // Extract topics from page name and category
    const extractedTopics = extractInterestsFromText(pageName);

    if (pageCategory) {
        extractedTopics.push(pageCategory.toLowerCase());
    }

    // Combine with default topics and ensure uniqueness
    const allTopics = [...new Set([...extractedTopics, ...defaultTopics])];

    // Return 2-4 topics
    return faker.helpers.arrayElements(allTopics, faker.number.int({min: 2, max: 4}));
}

/**
 * Determines appropriate topics for a group based on its name
 * @param groupName The name of the group
 * @returns Array of relevant topics
 */
function determineGroupTopics(groupName: string): string[] {
    // Default group topics
    const defaultTopics = ['community', 'discussion', 'sharing', 'help', 'support'];

    // Extract topics from group name
    const extractedTopics = extractInterestsFromText(groupName);

    // Combine with default topics and ensure uniqueness
    const allTopics = [...new Set([...extractedTopics, ...defaultTopics])];

    // Return 2-3 topics
    return faker.helpers.arrayElements(allTopics, faker.number.int({min: 2, max: 3}));
}

/**
 * Generates meaningful post content using Gemini AI
 * @param context Optional context information to guide content generation
 * @returns Generated post content or fallback content if API call fails
 */
async function generateMeaningfulPostContent(
    logger: Logger,
    context?: {
        topic?: string;
        mood?: string;
        user?: {firstName?: string; lastName?: string; interests?: string[]};
    }
): Promise<string> {
    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const GEMINI_API_URL = process.env.GEMINI_API_URL;

        if (!GEMINI_API_KEY) {
            logger.warn('GEMINI_API_KEY not set in environment variables');
            return getFallbackPostContent(context);
        }

        // Build prompt based on provided context
        let prompt = 'Generate a realistic social media post';
        if (context?.topic) prompt += ` about ${context.topic}`;
        if (context?.mood) prompt += ` with a ${context.mood} tone`;
        if (context?.user?.firstName) {
            const fullName = context.user.lastName
                ? `${context.user.firstName} ${context.user.lastName}`
                : context.user.firstName;
            prompt += ` as if written by ${fullName}`;
        }
        if (context?.user?.interests?.length) {
            prompt += ` who is interested in ${context.user.interests.join(', ')}`;
        }

        prompt += '. Make it sound natural, engaging, and 1-3 sentences long.';

        const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            contents: [
                {
                    parts: [
                        {
                            text: prompt,
                        },
                    ],
                },
            ],
        });

        // Extract the generated text
        const generatedText = response.data.candidates[0].content.parts[0].text.trim();
        return generatedText;
    } catch (error: any) {
        logger.error(`Error generating post content with Gemini: ${error.message}`);
        return getFallbackPostContent(context);
    }
}

/**
 * Provides fallback content when Gemini API is unavailable
 */
function getFallbackPostContent(context?: {topic?: string; mood?: string; user?: any}): string {
    const topics = {
        technology: [
            "Just got my hands on the latest tech gadget! Can't wait to try it out.",
            'Technology keeps evolving so fast. What innovations are you most excited about?',
            'Working on a new coding project today. Sometimes the best solutions are the simplest ones.',
        ],
        travel: [
            'Missing those beautiful sunsets in Thailand. Where should I travel next?',
            'Nothing beats the feeling of exploring a new city for the first time.',
            'Just booked my next adventure! Counting down the days.',
        ],
        food: [
            'Made this incredible pasta dish tonight. Simple ingredients, amazing flavors!',
            'Found this hidden gem restaurant yesterday. Their desserts are to die for!',
            'Anyone else feel like cooking is the perfect way to unwind after a long day?',
        ],
        fitness: [
            'Personal best on my 5K today! Consistency really does pay off.',
            "Morning workouts set the tone for the entire day. What's your favorite exercise routine?",
            "Switched up my fitness routine this week and I'm feeling stronger already.",
        ],
        art: [
            'Art speaks where words fail. Visited an incredible exhibition today.',
            'Finding inspiration in the smallest details today. Beauty is everywhere if you look for it.',
            "Started a new creative project this weekend. It's messy, imperfect, and I'm loving every minute of it.",
        ],
        default: [
            'What a beautiful day to be alive!',
            'Grateful for all the amazing people in my life.',
            'Sometimes the smallest moments bring the greatest joy.',
            'Taking time to appreciate the little things today.',
            'Life is full of unexpected adventures.',
        ],
    };

    const selectedTopic =
        context?.topic && topics[context.topic as keyof typeof topics]
            ? (context.topic as keyof typeof topics)
            : 'default';

    const availablePosts = topics[selectedTopic];
    return faker.helpers.arrayElement(availablePosts);
}

interface UserData {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string;
    phoneNumber: string;
}

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
        const userSharePostRepo = dataSource.getRepository(UserSharePost);

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
        await userSharePostRepo.query('TRUNCATE TABLE "user_share_post" CASCADE');

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
            'Gaming Community',
            'Art & Design',
            'Science & Tech',
            'Nature Lovers',
            'Pet Owners Club',
            'Learning Languages',
            'Startup Community',
            'Film Enthusiasts',
            'Anime & Manga Fans',
            'Home Cooking',
            'DIY Projects',
            'Hiking Adventures',
            'Cryptocurrency Discussions',
        ];

        // Calculate how many groups should have admins (70%)
        const totalGroups = groupNames.length;
        const adminGroupsCount = Math.floor(totalGroups * 0.7);
        const adminOwnedGroupsCount = Math.floor(totalGroups * 0.35);
        const nonAdminGroupsCount = totalGroups - adminGroupsCount;

        logger.log(
            `Creating ${totalGroups} groups: ${adminOwnedGroupsCount} admin-owned, ${adminGroupsCount - adminOwnedGroupsCount} admin-member, ${nonAdminGroupsCount} non-admin groups`
        );

        // Shuffle group names to randomize which ones get admins
        const shuffledGroupNames = [...groupNames];
        for (let i = shuffledGroupNames.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledGroupNames[i], shuffledGroupNames[j]] = [shuffledGroupNames[j], shuffledGroupNames[i]];
        }

        // Create groups based on our categorization
        for (let i = 0; i < shuffledGroupNames.length; i++) {
            let groupOwner;
            let hasAdmin = false;

            // First portion are admin-owned groups
            if (i < adminOwnedGroupsCount) {
                groupOwner = i % 2 === 0 ? adminUserRef : admin2UserRef;
                hasAdmin = true;
            }
            // Next portion are groups where admins are members but not owners
            else if (i < adminGroupsCount) {
                groupOwner = faker.helpers.arrayElement(
                    userRefs.filter((u) => u !== adminUserRef && u !== admin2UserRef)
                );
                hasAdmin = true;
            }
            // Remaining groups don't have admins involved
            else {
                groupOwner = faker.helpers.arrayElement(
                    userRefs.filter((u) => u !== adminUserRef && u !== admin2UserRef)
                );
                hasAdmin = false;
            }

            // Skip if no owner could be assigned
            if (!groupOwner) continue;

            const group = groupRepo.create({
                name: shuffledGroupNames[i],
                description: faker.lorem.paragraph(),
                profileImageUrl: faker.helpers.arrayElement(imageLinks),
                coverImageUrl: faker.helpers.arrayElement(imageLinks),
                city: faker.location.city(),
                country: faker.location.country(),
                visibility: faker.helpers.arrayElement([groupVisibility.PUBLIC, groupVisibility.PRIVATE]),
                owner: groupOwner,
            });

            // Assign 2-4 rules to each group
            group.groupRules = faker.helpers.arrayElements(storedGroupRules, faker.number.int({min: 2, max: 4}));

            await groupRepo.save(group);

            // Create member list - we want 10-20 members per group
            const memberCount = faker.number.int({min: 10, max: 20});

            // Start with members that aren't the owner
            const potentialMembers = userRefs.filter((user) => user.id !== groupOwner.id);

            // If this is a group that should have admins as members and they're not already the owner
            if (hasAdmin) {
                // Add both admins if they're not already the owner
                if (adminUserRef && adminUserRef.id !== groupOwner.id) {
                    await dataSource.query(
                        'INSERT INTO "group_members_user_references" ("groupId", "userReferencesId") VALUES ($1, $2)',
                        [group.id, adminUserRef.id]
                    );
                }
                if (admin2UserRef && admin2UserRef.id !== groupOwner.id) {
                    await dataSource.query(
                        'INSERT INTO "group_members_user_references" ("groupId", "userReferencesId") VALUES ($1, $2)',
                        [group.id, admin2UserRef.id]
                    );
                }
            }

            // Get remaining members needed (accounting for admins already added)
            let additionalMembersNeeded = memberCount;
            if (hasAdmin) {
                if (adminUserRef && adminUserRef.id !== groupOwner.id) additionalMembersNeeded--;
                if (admin2UserRef && admin2UserRef.id !== groupOwner.id) additionalMembersNeeded--;
            }

            // Get random members
            const regularMembers = faker.helpers.arrayElements(
                potentialMembers.filter(
                    (u) => adminUserRef && u.id !== adminUserRef.id && admin2UserRef && u.id !== admin2UserRef.id
                ),
                Math.min(additionalMembersNeeded, potentialMembers.length)
            );

            // Add regular members
            for (const member of regularMembers) {
                try {
                    await dataSource.query(
                        'INSERT INTO "group_members_user_references" ("groupId", "userReferencesId") VALUES ($1, $2)',
                        [group.id, member.id]
                    );
                } catch (error: any) {
                    logger.warn(`Failed to add member ${member.id} to group ${group.id}: ${error.message}`);
                }
            }

            // Always add the owner as a member if not already added
            try {
                await dataSource.query(
                    'INSERT INTO "group_members_user_references" ("groupId", "userReferencesId") VALUES ($1, $2)',
                    [group.id, groupOwner.id]
                );
            } catch (error: any) {
                logger.warn(`Failed to add owner ${groupOwner.id} to group ${group.id}: ${error.message}`);
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
                    // Determine appropriate topics for this page based on its category/name
                    const pageTopics = determinePageTopics(page.name, page.category);

                    // Generate AI content for this page post
                    const postContent = await generateMeaningfulPostContent(logger, {
                        topic: faker.helpers.arrayElement(pageTopics),
                        mood: 'professional',
                        user: {
                            firstName: page.name,
                            interests: pageTopics,
                        },
                    });

                    const post = postRepo.create({
                        content: postContent,
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
                                    : faker.helpers.arrayElement(imageLinks),
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
                    visibility:
                        group.visibility === groupVisibility.PUBLIC ? visibilityEnum.PUBLIC : visibilityEnum.PRIVATE,
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

                // Determine if this is a group that has an admin as owner or member
                let hasAdmin = group.owner_id === adminUserRef?.id || group.owner_id === admin2UserRef?.id;

                if (!hasAdmin) {
                    // Check if admin is a member
                    const adminIsMember = await dataSource.query(
                        'SELECT 1 FROM "group_members_user_references" WHERE "groupId" = $1 AND "userReferencesId" IN ($2, $3) LIMIT 1',
                        [group.id, adminUserRef?.id || '', admin2UserRef?.id || '']
                    );

                    if (adminIsMember.length > 0) {
                        hasAdmin = true;
                    }
                }

                // How many posts to create depends on whether admins are involved
                const groupPostCount = hasAdmin
                    ? faker.number.int({min: 11, max: 15}) // 30-40 posts for admin groups
                    : faker.number.int({min: 2, max: 3}); // 2-3 posts for non-admin groups

                logger.log(
                    `Creating ${groupPostCount} posts for group: ${group.name} (${hasAdmin ? 'admin' : 'non-admin'} group)`
                );

                for (let i = 0; i < groupPostCount; i++) {
                    const memberIds: {userReferencesId: string}[] = await dataSource.query(
                        'SELECT "userReferencesId" FROM "group_members_user_references" WHERE "groupId" = $1',
                        [group.id]
                    );

                    if (memberIds.length > 0) {
                        const randomMemberId = faker.helpers.arrayElement(memberIds).userReferencesId;
                        const memberUser = await userReferenceRepo.findOne({where: {id: randomMemberId}});

                        if (memberUser) {
                            // Determine topics relevant to this group
                            const groupTopics = determineGroupTopics(group.name);

                            // Generate AI content for this group post
                            const postContent = await generateMeaningfulPostContent(logger, {
                                topic: faker.helpers.arrayElement(groupTopics),
                                user: {
                                    firstName: memberUser.firstName,
                                    lastName: memberUser.lastName,
                                    interests: groupTopics,
                                },
                            });

                            const post = postRepo.create({
                                content: postContent,
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
                                                : faker.helpers.arrayElement(imageLinks),
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
                // Get the user's interests based on username instead of biography
                const userInterests = newsFeed.owner?.username
                    ? extractInterestsFromText(newsFeed.owner.username)
                    : ['social media', 'friends'];

                // Determine post topic from available topics or generate a random one
                const randomTopic = faker.helpers.arrayElement([
                    'technology',
                    'travel',
                    'food',
                    'fitness',
                    'art',
                    'music',
                    'books',
                    'movies',
                    'fashion',
                    'sports',
                ]);

                // Generate AI content or fallback based on user data
                const postContent = await generateMeaningfulPostContent(logger, {
                    topic: randomTopic,
                    user: {
                        firstName: newsFeed.owner?.firstName,
                        lastName: newsFeed.owner?.lastName,
                        interests: userInterests,
                    },
                });

                const post = postRepo.create({
                    content: postContent,
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
                                : faker.helpers.arrayElement(imageLinks),
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

            // Create shared posts
            if (faker.datatype.boolean({probability: 0.3})) {
                // Get posts from this newsfeed to potentially share
                const newsFeedPosts = await postRepo.find({
                    where: {newsFeed: {id: newsFeed.id}},
                    relations: ['postAttachments', 'topics'],
                });

                // Skip if no posts to share
                if (newsFeedPosts.length === 0) continue;

                const sharersCount = faker.number.int({min: 1, max: 3});
                const potentialSharers = userRefs.filter((u) => u.id !== newsFeed.owner?.id);
                const sharers = faker.helpers.arrayElements(potentialSharers, sharersCount);

                for (const sharer of sharers) {
                    // Get the sharer's feed
                    const sharerFeed = await newsFeedRepo.findOne({
                        where: {owner: {id: sharer.id}},
                        relations: ['owner'],
                    });

                    if (!sharerFeed) continue;

                    try {
                        // Pick a random post to share
                        const postToShare = faker.helpers.arrayElement(newsFeedPosts);

                        // Create a duplicate post in the sharer's feed
                        const sharedPost = postRepo.create({
                            content: postToShare.content,
                            newsFeed: sharerFeed,
                            owner: sharer,
                            topics: postToShare.topics || [],
                        });
                        await postRepo.save(sharedPost);

                        // Duplicate attachments if any
                        if (postToShare.postAttachments && postToShare.postAttachments.length > 0) {
                            for (const attachment of postToShare.postAttachments) {
                                const duplicateAttachment = postAttachmentRepo.create({
                                    attachment_url: attachment.attachment_url,
                                    attachmentType: attachment.attachmentType,
                                    post: sharedPost,
                                });
                                await postAttachmentRepo.save(duplicateAttachment);
                            }
                        }

                        // Track the share in UserSharePost table
                        const shareRecord = userSharePostRepo.create({
                            user_id: sharer.id,
                            post_id: postToShare.id,
                        });
                        await userSharePostRepo.save(shareRecord);

                        logger.log(`Created shared post by ${sharer.username}`);
                    } catch (error: any) {
                        logger.error(`Error creating shared post: ${error.message}`);
                    }
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
                        thumbnail_url: faker.image.url(),
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
                                : faker.helpers.arrayElement(imageLinks),
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
                    thumbnail_url: faker.image.url(),
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
                                : faker.helpers.arrayElement(imageLinks),
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
                    thumbnail_url: faker.image.url(),
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
