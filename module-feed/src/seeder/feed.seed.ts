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

class GeminiRateLimiter {
    private requests: number[] = [];
    private readonly maxRequests = 30;
    private readonly timeWindow = 60000;
    async waitForSlot(): Promise<void> {
        const now = Date.now();

        this.requests = this.requests.filter((time) => now - time < this.timeWindow);

        if (this.requests.length >= this.maxRequests) {
            const oldestRequest = this.requests[0];
            const waitTime = this.timeWindow - (now - oldestRequest);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            return this.waitForSlot();
        }

        this.requests.push(now);
    }
}

const geminiRateLimiter = new GeminiRateLimiter();

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
 * Current real-world data for more realistic content generation
 */
const realWorldData = {
    // Notable events (past, ongoing, and upcoming in 2024-2025)
    events: [
        'Paris Olympics 2024',
        'US Presidential Election 2024',
        'Artemis Moon Mission',
        'Eurovision Song Contest 2024',
        'COP30 Climate Summit',
        'FIFA Club World Cup 2025',
        'World Expo 2025 in Osaka',
        '2024 Summer Paralympics',
        'UEFA Euro 2024',
        'SpaceX Starship orbital tests',
        'Grand Egyptian Museum opening',
        'Tokyo Game Show 2024',
        'Expo 2025 in Japan',
        'Venice Biennale 2024',
        'WWDC 2024',
        'CES 2025 in Las Vegas',
        'British general election',
    ],

    // Real geographical locations and cities
    locations: [
        'New York City',
        'Tokyo',
        'Paris',
        'London',
        'Berlin',
        'Singapore',
        'Sydney',
        'Toronto',
        'Dubai',
        'Seoul',
        'Reykjavik',
        'San Francisco',
        'Venice',
        'Cape Town',
        'Amsterdam',
        'Kyoto',
        'Barcelona',
        'Marrakech',
        'Istanbul',
        'Stockholm',
        'Oslo',
        'Helsinki',
        'Mumbai',
        'Bangkok',
        'Shanghai',
        'Lisbon',
        'Athens',
        'Vienna',
        'Prague',
        'Budapest',
    ],

    // Real venues, spaces, and landmarks
    venues: [
        'Louvre Museum',
        'London Science Museum',
        'Central Park',
        'Golden Gate Park',
        'Shibuya Crossing',
        'Grand Central Terminal',
        'Empire State Building',
        'Gardens by the Bay',
        'British Museum',
        'Tate Modern',
        'Eiffel Tower',
        'Tokyo Skytree',
        'Brooklyn Bridge',
        'Sydney Opera House',
        'Guggenheim Museum',
        'CERN',
        'Silicon Valley',
        'Machu Picchu',
        'Great Barrier Reef',
        'Yosemite National Park',
        'Grand Canyon',
    ],

    // Technology companies and products
    techEntities: [
        'Apple Vision Pro',
        'Microsoft Copilot',
        'Google Gemini',
        'Tesla Cybertruck',
        'SpaceX Starship',
        'OpenAI GPT-5',
        'Meta Quest 3',
        'Boston Dynamics robots',
        'Amazon Luna',
        'Nintendo Switch 2',
        'PlayStation VR2',
        'Rivian electric trucks',
        'Samsung Galaxy foldables',
        'Apple Intelligence',
        'Microsoft Surface',
        'Spotify AI DJ',
        'TikTok creative tools',
        'YouTube Shorts',
        'Netflix interactive shows',
    ],

    // Sustainability initiatives
    sustainability: [
        'carbon-neutral buildings',
        'vertical farming projects',
        'ocean cleanup initiatives',
        'renewable energy microgrids',
        'circular economy marketplaces',
        'electric public transportation',
        'regenerative agriculture',
        'carbon capture technology',
        'plant-based alternatives',
        'zero-waste stores',
        'sustainable fashion brands',
        'community solar projects',
        'plastic-free packaging',
        'reforestation efforts',
    ],

    // Health and wellness trends
    healthTrends: [
        'digital mental health platforms',
        'sleep optimization technology',
        'personalized nutrition',
        'longevity research',
        'wellness tourism',
        'fitness metaverse experiences',
        'preventative healthcare AI',
        'genetic wellness profiles',
        'mindfulness apps',
        'remote healthcare solutions',
        'wearable health monitors',
        'community wellness centers',
    ],
};

/**
 * Generates meaningful post content using Gemini AI with real-world references
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

        // Wait for a rate limit slot before making the request
        await geminiRateLimiter.waitForSlot();

        // Select real-world references to potentially include
        const realEvent = faker.helpers.arrayElement(realWorldData.events);
        const realLocation = faker.helpers.arrayElement(realWorldData.locations);
        const realVenue = faker.helpers.arrayElement(realWorldData.venues);
        const realTech = faker.helpers.arrayElement(realWorldData.techEntities);
        const realSustainability = faker.helpers.arrayElement(realWorldData.sustainability);
        const realHealth = faker.helpers.arrayElement(realWorldData.healthTrends);

        // Build prompt based on provided context
        let prompt = 'Write a single social media post (1-2 sentences)';

        // Include topic if provided
        if (context?.topic) {
            prompt += ` about ${context.topic}`;
        }

        // Add mood if specified
        if (context?.mood) {
            prompt += ` with a ${context.mood} tone`;
        }

        // Add user context if provided
        if (context?.user?.firstName) {
            const fullName = context.user.lastName
                ? `${context.user.firstName} ${context.user.lastName}`
                : context.user.firstName;
            prompt += ` as if written by ${fullName}`;
        }

        if (context?.user?.interests?.length) {
            prompt += ` who is interested in ${context.user.interests.join(', ')}`;
        }

        // Add real-world context with a higher probability for certain categories based on the topic
        if (context?.topic?.toLowerCase().includes('tech') || context?.topic?.toLowerCase().includes('technology')) {
            prompt += `. Mention ${realTech}`;
        } else if (
            context?.topic?.toLowerCase().includes('travel') ||
            context?.topic?.toLowerCase().includes('tourism')
        ) {
            prompt += `. Mention ${realLocation} or ${realVenue}`;
        } else if (
            context?.topic?.toLowerCase().includes('environment') ||
            context?.topic?.toLowerCase().includes('sustainable') ||
            context?.topic?.toLowerCase().includes('climate')
        ) {
            prompt += `. Mention ${realSustainability}`;
        } else if (
            context?.topic?.toLowerCase().includes('health') ||
            context?.topic?.toLowerCase().includes('wellness')
        ) {
            prompt += `. Mention ${realHealth}`;
        } else {
            // For other topics, randomly select a real-world element to reference
            const realWorldElements = [
                `the ${realEvent}`,
                realLocation,
                realVenue,
                realTech,
                realSustainability,
                realHealth,
            ];
            prompt += `. Mention ${faker.helpers.arrayElement(realWorldElements)}`;
        }

        prompt += '. Write only the post content, no explanations or formatting.';

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

        // Extract the generated text and clean it up
        let generatedText = response.data.candidates[0].content.parts[0].text.trim();

        // Remove any lines that start with common explanation markers
        generatedText = generatedText
            .split('\n')
            .filter((line) => !line.match(/^(ok|here|explanation|note|\*|>|#)/i))
            .join('\n')
            .trim();

        // Remove any markdown formatting
        generatedText = generatedText.replace(/[*_`]/g, '').trim();

        // Remove any hashtags
        generatedText = generatedText.replace(/#\w+/g, '').trim();

        // Remove any extra whitespace and newlines
        generatedText = generatedText.replace(/\s+/g, ' ').trim();

        // If the text is empty after cleaning, use fallback content
        if (!generatedText) {
            return getFallbackPostContent(context);
        }

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
    // Updated fallback content with real-world references (2024-2025)
    const topics = {
        technology: [
            `Just got my hands on the Apple Vision Pro and it's a complete game-changer for my workflow. The mixed reality capabilities are even better than I expected!`,
            `Watching the SpaceX Starship launch live was absolutely breathtaking. Another giant leap for space exploration and Mars colonization feels closer than ever.`,
            `Testing Google Gemini's coding capabilities and I'm impressed by how it handles complex software architecture. AI assistants have become indispensable tools.`,
            `Exploring the new immersive exhibits at the Tokyo Game Show 2024. The gaming industry's innovation is at an all-time high with these new haptic technologies.`,
        ],
        travel: [
            `Just landed in Paris for the 2024 Olympics and the city's transformation is spectacular. Can't wait to attend the opening ceremony along the Seine!`,
            `The cherry blossoms in Kyoto this spring were absolutely magical. Philosophers Path was crowded but Arashiyama was surprisingly peaceful and just as beautiful.`,
            `Finally visited the Grand Egyptian Museum and it exceeded all expectations. The new Tutankhamun gallery is a masterpiece of modern museum design.`,
            `Working remotely from Lisbon this month. The city's digital nomad infrastructure is impressive, and the Time Out Market has the best working lunch options.`,
        ],
        food: [
            `Tried Impossible Foods' new seafood alternative at the San Francisco Food Innovation Expo. The texture and flavor are remarkably close to the real thing!`,
            `The vertical farming restaurant in Singapore serves the freshest salads I've ever tasted. You can literally see your food growing while you dine!`,
            `Reservations for Barcelona's new zero-waste restaurant are nearly impossible to get. After three months of waiting, I can confirm it's worth the hype.`,
            `Amazon's automated grocery store just opened in my neighborhood in Toronto. The checkout-free experience is seamless, though I miss chatting with cashiers.`,
        ],
        fitness: [
            `My new Apple Fitness+ meditation series with spatial audio is tremendously effective. The added biofeedback features in watchOS 11 really enhance the experience.`,
            `Training for the London Marathon using the new Nike adaptive running shoes. Their real-time gait adjustment technology has significantly improved my pace.`,
            `The Tokyo Olympic climbing wall design has inspired a whole new approach to climbing gym layouts. My local gym just got renovated with the same specifications!`,
            `Just finished a month with the Peloton AI Coach. The personalized training adjustments based on sleep and HRV data made a noticeable difference in my performance.`,
        ],
        art: [
            `The Venice Biennale 2024 is showcasing the most innovative blend of traditional art and AI collaboration I've ever seen. The Japanese pavilion especially blew me away.`,
            `Visited the new immersive Van Gogh exhibition at the Louvre that uses breakthrough holographic technology. The way you can step inside the paintings is revolutionary.`,
            `The NFT gallery at Art Basel Miami is finally bringing digital art into conversation with traditional mediums in a thoughtful way. The hybrid installations are outstanding.`,
            `The augmented reality street art tour in Berlin transforms the entire city into a canvas. The Brandenburg Gate installation is particularly moving with its historical context.`,
        ],
        environment: [
            `Just installed solar tiles from Tesla's new residential energy line. The efficiency is impressive, and the app integration with our home battery is seamless.`,
            `Attended COP30 in Brazil and was encouraged by the binding commitments from major economies. The indigenous-led reforestation initiative is particularly promising.`,
            `Our community joined the worldwide coastal cleanup initiative yesterday. The new biodegradable collection tools developed at MIT made a huge difference in efficiency.`,
            `Visited Singapore's latest addition to Gardens by the Bay that showcases drought-resistant landscaping techniques. Critical innovation as climate challenges intensify.`,
        ],
        sports: [
            `The atmosphere at UEFA Euro 2024 in Berlin was electric! The semi-automated offside technology made such a difference to the flow of the game.`,
            `Just witnessed history at the Paris Olympics as the world record in the 100m was broken again! The track technology at Stade de France is clearly making a difference.`,
            `The integration of player biometrics in the NBA app this season has completely transformed how I watch basketball. The real-time performance insights are fascinating.`,
            `The new FC Barcelona stadium is a masterpiece of sustainable architecture. Watching El Clásico there yesterday with 100% renewable energy powering the venue felt special.`,
        ],
        politics: [
            `The presidential debate's new fact-checking system was a game-changer. Real-time information validation should be standard for all political discourse going forward.`,
            `Attending the climate policy summit in Stockholm where leaders are finalizing the comprehensive carbon pricing framework. The economic modeling looks promising.`,
            `The digital voting system being tested for the British general election seems remarkably secure. The blockchain verification adds an important layer of transparency.`,
            `Just finished reading the newly released global cooperation framework coming out of the G20 summit in New Delhi. The technology sharing provisions are particularly bold.`,
        ],
        health: [
            `The mRNA vaccine technology is now being successfully applied to malaria treatment with impressive early results from the Lagos trial. Medical innovation at its best.`,
            `My hospital just implemented the new AI diagnostic system that caught my friend's early-stage condition that traditional screenings missed. Literally life-changing technology.`,
            `The mental health app developed in collaboration with the WHO has transformed accessible care. The personalized therapy sessions use remarkably effective AI adaptation.`,
            `The wearable health monitor approved last month by the FDA provides unprecedented early warning for cardiac issues. Peace of mind in a simple skin patch.`,
        ],
        education: [
            `My daughter's school just implemented the Finnish-developed hybrid learning system. The balance between digital and tactile learning feels exactly right.`,
            `The MIT free online quantum computing course is impressively accessible for non-physicists. The interactive simulations make complex concepts much clearer.`,
            `The AR language learning app that uses London street signs and menus for real-world practice has accelerated my Portuguese progress dramatically.`,
            `Harvard's new approach to virtual exchange programs lets students collaborate with peers in Tokyo and Lagos simultaneously. Global education at its best.`,
        ],
        default: [
            `The sunset over Central Park yesterday with the new architectural skyline was absolutely breathtaking. New York keeps reinventing its beauty.`,
            `Just experienced the immersive concert at the Sydney Opera House using the new spatial sound technology. Music will never be the same after this.`,
            `Working from the new carbon-negative coworking space in Helsinki has been inspiring. Their commitment to measurable sustainability sets a new standard.`,
            `The community garden project in Barcelona is bringing neighbors together while addressing local food security. Urban transformation at its finest.`,
            `The Paris Olympics opening ceremony along the Seine exceeded all expectations. A powerful celebration of athleticism, culture, and human connection.`,
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

        // Find our designated content creators (search by username patterns)
        logger.log('Identifying content creators...');

        // Define the special content creator usernames
        const contentCreatorUsernames = [
            'sarah_travels',
            'tech_mike',
            'fitness_alex',
            'chef_emily',
            'artist_james',
            'news_lisa',
        ];

        // Find these users in our user references
        const contentCreators = userRefs.filter((user) => contentCreatorUsernames.includes(user.username || ''));

        if (contentCreators.length === 0) {
            logger.warn('No content creators found! Make sure to run user seeder with special content creators first');
        } else {
            logger.log(
                `Found ${contentCreators.length} content creators: ${contentCreators.map((c) => c.username).join(', ')}`
            );
        }

        // A very small subset of regular users will also get content
        const regularUserPercentWithContent = 0.01; // 1%
        const regularUsersExcludingCreatorsAndAdmins = userRefs.filter(
            (u) => u !== adminUserRef && u !== admin2UserRef && !contentCreators.some((c) => c.id === u.id)
        );

        const regularUsersWithContent = faker.helpers.arrayElements(
            regularUsersExcludingCreatorsAndAdmins,
            Math.ceil(regularUsersExcludingCreatorsAndAdmins.length * regularUserPercentWithContent)
        );

        logger.log(`Selected ${regularUsersWithContent.length} additional regular users to have content`);

        // All users who will get news feeds and content
        const usersWithContent = [
            ...(adminUserRef ? [adminUserRef] : []),
            ...(admin2UserRef ? [admin2UserRef] : []),
            ...contentCreators,
            ...regularUsersWithContent,
        ];

        // Create news feeds only for users who will have content
        logger.log(`Creating news feeds only for ${usersWithContent.length} users who will have content...`);
        const newsFeeds: NewsFeed[] = [];
        let adminNewsFeed: NewsFeed | undefined;
        let admin2NewsFeed: NewsFeed | undefined;

        // Create user news feeds only for selected users
        for (const userRef of usersWithContent) {
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
                            ? visibilityEnum.PUBLIC
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
                    } else if (contentCreators.some((c) => c.id === userRef.id)) {
                        logger.log(`Created news feed for content creator: ${userRef.username}`);
                    } else {
                        logger.log(`Created news feed for regular user: ${userRef.username}`);
                    }
                }
            } catch (error: any) {
                logger.error(`Error creating news feed for user ${userRef.username}: ${error.message}`);
            }
        }

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
        const pageNames = ['Infinivista Official', 'Travel Photography', 'Tech Enthusiasts', 'Art & Design Hub'];

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
                profileImageUrl: faker.helpers.arrayElement(imageLinks),
                coverImageUrl: faker.helpers.arrayElement(imageLinks),
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
        const groupNames = ['Photography Enthusiasts', 'Software Developers', 'Book Club', 'Travel Addicts'];

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
            const memberCount = faker.number.int({min: 30, max: 200});

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

                const pagePostCount = faker.number.int({min: 4, max: 8});
                for (let i = 0; i < pagePostCount; i++) {
                    // Get the user's interests based on username instead of biography
                    const userInterests = page.name ? extractInterestsFromText(page.name) : ['social media', 'friends'];

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
                        'environment',
                        'education',
                        'politics',
                        'health',
                    ]);

                    // Generate AI content with real-world references
                    const postContent = await generateMeaningfulPostContent(logger, {
                        topic: randomTopic,
                        user: {
                            firstName: page.name,
                            lastName: '',
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

                    const reactionCount = faker.number.int({min: 5, max: 15});
                    const reactionTypes = Object.values(ReactionType);

                    const reactingUsers = faker.helpers.arrayElements(
                        userRefs,
                        Math.min(reactionCount, userRefs.length)
                    );

                    for (const user of reactingUsers) {
                        const reaction = userReactPostRepo.create({
                            user_id: user.id,
                            post_id: post.id,
                            reactionType: faker.helpers.arrayElement(reactionTypes),
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

                const groupPostCount = hasAdmin
                    ? faker.number.int({min: 6, max: 8})
                    : faker.number.int({min: 1, max: 1});

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

                            // Get the user's interests based on username instead of biography
                            const userInterests = group.name
                                ? extractInterestsFromText(group.name)
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
                                'environment',
                                'education',
                                'politics',
                                'health',
                            ]);

                            // Select relevant real-world elements based on the chosen topic

                            // Generate AI content with real-world references
                            const postContent = await generateMeaningfulPostContent(logger, {
                                topic: randomTopic,
                                user: {
                                    firstName: memberUser.firstName,
                                    lastName: memberUser.lastName,
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

        // Process content creators first to ensure they have content
        for (const contentCreator of contentCreators) {
            const creatorFeed = newsFeeds.find((feed) => feed.owner?.id === contentCreator.id);
            if (!creatorFeed) {
                logger.warn(`Could not find news feed for content creator: ${contentCreator.username}`);
                continue;
            }

            // Content creators get more posts (8-15 posts each)
            const postCount = faker.number.int({min: 4, max: 6});

            logger.log(`Creating ${postCount} posts for content creator: ${contentCreator.username}`);

            for (let i = 0; i < postCount; i++) {
                const isViralPost = faker.datatype.boolean({probability: 0.7});

                // Determine the topic based on the user's specialty
                let specialtyTopics: string[] = [];

                switch (contentCreator.username) {
                    case 'sarah_travels':
                        specialtyTopics = ['travel', 'photography', 'culture', 'adventure'];
                        break;
                    case 'tech_mike':
                        specialtyTopics = ['technology', 'gadgets', 'programming', 'artificial intelligence'];
                        break;
                    case 'fitness_alex':
                        specialtyTopics = ['fitness', 'nutrition', 'wellness', 'exercise'];
                        break;
                    case 'chef_emily':
                        specialtyTopics = ['food', 'cooking', 'recipes', 'culinary arts'];
                        break;
                    case 'artist_james':
                        specialtyTopics = ['art', 'design', 'creativity', 'digital art'];
                        break;
                    case 'news_lisa':
                        specialtyTopics = ['news', 'current events', 'politics', 'social issues'];
                        break;
                    default:
                        specialtyTopics = ['social media', 'lifestyle'];
                }

                const randomTopic = faker.helpers.arrayElement(specialtyTopics);

                // Generate AI content with real-world references specific to creator's niche
                const postContent = await generateMeaningfulPostContent(logger, {
                    topic: randomTopic,
                    mood: isViralPost
                        ? faker.helpers.arrayElement(['exciting', 'inspiring', 'informative', 'passionate'])
                        : undefined,
                    user: {
                        firstName: contentCreator.firstName,
                        lastName: contentCreator.lastName,
                        interests: specialtyTopics,
                    },
                });

                const post = postRepo.create({
                    content: postContent,
                    newsFeed: creatorFeed,
                    topics:
                        topics.length > 0
                            ? faker.helpers.arrayElements(
                                  topics,
                                  isViralPost ? faker.number.int({min: 3, max: 6}) : faker.number.int({min: 1, max: 3})
                              )
                            : [],
                    owner: creatorFeed.owner,
                });
                await postRepo.save(post);

                const attachmentCount = isViralPost
                    ? faker.number.int({min: 4, max: 5})
                    : faker.number.int({min: 0, max: 3});

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

                // Viral posts get more comments
                const commentCount = isViralPost
                    ? faker.number.int({min: 85, max: 200})
                    : faker.number.int({min: 0, max: 5});

                for (let k = 0; k < commentCount; k++) {
                    const randomUser = faker.helpers.arrayElement(userRefs);
                    const comment = commentRepo.create({
                        text: faker.lorem.sentence(),
                        attachment_url: faker.datatype.boolean({probability: isViralPost ? 0.4 : 0.2})
                            ? faker.helpers.arrayElement(imageLinks)
                            : undefined,
                        user: randomUser,
                        post,
                    });
                    await commentRepo.save(comment);
                }

                const reactionCount = isViralPost
                    ? faker.number.int({min: 280, max: 380})
                    : faker.number.int({min: 14, max: 50});

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

                if (isViralPost || faker.datatype.boolean({probability: 0.3})) {
                    const sharersCount = isViralPost
                        ? faker.number.int({min: 10, max: 30})
                        : faker.number.int({min: 1, max: 3});

                    const potentialSharers = userRefs.filter((u) => u.id !== contentCreator.id);
                    const sharers = faker.helpers.arrayElements(
                        potentialSharers,
                        Math.min(sharersCount, potentialSharers.length)
                    );

                    for (const sharer of sharers) {
                        // Get the sharer's feed
                        const sharerFeed = await newsFeedRepo.findOne({
                            where: {owner: {id: sharer.id}},
                            relations: ['owner'],
                        });

                        if (!sharerFeed) continue;

                        try {
                            // Create a duplicate post in the sharer's feed
                            const sharedPost = postRepo.create({
                                // Use the same content as the original post
                                ...post,
                                newsFeed: sharerFeed,
                            });
                            await postRepo.save(sharedPost);

                            // Track the share in UserSharePost table
                            const shareRecord = userSharePostRepo.create({
                                user_id: sharer.id,
                                post_id: post.id,
                            });
                            await userSharePostRepo.save(shareRecord);
                        } catch (error: any) {
                            logger.error(`Error creating shared post: ${error.message}`);
                        }
                    }
                }
            }

            // Create stories for content creators (3-6 stories each)
            const storyCount = faker.number.int({min: 3, max: 6});
            logger.log(`Creating ${storyCount} stories for content creator: ${contentCreator.username}`);

            for (let i = 0; i < storyCount; i++) {
                const attachmentType = faker.helpers.arrayElement(Object.values(AttachmentType));
                const imageUrl = faker.helpers.arrayElement(imageLinks);
                const story = storyRepo.create({
                    story_url:
                        attachmentType === AttachmentType.VIDEO ? faker.helpers.arrayElement(videoLinks) : imageUrl,
                    thumbnail_url: imageUrl,
                    duration: faker.number.int({min: 5, max: 30}),
                    attachmentType,
                    newsFeed: creatorFeed,
                });
                await storyRepo.save(story);

                // Stories get a lot of reactions and comments (they're from content creators)
                const storyCommentCount = faker.number.int({min: 5, max: 15});
                for (let c = 0; c < storyCommentCount; c++) {
                    const randomUser = faker.helpers.arrayElement(userRefs);
                    const comment = commentRepo.create({
                        text: faker.lorem.sentence(),
                        attachment_url: faker.datatype.boolean({probability: 0.2})
                            ? faker.helpers.arrayElement(imageLinks)
                            : undefined,
                        user: randomUser,
                        story: story,
                    });
                    await commentRepo.save(comment);
                }

                const storyReactionCount = faker.number.int({min: 20, max: 80});
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

        // Process regular users with content
        for (const regularUser of regularUsersWithContent) {
            const userFeed = newsFeeds.find((feed) => feed.owner?.id === regularUser.id);
            if (!userFeed) {
                logger.warn(`Could not find news feed for regular user with content: ${regularUser.username}`);
                continue;
            }

            // Create 1-3 posts for regular users who have content
            const postCount = faker.number.int({min: 1, max: 3});

            logger.log(`Creating ${postCount} posts for regular user: ${regularUser.username}`);

            for (let i = 0; i < postCount; i++) {
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
                    'environment',
                    'education',
                    'politics',
                    'health',
                ]);

                const postContent = await generateMeaningfulPostContent(logger, {
                    topic: randomTopic,
                    user: {
                        firstName: regularUser.firstName,
                        lastName: regularUser.lastName,
                        interests: extractInterestsFromText(regularUser.username || ''),
                    },
                });

                const post = postRepo.create({
                    content: postContent,
                    newsFeed: userFeed,
                    topics:
                        topics.length > 0
                            ? faker.helpers.arrayElements(topics, faker.number.int({min: 1, max: 3}))
                            : [],
                    owner: userFeed.owner,
                });
                await postRepo.save(post);

                const attachmentCount = faker.number.int({min: 0, max: 2});
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

                const reactionCount = faker.number.int({min: 1, max: 5});
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
        }

        // Create posts for admin users
        if (adminUserRef && adminNewsFeed) {
            logger.log('Creating posts for first admin user...');

            const adminPostCount = faker.number.int({min: 10, max: 15});
            logger.log(`Creating ${adminPostCount} posts for admin user`);

            for (let i = 0; i < adminPostCount; i++) {
                // Admin posts on topics like platform updates, community guidelines, etc.
                const adminTopics = [
                    'platform update',
                    'community guidelines',
                    'feature announcement',
                    'user experience',
                    'digital wellness',
                    'online safety',
                    'platform innovation',
                    'community engagement',
                ];

                const randomTopic = faker.helpers.arrayElement(adminTopics);

                const postContent = await generateMeaningfulPostContent(logger, {
                    topic: randomTopic,
                    mood: faker.helpers.arrayElement(['professional', 'informative', 'supportive']),
                    user: {
                        firstName: adminUserRef.firstName,
                        lastName: adminUserRef.lastName,
                        interests: ['community management', 'platform development', 'user engagement'],
                    },
                });

                const post = postRepo.create({
                    content: postContent,
                    newsFeed: adminNewsFeed,
                    topics:
                        topics.length > 0
                            ? faker.helpers.arrayElements(topics, faker.number.int({min: 1, max: 3}))
                            : [],
                    owner: adminNewsFeed.owner,
                });

                await postRepo.save(post);

                // Admin posts typically have attachments
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

                // Create comments for the admin's post (10-20 comments)
                const commentCount = faker.number.int({min: 10, max: 20});
                for (let k = 0; k < commentCount; k++) {
                    const commentUser = faker.helpers.arrayElement(userRefs);
                    const comment = commentRepo.create({
                        text: faker.lorem.sentence(),
                        attachment_url: faker.datatype.boolean({probability: 0.2})
                            ? faker.helpers.arrayElement(imageLinks)
                            : undefined,
                        user: commentUser,
                        post,
                    });
                    await commentRepo.save(comment);
                }

                // Create reactions for the admin's post (50-100 reactions)
                const reactionCount = faker.number.int({min: 50, max: 100});
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
        }

        // Create posts for second admin user
        if (admin2UserRef && admin2NewsFeed) {
            logger.log('Creating posts for second admin user...');

            const admin2PostCount = faker.number.int({min: 8, max: 12});
            logger.log(`Creating ${admin2PostCount} posts for second admin user`);

            for (let i = 0; i < admin2PostCount; i++) {
                // Admin2 posts on topics like community events, user highlights, etc.
                const admin2Topics = [
                    'community highlight',
                    'user success stories',
                    'best practices',
                    'platform tips',
                    'upcoming events',
                    'feature showcase',
                    'user appreciation',
                    'content guidelines',
                ];

                const randomTopic = faker.helpers.arrayElement(admin2Topics);

                const postContent = await generateMeaningfulPostContent(logger, {
                    topic: randomTopic,
                    mood: faker.helpers.arrayElement(['friendly', 'encouraging', 'celebratory']),
                    user: {
                        firstName: admin2UserRef.firstName,
                        lastName: admin2UserRef.lastName,
                        interests: ['community building', 'user success', 'content moderation'],
                    },
                });

                const post = postRepo.create({
                    content: postContent,
                    newsFeed: admin2NewsFeed,
                    topics:
                        topics.length > 0
                            ? faker.helpers.arrayElements(topics, faker.number.int({min: 1, max: 3}))
                            : [],
                    owner: admin2NewsFeed.owner,
                });

                await postRepo.save(post);

                // Admin2 posts might have attachments
                const attachmentCount = faker.number.int({min: 0, max: 2});
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

                // Create comments for the admin2's post (8-15 comments)
                const commentCount = faker.number.int({min: 8, max: 15});
                for (let k = 0; k < commentCount; k++) {
                    const commentUser = faker.helpers.arrayElement(userRefs);
                    const comment = commentRepo.create({
                        text: faker.lorem.sentence(),
                        attachment_url: faker.datatype.boolean({probability: 0.2})
                            ? faker.helpers.arrayElement(imageLinks)
                            : undefined,
                        user: commentUser,
                        post,
                    });
                    await commentRepo.save(comment);
                }

                // Create reactions for the admin2's post (40-80 reactions)
                const reactionCount = faker.number.int({min: 40, max: 80});
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
        }

        // Create stories for first admin user
        if (adminUserRef && adminNewsFeed) {
            logger.log('Creating stories for first admin user...');

            const storyCount = faker.number.int({min: 3, max: 5});
            logger.log(`Creating ${storyCount} stories for first admin user`);

            for (let i = 0; i < storyCount; i++) {
                const attachmentType = faker.helpers.arrayElement(Object.values(AttachmentType));
                const imageUrl = faker.helpers.arrayElement(imageLinks);
                const story = storyRepo.create({
                    story_url:
                        attachmentType === AttachmentType.VIDEO ? faker.helpers.arrayElement(videoLinks) : imageUrl,
                    thumbnail_url: imageUrl,
                    duration: faker.number.int({min: 5, max: 30}),
                    attachmentType,
                    newsFeed: adminNewsFeed,
                });
                await storyRepo.save(story);

                // Admin stories get more reactions and comments
                const storyCommentCount = faker.number.int({min: 10, max: 25});
                for (let c = 0; c < storyCommentCount; c++) {
                    const randomUser = faker.helpers.arrayElement(userRefs);
                    const comment = commentRepo.create({
                        text: faker.lorem.sentence(),
                        attachment_url: faker.datatype.boolean({probability: 0.25})
                            ? faker.helpers.arrayElement(imageLinks)
                            : undefined,
                        user: randomUser,
                        story: story,
                    });
                    await commentRepo.save(comment);
                }

                const storyReactionCount = faker.number.int({min: 50, max: 100});
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

        // Create stories for second admin user
        if (admin2UserRef && admin2NewsFeed) {
            logger.log('Creating stories for second admin user...');

            const storyCount = faker.number.int({min: 2, max: 4});
            logger.log(`Creating ${storyCount} stories for second admin user`);

            for (let i = 0; i < storyCount; i++) {
                const attachmentType = faker.helpers.arrayElement(Object.values(AttachmentType));
                const imageUrl = faker.helpers.arrayElement(imageLinks);
                const story = storyRepo.create({
                    story_url:
                        attachmentType === AttachmentType.VIDEO ? faker.helpers.arrayElement(videoLinks) : imageUrl,
                    thumbnail_url: imageUrl,
                    duration: faker.number.int({min: 5, max: 30}),
                    attachmentType,
                    newsFeed: admin2NewsFeed,
                });
                await storyRepo.save(story);

                // Admin stories get good engagement
                const storyCommentCount = faker.number.int({min: 8, max: 20});
                for (let c = 0; c < storyCommentCount; c++) {
                    const randomUser = faker.helpers.arrayElement(userRefs);
                    const comment = commentRepo.create({
                        text: faker.lorem.sentence(),
                        attachment_url: faker.datatype.boolean({probability: 0.2})
                            ? faker.helpers.arrayElement(imageLinks)
                            : undefined,
                        user: randomUser,
                        story: story,
                    });
                    await commentRepo.save(comment);
                }

                const storyReactionCount = faker.number.int({min: 40, max: 90});
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
