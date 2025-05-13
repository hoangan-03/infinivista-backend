import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import axios from 'axios';
import {In, Repository} from 'typeorm';

import {UserReference} from '@/entities/external/user-reference.entity';
import {Comment} from '@/entities/local/comment.entity';
import {Group} from '@/entities/local/group.entity';
import {GroupApplicant} from '@/entities/local/group-applicant.entity';
import {GroupRule} from '@/entities/local/group-rule.entity';
import {LiveStreamHistory} from '@/entities/local/live-stream-history.entity';
import {NewsFeed} from '@/entities/local/newsfeed.entity';
import {Page} from '@/entities/local/page.entity';
import {Post} from '@/entities/local/post.entity';
import {PostAttachment} from '@/entities/local/post-attachment';
import {Reel} from '@/entities/local/reel.entity';
import {Story} from '@/entities/local/story.entity';
import {Topic} from '@/entities/local/topic.entity';
import {UserReactPost} from '@/entities/local/user-react-post.entity';
import {UserReactStory} from '@/entities/local/user-react-story.entity';
import {UserSharePost} from '@/entities/local/user-share-post.entity';
import {PaginationResponseInterface} from '@/interfaces/pagination-response.interface';
import {ReactionType} from '@/modules/feed/enum/reaction-type.enum';

import {UserReferenceService} from '../user-reference/user-reference.service';
import {CreateGroupDto} from './dto/create-group.dto';
import {CreatePageDto} from './dto/create-page.dto';
import {CreatePostDto} from './dto/create-post.dto';
import {CreateStoryDto} from './dto/create-story.dto';
import {UpdateGroupDto} from './dto/update-group.dto';
import {UpdatePageDto} from './dto/update-page.dto';
import {AttachmentType} from './enum/attachment-type.enum';
import {groupVisibility} from './enum/group-visibility.enum';
import {visibilityEnum} from './enum/visibility.enum';

@Injectable()
export class FeedService {
    private readonly logger = new Logger(FeedService.name);
    constructor(
        private readonly userReferenceService: UserReferenceService,
        @InjectRepository(NewsFeed)
        private readonly newsFeedRepository: Repository<NewsFeed>,
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
        @InjectRepository(PostAttachment)
        private readonly postAttachmentRepository: Repository<PostAttachment>,
        @InjectRepository(Story)
        private readonly storyRepository: Repository<Story>,
        @InjectRepository(LiveStreamHistory)
        private readonly liveStreamRepository: Repository<LiveStreamHistory>,
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
        @InjectRepository(UserReactPost)
        private readonly userReactPostRepository: Repository<UserReactPost>,
        @InjectRepository(UserReactStory)
        private readonly userReactStoryRepository: Repository<UserReactStory>,
        @InjectRepository(UserReference)
        private readonly userReferenceRepository: Repository<UserReference>,
        @InjectRepository(Topic)
        private readonly topicRepository: Repository<Topic>,
        @InjectRepository(Reel)
        private readonly reelRepository: Repository<Reel>,
        @InjectRepository(Page)
        private readonly pageRepository: Repository<Page>,
        @InjectRepository(Group)
        private readonly groupRepository: Repository<Group>,
        @InjectRepository(GroupRule)
        private readonly groupRuleRepository: Repository<GroupRule>,
        @InjectRepository(UserSharePost)
        private readonly userSharePostRepository: Repository<UserSharePost>,
        @InjectRepository(GroupApplicant)
        private readonly groupApplicantRepository: Repository<GroupApplicant>
    ) {}

    /**
     * Ensures a user has a news feed, creating one if it doesn't exist
     * @param userId The user ID to check
     * @returns The user's news feed (either existing or newly created)
     */
    private async ensureUserHasNewsFeed(userId: string): Promise<NewsFeed> {
        // Directly query the repository instead of calling getNewsFeedByUserId
        const existingFeed = await this.newsFeedRepository.findOne({
            where: {owner: {id: userId}},
            relations: ['posts', 'stories', 'liveStreams', 'reel', 'owner'],
        });

        // If feed exists, return it
        if (existingFeed) {
            return existingFeed;
        }

        // No feed found - create a new one
        this.logger.log(`User ${userId} doesn't have a newsfeed yet. Creating one automatically.`);
        const userRef = await this.userReferenceService.findById(userId);

        if (!userRef) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        const newsFeed = this.newsFeedRepository.create({
            description: `${userRef.firstName || userRef.username}'s feed`,
            visibility: visibilityEnum.PUBLIC,
            owner: userRef,
        });

        return this.newsFeedRepository.save(newsFeed);
    }

    async createNewsFeed(userId: string, data: Partial<NewsFeed>): Promise<NewsFeed> {
        const userRef = await this.userReferenceService.findById(userId);

        try {
            // Attempt to get existing feed, this will throw if not found
            await this.getNewsFeedByUserId(userId);
            throw new BadRequestException('User already has a news feed');
        } catch (error) {
            // Only proceed if the error is that the newsfeed wasn't found
            if (error instanceof NotFoundException) {
                const newsFeed = this.newsFeedRepository.create({
                    ...data,
                    owner: userRef,
                });

                return this.newsFeedRepository.save(newsFeed);
            }
            throw error; // Re-throw if it's a different error
        }
    }

    async getAllNewsFeeds(): Promise<NewsFeed[]> {
        return this.newsFeedRepository.find({
            relations: ['owner'],
        });
    }

    async getPostsByNewsFeedId(newsFeedId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<any>> {
        const userFeed = await this.getNewsFeedById(newsFeedId);
        const userOwner = await this.userReferenceService.findById(userFeed.owner.id);
        const [userPosts, total] = await this.postRepository.findAndCount({
            where: {newsFeed: {id: userFeed.id}},
            relations: ['topics', 'postAttachments', 'newsFeed.owner', 'comments'],
            skip: (page - 1) * limit,
            take: limit,
            order: {createdAt: 'DESC'},
        });

        // Map posts to include only topic name and description
        const postsWithShareCounts = await Promise.all(
            userPosts.map(async (post) => {
                const shareCount = await this.getShareCount(post.id);
                return {
                    ...post,
                    userOwner: userOwner,
                    share_count: shareCount,
                    topics: post.topics.map((topic) => ({
                        name: topic.topicName,
                        description: topic.topicDescription,
                    })),
                };
            })
        );

        return {
            data: postsWithShareCounts,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getPopularPostNewsFeed(userId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<any>> {
        // Ensure the user has a newsfeed before proceeding
        const userFeed = await this.ensureUserHasNewsFeed(userId);
        const userOwner = await this.userReferenceService.findById(userId);

        // Get posts with their reactions and comments
        const [posts, total] = await this.postRepository.findAndCount({
            where: {newsFeed: {id: userFeed.id}},
            relations: ['topics', 'postAttachments', 'comments', 'newsFeed.owner'],
            order: {createdAt: 'DESC'},
        });

        // Get all reactions for these posts
        const postIds = posts.map((post) => post.id);
        const reactions = await this.userReactPostRepository.find({
            where: {post_id: In(postIds)},
        });

        // Group reactions by post ID
        const reactionsByPostId = reactions.reduce(
            (acc, reaction) => {
                acc[reaction.post_id] = (acc[reaction.post_id] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );

        // Calculate popularity score for each post (with weights)
        const REACTION_WEIGHT = 1;
        const COMMENT_WEIGHT = 2;

        const postsWithScores = await Promise.all(
            posts.map(async (post) => {
                const reactionCount = reactionsByPostId[post.id] || 0;
                const commentCount = post.comments?.length || 0;
                const popularityScore = reactionCount * REACTION_WEIGHT + commentCount * COMMENT_WEIGHT;
                const shareCount = await this.getShareCount(post.id);

                return {
                    post: {
                        ...post,
                        share_count: shareCount,
                    },
                    popularityScore,
                };
            })
        );

        // Sort by popularity score (highest first)
        postsWithScores.sort((a, b) => b.popularityScore - a.popularityScore);

        // Apply pagination manually after sorting
        const startIndex = (page - 1) * limit;
        const endIndex = Math.min(startIndex + limit, postsWithScores.length);
        const paginatedPosts = postsWithScores.slice(startIndex, endIndex).map((item) => item.post);

        // Map posts to include only topic name and description
        const mappedPosts = paginatedPosts.map((post) => ({
            ...post,
            userOwner: userOwner,
            topics: post.topics.map((topic) => ({
                name: topic.topicName,
                description: topic.topicDescription,
            })),
            // Include popularity metrics
            popularity: {
                reactionCount: reactionsByPostId[post.id] || 0,
                commentCount: post.comments?.length || 0,
            },
        }));

        return {
            data: mappedPosts,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getFriendsPostNewsFeed(userId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<any>> {
        // Ensure the user has a newsfeed before proceeding
        await this.ensureUserHasNewsFeed(userId);
        const userOwner = await this.userReferenceService.findById(userId);

        const friendIds = await this.userReferenceService.getFriends(userId || '');
        const friendPosts = await this.postRepository.find({
            where: {newsFeed: {owner: {id: In(friendIds.map((friend) => friend.id))}}},
            relations: ['topics', 'postAttachments', 'comments', 'newsFeed.owner'],
            // Removed the ordering to apply random sorting after fetching
        });

        // Randomly shuffle the posts
        for (let i = friendPosts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [friendPosts[i], friendPosts[j]] = [friendPosts[j], friendPosts[i]];
        }

        // Apply pagination after random sorting
        const startIndex = (page - 1) * limit;
        const endIndex = Math.min(startIndex + limit, friendPosts.length);
        const paginatedPosts = friendPosts.slice(startIndex, endIndex);

        // Map posts to include only topic name and description
        const mappedPosts = await Promise.all(
            paginatedPosts.map(async (post) => {
                const shareCount = await this.getShareCount(post.id);
                return {
                    ...post,
                    userOwner: userOwner,
                    share_count: shareCount,
                    topics: post.topics.map((topic) => ({
                        name: topic.topicName,
                        description: topic.topicDescription,
                    })),
                };
            })
        );

        return {
            data: mappedPosts,
            metadata: {
                total: friendPosts.length,
                page,
                limit,
                totalPages: Math.ceil(friendPosts.length / limit),
            },
        };
    }

    async getRandomNewsFeed(userId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<Post>> {
        // Ensure the user has a newsfeed before proceeding
        await this.ensureUserHasNewsFeed(userId);
        const userOwner = await this.userReferenceService.findById(userId);

        // Get all public posts with their topics
        const publicPosts = await this.postRepository.find({
            where: {newsFeed: {visibility: visibilityEnum.PUBLIC || visibilityEnum.FRIENDS_ONLY}},
            relations: ['topics', 'postAttachments', 'comments', 'newsFeed.owner'],
        });

        // Filter out posts that belong to the current user
        const filteredPublicPosts = publicPosts.filter((post) => post.newsFeed?.owner?.id !== userId);

        const postWithFriendVisibility = await this.postRepository.find({
            where: {newsFeed: {visibility: visibilityEnum.FRIENDS_ONLY}},
            relations: ['topics', 'postAttachments', 'comments', 'newsFeed.owner'],
        });

        // CHECK OWNER ID OF THESE POST AND CHECK FRIENDSHIP WITH the owner
        const friendIds = await this.userReferenceService.getFriends(userId || '');
        const friendPost = postWithFriendVisibility.filter((post) => {
            // Add null checks to prevent accessing properties of null
            if (!post.newsFeed?.owner) return false;
            const ownerId = post.newsFeed.owner.id;
            // Exclude user's own posts and only include friends' posts
            return ownerId !== userId && friendIds.some((friend) => friend?.id === ownerId);
        });

        try {
            // Get user topic preferences based on reactions
            const preferredTopics = await this.getUserTopicPreferences(userId);

            // Combine filtered public posts and friend posts
            const combinedPosts = [...filteredPublicPosts, ...friendPost];

            // Get share counts for all posts
            const postsWithShareCounts = await Promise.all(
                combinedPosts.map(async (post) => {
                    const shareCount = await this.getShareCount(post.id);
                    return {
                        ...post,
                        share_count: shareCount,
                    };
                })
            );

            if (preferredTopics.length === 0) {
                // No preferences found, return random posts
                for (let i = postsWithShareCounts.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [postsWithShareCounts[i], postsWithShareCounts[j]] = [
                        postsWithShareCounts[j],
                        postsWithShareCounts[i],
                    ];
                }

                const startIndex = (page - 1) * limit;
                const endIndex = Math.min(page * limit, postsWithShareCounts.length);
                const paginatedPosts = postsWithShareCounts.slice(startIndex, endIndex);

                // Add userOwner to each post
                const mappedPosts = paginatedPosts.map((post) => ({
                    ...post,
                    userOwner: userOwner,
                    share_count: post.share_count,
                }));

                return {
                    data: mappedPosts,
                    metadata: {
                        total: combinedPosts.length,
                        page,
                        limit,
                        totalPages: Math.ceil(combinedPosts.length / limit),
                    },
                };
            }

            // Calculate relevance score for each post and sort by relevance
            const postsWithScores = postsWithShareCounts.map((post) => {
                const score = this.calculatePostRelevance(post, preferredTopics);
                return {post, score};
            });

            // Sort by score (highest first)
            postsWithScores.sort((a, b) => b.score - a.score);

            // Extract just the posts
            const sortedPosts = postsWithScores.map((item) => item.post);

            const startIndex = (page - 1) * limit;
            const endIndex = Math.min(page * limit, sortedPosts.length);
            const paginatedPosts = sortedPosts.slice(startIndex, endIndex);

            // Add userOwner to each post
            const mappedPosts = paginatedPosts.map((post) => ({
                ...post,
                userOwner: userOwner,
                share_count: post.share_count,
            }));

            return {
                data: mappedPosts,
                metadata: {
                    total: sortedPosts.length,
                    page,
                    limit,
                    totalPages: Math.ceil(sortedPosts.length / limit),
                },
            };
        } catch (error: any) {
            this.logger.error(`Error getting personalized feed: ${error.message}`);

            // Fallback to random combined posts (still excluding user's own posts)
            const combinedPosts = [...filteredPublicPosts, ...friendPost];

            // Get share counts for all posts
            const postsWithShareCounts = await Promise.all(
                combinedPosts.map(async (post) => {
                    const shareCount = await this.getShareCount(post.id);
                    return {
                        ...post,
                        share_count: shareCount,
                    };
                })
            );

            for (let i = postsWithShareCounts.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [postsWithShareCounts[i], postsWithShareCounts[j]] = [postsWithShareCounts[j], postsWithShareCounts[i]];
            }

            // Add userOwner to each post
            const mappedPosts = postsWithShareCounts.slice(0, limit).map((post) => ({
                ...post,
                userOwner: userOwner,
                share_count: post.share_count,
            }));

            return {
                data: mappedPosts,
                metadata: {
                    total: combinedPosts.length,
                    page,
                    limit,
                    totalPages: Math.ceil(combinedPosts.length / limit),
                },
            };
        }
    }

    /**
     * Gets the user's topic preferences based on their post reactions
     * @param userId The ID of the user
     * @returns Array of topic IDs with their preference weights
     */
    private async getUserTopicPreferences(userId: string): Promise<{id: string; weight: number}[]> {
        // Get posts that the user has reacted to
        const userReactions = await this.userReactPostRepository.find({
            where: {user_id: userId},
        });

        if (!userReactions || userReactions.length === 0) {
            return [];
        }

        // Extract post IDs
        const postIds = userReactions.map((reaction) => reaction.post_id);

        // Get the posts with their topics
        const posts = await this.postRepository.find({
            where: {id: In(postIds)},
            relations: ['topics'],
        });

        // Count topic occurrences
        const topicCounts = new Map<string, number>();

        posts.forEach((post) => {
            if (post.topics && post.topics.length > 0) {
                post.topics.forEach((topic) => {
                    const count = topicCounts.get(topic.id) || 0;
                    topicCounts.set(topic.id, count + 1);
                });
            }
        });

        // Convert to array and sort by count
        const sortedTopics = Array.from(topicCounts.entries())
            .map(([id, count]) => ({id, weight: count}))
            .sort((a, b) => b.weight - a.weight);

        return sortedTopics;
    }

    /**
     * Calculates how relevant a post is to user's preferences
     * @param post The post to evaluate
     * @param preferredTopics The user's preferred topics with weights
     * @returns A numerical score representing relevance
     */
    private calculatePostRelevance(post: Post, preferredTopics: {id: string; weight: number}[]): number {
        if (!post.topics || post.topics.length === 0) {
            return 0;
        }

        let score = 0;

        // Check each topic in the post
        post.topics.forEach((topic) => {
            // Find if this topic is in the user's preferences
            const preference = preferredTopics.find((pt) => pt.id === topic.id);
            if (preference) {
                // Add the preference weight to the score
                score += preference.weight;
            }
        });

        return score;
    }

    async getNewsFeedByUserId(userId: string): Promise<NewsFeed> {
        // Don't call ensureUserHasNewsFeed here to avoid recursion

        const newsFeed = await this.newsFeedRepository.findOne({
            where: {owner: {id: userId}},
            relations: ['posts', 'stories', 'liveStreams', 'reel', 'owner'],
        });

        if (!newsFeed) {
            const userRef = await this.userReferenceService.findById(userId);

            if (!userRef) {
                throw new NotFoundException(`User with ID ${userId} not found`);
            }
            const createdNewsFeed = this.newsFeedRepository.create({
                description: `New feed`,
                visibility: visibilityEnum.PUBLIC,
                owner: userRef,
            });
            await this.newsFeedRepository.save(createdNewsFeed);
            return createdNewsFeed;
        } else return newsFeed;
    }

    async getNewsFeedById(newsFeedId: string): Promise<NewsFeed> {
        const newsFeed = await this.newsFeedRepository.findOne({
            where: {id: newsFeedId},
            relations: ['posts', 'stories', 'liveStreams', 'reel', 'owner'],
        });
        if (!newsFeed) {
            throw new NotFoundException(`News feed ${newsFeedId} not found`);
        }
        return newsFeed;
    }

    /**
     * Calls Gemini API to analyze post content and classify it into topics
     * @param content The post content to classify
     * @returns Array of topic IDs that match the content
     */
    private async classifyPostContent(content: string): Promise<string[]> {
        if (!content) return [];

        try {
            const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
            const GEMINI_API_URL = process.env.GEMINI_API_URL;

            if (!GEMINI_API_KEY) {
                this.logger.warn('GEMINI_API_KEY not set in environment variables');
                return [];
            }

            // Get all available topics to choose from
            const allTopics = await this.topicRepository.find();

            if (!allTopics || allTopics.length === 0) {
                this.logger.warn('No topics available for classification');
                return [];
            }

            // Format topics for the prompt
            const topicsForPrompt = allTopics
                .map((topic) => `${topic.id}: ${topic.topicName} - ${topic.topicDescription || 'No description'}`)
                .join('\n');

            // Create the Gemini API request
            const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                contents: [
                    {
                        parts: [
                            {
                                text: `I have a post with the following content:
                                    
"${content}"

Based on this content, classify it into at most 5 of the most relevant topics from this list:

${topicsForPrompt}

Return only the topic IDs as a JSON array with no explanations. For example:
["550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001"]`,
                            },
                        ],
                    },
                ],
            });

            // Extract and parse the response text to get topic IDs
            let responseText = response.data.candidates[0].content.parts[0].text.trim();

            // Handle Markdown formatted responses
            // If response contains code blocks (```json), extract just the JSON part
            if (responseText.includes('```')) {
                const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (codeBlockMatch && codeBlockMatch[1]) {
                    responseText = codeBlockMatch[1].trim();
                }
            }

            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                const topicIds = JSON.parse(responseText);
                return Array.isArray(topicIds) ? topicIds : [];
            } catch (jsonError: any) {
                this.logger.error(`Error parsing JSON response: ${jsonError.message}`);
                this.logger.debug(`Raw response received: ${responseText}`);
                return [];
            }
        } catch (error: any) {
            this.logger.error(`Error calling Gemini API: ${error.message}`);
            return [];
        }
    }

    async updatePost(postId: string, postData: Partial<Post>): Promise<Post> {
        const post = await this.getPostById(postId);
        if (!post) {
            throw new NotFoundException(`Post with ID ${postId} not found`);
        }
        const newsFeed = await this.newsFeedRepository.findOne({
            where: {posts: {id: postId}},
        });
        if (!newsFeed) {
            throw new NotFoundException(`News feed for post ${postId} not found`);
        }
        if (newsFeed.owner.id !== post.newsFeed.owner.id) {
            throw new ForbiddenException(`User is not the owner of the news feed`);
        }
        this.postRepository.merge(post, postData);
        return this.postRepository.save(post);
    }

    async deletePost(postId: string): Promise<Post> {
        const post = await this.getPostById(postId);
        if (!post) {
            throw new NotFoundException(`Post with ID ${postId} not found`);
        }
        const newsFeed = await this.newsFeedRepository.findOne({
            where: {posts: {id: postId}},
        });
        if (!newsFeed) {
            throw new NotFoundException(`News feed for post ${postId} not found`);
        }
        if (newsFeed.owner.id !== post.newsFeed.owner.id) {
            throw new ForbiddenException(`User is not the owner of the news feed`);
        }
        const result = await this.postRepository.delete(postId);

        if (result.affected === 0) {
            throw new NotFoundException(`Post with ID ${postId} not found`);
        }
        return post;
    }

    // Helper method to get share count for a post
    private async getShareCount(postId: string): Promise<number> {
        return this.userSharePostRepository.count({
            where: {post_id: postId},
        });
    }

    async getPostById(postId: string): Promise<Post> {
        const post = await this.postRepository.findOne({
            where: {id: postId},
            relations: ['newsFeed', 'newsFeed.owner', 'comments', 'comments.user', 'postAttachments'],
        });

        if (!post) {
            throw new NotFoundException(`Post with ID ${postId} not found`);
        }
        const userOwner = await this.userReferenceService.findById(post.newsFeed.owner.id);
        const shareCount = await this.getShareCount(postId);

        // Add userOwner property and share count
        const enhancedPost = {
            ...post,
            userOwner: userOwner,
            share_count: shareCount,
        };

        return enhancedPost;
    }

    async getStoryById(storyId: string): Promise<Story> {
        const story = await this.storyRepository.findOne({
            where: {id: storyId},
            relations: ['newsFeed', 'newsFeed.owner'],
        });
        if (!story) {
            throw new NotFoundException(`Story with ID ${storyId} not found`);
        }
        return story;
    }

    async createStory(newsFeedId: string, storyData: CreateStoryDto): Promise<Story> {
        const newsFeed = await this.getNewsFeedById(newsFeedId);
        if (!newsFeed) {
            throw new NotFoundException(`News feed with ID ${newsFeedId} not found`);
        }

        const story = this.storyRepository.create({
            ...storyData,
            newsFeed,
        });

        return this.storyRepository.save(story);
    }

    async getStoriesByNewsFeedId(
        newsFeedId: string,
        page = 1,
        limit = 10
    ): Promise<PaginationResponseInterface<Story>> {
        const [stories, total] = await this.storyRepository.findAndCount({
            where: {newsFeed: {id: newsFeedId}},
            skip: (page - 1) * limit,
            take: limit,
            order: {createdAt: 'DESC'},
        });
        const userFeed = await this.getNewsFeedById(newsFeedId);

        const userOwner = await this.userReferenceService.findById(userFeed.owner.id);
        const mappedStories = stories.map((post) => ({
            ...post,
            userOwner: userOwner,
        }));
        return {
            data: mappedStories,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async createLiveStream(newsFeedId: string, streamData: Partial<LiveStreamHistory>): Promise<LiveStreamHistory> {
        const newsFeed = await this.getNewsFeedById(newsFeedId);

        const liveStream = this.liveStreamRepository.create({
            ...streamData,
            newsFeed,
        });

        return this.liveStreamRepository.save(liveStream);
    }

    async endLiveStream(streamId: string, endTime: Date): Promise<LiveStreamHistory> {
        const stream = await this.liveStreamRepository.findOne({where: {id: streamId}});

        if (!stream) {
            throw new NotFoundException(`Live stream with ID ${streamId} not found`);
        }

        stream.end_time = endTime;
        return this.liveStreamRepository.save(stream);
    }

    async getLiveStreamsByNewsFeedId(
        newsFeedId: string,
        page = 1,
        limit = 10
    ): Promise<PaginationResponseInterface<LiveStreamHistory>> {
        const [liveStreams, total] = await this.liveStreamRepository.findAndCount({
            where: {newsFeed: {id: newsFeedId}},
            skip: (page - 1) * limit,
            take: limit,
            order: {start_time: 'DESC'},
        });

        return {
            data: liveStreams,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ---------- COMMENT METHODS ----------

    async createComment(postId: string, userId: string, text: string, attachmentUrl?: string): Promise<Comment> {
        // Ensure the user has a newsfeed before proceeding
        await this.ensureUserHasNewsFeed(userId);

        const post = await this.getPostById(postId);
        const user = await this.userReferenceService.findById(userId);

        if (!post || !user) {
            throw new NotFoundException(`Post or user not found`);
        }

        const comment = this.commentRepository.create({
            text,
            attachment_url: attachmentUrl || '',
            user,
            post,
        });

        post.comments = [...(post.comments || []), comment];

        return this.commentRepository.save(comment);
    }

    async getCommentsByPostId(postId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<Comment>> {
        const post = await this.getPostById(postId);

        if (!post) {
            throw new NotFoundException(`Post with ID ${postId} not found`);
        }

        const [comments, total] = await this.commentRepository.findAndCount({
            where: {post: {id: postId}},
            relations: ['user'],
            skip: (page - 1) * limit,
            take: limit,
            order: {createdAt: 'DESC'},
        });

        // Map comments to include userOwner
        const mappedComments = comments.map((comment) => ({
            ...comment,
            userOwner: comment.user,
        }));

        return {
            data: mappedComments,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async updateComment(commentId: string, userId: string, text: string, attachmentUrl?: string): Promise<Comment> {
        const comment = await this.commentRepository.findOne({
            where: {id: commentId},
            relations: ['user', 'post'],
        });

        if (!comment) {
            throw new NotFoundException(`Comment with ID ${commentId} not found`);
        }

        if (comment.user.id !== userId) {
            throw new ForbiddenException(`User is not authorized to update this comment`);
        }

        comment.text = text;
        comment.attachment_url = attachmentUrl || '';

        return this.commentRepository.save(comment);
    }

    async deleteComment(commentId: string, userId: string): Promise<Comment> {
        const comment = await this.commentRepository.findOne({
            where: {id: commentId},
            relations: ['user', 'post', 'post.newsFeed'],
        });

        if (!comment) {
            throw new NotFoundException(`Comment with ID ${commentId} not found`);
        }

        if (comment.user.id !== userId) {
            throw new ForbiddenException(`User is not authorized to delete this comment`);
        }

        const deletedComment = {...comment};
        await this.commentRepository.remove(comment);
        return deletedComment;
    }

    // ---------- STORY COMMENT METHODS ----------

    async createStoryComment(storyId: string, userId: string, text: string, attachmentUrl?: string): Promise<Comment> {
        // Ensure the user has a newsfeed before proceeding
        await this.ensureUserHasNewsFeed(userId);

        const story = await this.getStoryById(storyId);
        const user = await this.userReferenceService.findById(userId);

        if (!story || !user) {
            throw new NotFoundException(`Story or user not found`);
        }

        const comment = this.commentRepository.create({
            text,
            attachment_url: attachmentUrl || '',
            user,
            story,
        });

        story.comments = [...(story.comments || []), comment];

        return this.commentRepository.save(comment);
    }

    async getCommentsByStoryId(storyId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<Comment>> {
        const story = await this.getStoryById(storyId);

        if (!story) {
            throw new NotFoundException(`Story with ID ${storyId} not found`);
        }

        const [comments, total] = await this.commentRepository.findAndCount({
            where: {story: {id: storyId}},
            relations: ['user'],
            skip: (page - 1) * limit,
            take: limit,
            order: {createdAt: 'DESC'},
        });

        // Map comments to include userOwner
        const mappedComments = comments.map((comment) => ({
            ...comment,
            userOwner: comment.user,
        }));

        return {
            data: mappedComments,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async updateStoryComment(
        commentId: string,
        userId: string,
        text: string,
        attachmentUrl?: string
    ): Promise<Comment> {
        const comment = await this.commentRepository.findOne({
            where: {id: commentId},
            relations: ['user', 'story'],
        });

        if (!comment) {
            throw new NotFoundException(`Comment with ID ${commentId} not found`);
        }

        if (comment.user.id !== userId) {
            throw new ForbiddenException(`User is not authorized to update this comment`);
        }

        comment.text = text;
        comment.attachment_url = attachmentUrl || '';

        return this.commentRepository.save(comment);
    }

    async deleteStoryComment(commentId: string, userId: string): Promise<Comment> {
        const comment = await this.commentRepository.findOne({
            where: {id: commentId},
            relations: ['user', 'story', 'story.newsFeed', 'story.newsFeed.owner'],
        });

        if (!comment) {
            throw new NotFoundException(`Comment with ID ${commentId} not found`);
        }

        if (comment.user.id !== userId && comment.story.newsFeed.owner.id !== userId) {
            throw new ForbiddenException(`User is not authorized to delete this comment`);
        }

        const deletedComment = {...comment};
        await this.commentRepository.remove(comment);
        return deletedComment;
    }

    // ---------- REACTION METHODS ----------

    async addReaction(userId: string, postId: string, reactionType: ReactionType): Promise<UserReactPost> {
        // Ensure the user has a newsfeed before proceeding
        await this.ensureUserHasNewsFeed(userId);

        const existingReaction = await this.userReactPostRepository.findOne({
            where: {
                post_id: postId,
                user_id: userId,
            },
        });

        if (existingReaction) {
            if (existingReaction.reactionType && existingReaction.reactionType !== reactionType) {
                existingReaction.reactionType = reactionType;
                return this.userReactPostRepository.save(existingReaction);
            }
            return existingReaction;
        }

        return await this.userReactPostRepository.save({
            user_id: userId,
            post_id: postId,
            reactionType: reactionType,
        });
    }

    async getReactionsByPostId(postId: string): Promise<UserReactPost[]> {
        const post = await this.getPostById(postId);

        if (!post) {
            throw new NotFoundException(`Post with ID ${postId} not found`);
        }

        const reactions = await this.userReactPostRepository.find({
            where: {post_id: postId},
            relations: ['user'],
        });

        // Map reactions to include userOwner with null check
        return reactions
            .map((reaction) => {
                // Safely handle potentially null user references
                const userOwner = reaction.user || null;

                return {
                    ...reaction,
                    userOwner,
                };
            })
            .filter((reaction) => reaction); // Filter out any null reactions
    }

    async removeReaction(postId: string, userId: string): Promise<{success: boolean}> {
        const reaction = await this.userReactPostRepository.findOne({
            where: {
                post_id: postId,
                user_id: userId,
            },
        });

        if (!reaction) {
            throw new NotFoundException(`Reaction not found`);
        }

        await this.userReactPostRepository.remove(reaction);
        return {success: true};
    }

    async getReactionCountByType(postId: string): Promise<Record<ReactionType, number>> {
        const post = await this.getPostById(postId);

        if (!post) {
            throw new NotFoundException(`Post with ID ${postId} not found`);
        }

        const reactions = await this.userReactPostRepository.find({
            where: {post: {id: postId}},
        });

        const counts: Record<ReactionType, number> = {
            [ReactionType.LIKE]: 0,
            [ReactionType.HEART]: 0,
            [ReactionType.CARE]: 0,
            [ReactionType.HAHA]: 0,
            [ReactionType.SAD]: 0,
            [ReactionType.WOW]: 0,
            [ReactionType.ANGRY]: 0,
        };

        reactions.forEach((reaction) => {
            counts[reaction.reactionType]++;
        });

        return counts;
    }

    // ---------- STORY REACTION METHODS ----------

    async addStoryReaction(userId: string, storyId: string, reactionType: ReactionType): Promise<UserReactStory> {
        // Ensure the user has a newsfeed before proceeding
        await this.ensureUserHasNewsFeed(userId);

        const story = await this.getStoryById(storyId);
        if (!story) {
            throw new NotFoundException(`Story with ID ${storyId} not found`);
        }

        const existingReaction = await this.userReactStoryRepository.findOne({
            where: {
                story_id: storyId,
                user_id: userId,
            },
        });

        if (existingReaction) {
            if (existingReaction.reactionType && existingReaction.reactionType !== reactionType) {
                existingReaction.reactionType = reactionType;
                return this.userReactStoryRepository.save(existingReaction);
            }
            return existingReaction;
        }

        return await this.userReactStoryRepository.save({
            user_id: userId,
            story_id: storyId,
            reactionType: reactionType,
        });
    }

    async getReactionsByStoryId(storyId: string): Promise<UserReactStory[]> {
        const story = await this.getStoryById(storyId);

        if (!story) {
            throw new NotFoundException(`Story with ID ${storyId} not found`);
        }

        const reactions = await this.userReactStoryRepository.find({
            where: {story_id: storyId},
            relations: ['user'],
        });

        // Map reactions to include userOwner
        return reactions.map((reaction) => ({
            ...reaction,
            userOwner: reaction.user,
        }));
    }

    async removeStoryReaction(storyId: string, userId: string): Promise<{success: boolean}> {
        const reaction = await this.userReactStoryRepository.findOne({
            where: {
                story_id: storyId,
                user_id: userId,
            },
        });

        if (!reaction) {
            throw new NotFoundException(`Reaction not found`);
        }

        await this.userReactStoryRepository.remove(reaction);
        return {success: true};
    }

    async getStoryReactionCountByType(storyId: string): Promise<Record<ReactionType, number>> {
        const story = await this.getStoryById(storyId);

        if (!story) {
            throw new NotFoundException(`Story with ID ${storyId} not found`);
        }

        const reactions = await this.userReactStoryRepository.find({
            where: {story: {id: storyId}},
        });

        const counts: Record<ReactionType, number> = {
            [ReactionType.LIKE]: 0,
            [ReactionType.HEART]: 0,
            [ReactionType.CARE]: 0,
            [ReactionType.HAHA]: 0,
            [ReactionType.SAD]: 0,
            [ReactionType.WOW]: 0,
            [ReactionType.ANGRY]: 0,
        };

        reactions.forEach((reaction) => {
            counts[reaction.reactionType]++;
        });

        return counts;
    }

    async getRandomReelsByUserId(userId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<Reel>> {
        // Ensure the user has a newsfeed before proceeding
        const userFeed = await this.ensureUserHasNewsFeed(userId);

        const [reels, total] = await this.reelRepository.findAndCount({
            where: {newsFeed: {id: userFeed.id}},
            skip: (page - 1) * limit,
            take: limit,
            order: {createdAt: 'DESC'},
        });

        // Map reels to include userOwner
        const mappedReels = reels.map((reel) => ({
            ...reel,
            userOwner: reel.newsFeed?.owner,
        }));

        return {
            data: mappedReels,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async createPostInPageAfterUploadingFiles(
        userId: string,
        newsFeedId: string,
        postData: CreatePostDto,
        files: Array<{url: string; fileName: string; mimeType: string}>,
        attachmentType: AttachmentType[]
    ): Promise<Post> {
        this.logger.log(`Creating post with ${files?.length || 0} attachments for news feed ${newsFeedId} of page`);
        const newsFeed = await this.getNewsFeedById(newsFeedId);

        const post = this.postRepository.create({
            content: postData.content,
            owner_id: userId,
            newsFeed: newsFeed,
        });

        try {
            // Call Gemini API to analyze content and classify topics
            const topicIds = await this.classifyPostContent(postData.content);

            // Find the corresponding topic entities
            if (topicIds && topicIds.length > 0) {
                const topics = await this.topicRepository.findBy({
                    id: In(topicIds),
                });

                // Associate topics with the post
                if (topics && topics.length > 0) {
                    post.topics = topics;
                    this.logger.log(`Post classified into ${topics.length} topics`);
                }
            }
        } catch (error: any) {
            this.logger.error(`Error classifying post content: ${error.message}`);
            // Continue with post creation even if classification fails
        }

        // Save the post first to get an ID
        const savedPost = await this.postRepository.save(post);

        // Now create and link attachments if they exist
        if (files && files.length > 0) {
            // Initialize post.postAttachments if not already
            if (!savedPost.postAttachments) {
                savedPost.postAttachments = [];
            }

            // Create attachment entities for each file
            files.forEach((file, index) => {
                const attachment = new PostAttachment();
                attachment.attachment_url = file.url;
                attachment.post = savedPost; // Link to the post
                attachment.attachmentType =
                    index < attachmentType.length ? attachmentType[index] : AttachmentType.IMAGE;

                this.postAttachmentRepository.save(attachment).then((savedAttachment) => {
                    savedPost.postAttachments.push(savedAttachment);
                });
            });

            // Wait for all attachments to be saved
            await Promise.all(
                files.map((file, index) => {
                    const attachment = new PostAttachment();
                    attachment.attachment_url = file.url;
                    attachment.post = savedPost;
                    attachment.attachmentType =
                        index < attachmentType.length ? attachmentType[index] : AttachmentType.IMAGE;

                    return this.postAttachmentRepository.save(attachment);
                })
            ).then((savedAttachments) => {
                savedPost.postAttachments = savedAttachments;
            });

            // Update the post with the attachments
            await this.postRepository.save(savedPost);
        }

        // Load the post with attachments to return
        const finalPost = await this.postRepository.findOne({
            where: {id: savedPost.id},
            relations: ['postAttachments', 'topics'],
        });

        if (!finalPost) {
            throw new NotFoundException(`Post with ID ${savedPost.id} not found after saving`);
        }

        return finalPost;
    }

    async createPostAfterUploadingFiles(
        newsFeedId: string,
        postData: CreatePostDto,
        files: Array<{url: string; fileName: string; mimeType: string}>,
        attachmentType: AttachmentType[]
    ): Promise<Post> {
        this.logger.log(`Creating post with ${files?.length || 0} attachments for news feed ${newsFeedId}`);
        const newsFeed = await this.getNewsFeedById(newsFeedId);

        // We need to know that post is user post or page post

        // Create the post first and associate it with the news feed
        const post = this.postRepository.create({
            content: postData.content,
            owner: newsFeed.owner,
            newsFeed: newsFeed, // This is critical - associate with newsFeed
        });

        try {
            // Call Gemini API to analyze content and classify topics
            const topicIds = await this.classifyPostContent(postData.content);

            // Find the corresponding topic entities
            if (topicIds && topicIds.length > 0) {
                const topics = await this.topicRepository.findBy({
                    id: In(topicIds),
                });

                // Associate topics with the post
                if (topics && topics.length > 0) {
                    post.topics = topics;
                    this.logger.log(`Post classified into ${topics.length} topics`);
                }
            }
        } catch (error: any) {
            this.logger.error(`Error classifying post content: ${error.message}`);
            // Continue with post creation even if classification fails
        }

        // Save the post first to get an ID
        const savedPost = await this.postRepository.save(post);

        // Now create and link attachments if they exist
        if (files && files.length > 0) {
            // Initialize post.postAttachments if not already
            if (!savedPost.postAttachments) {
                savedPost.postAttachments = [];
            }

            // Create attachment entities for each file
            files.forEach((file, index) => {
                const attachment = new PostAttachment();
                attachment.attachment_url = file.url;
                attachment.post = savedPost; // Link to the post
                attachment.attachmentType =
                    index < attachmentType.length ? attachmentType[index] : AttachmentType.IMAGE;

                this.postAttachmentRepository.save(attachment).then((savedAttachment) => {
                    savedPost.postAttachments.push(savedAttachment);
                });
            });

            // Wait for all attachments to be saved
            await Promise.all(
                files.map((file, index) => {
                    const attachment = new PostAttachment();
                    attachment.attachment_url = file.url;
                    attachment.post = savedPost;
                    attachment.attachmentType =
                        index < attachmentType.length ? attachmentType[index] : AttachmentType.IMAGE;

                    return this.postAttachmentRepository.save(attachment);
                })
            ).then((savedAttachments) => {
                savedPost.postAttachments = savedAttachments;
            });

            // Update the post with the attachments
            await this.postRepository.save(savedPost);
        }

        // Load the post with attachments to return
        const finalPost = await this.postRepository.findOne({
            where: {id: savedPost.id},
            relations: ['postAttachments', 'topics'],
        });

        if (!finalPost) {
            throw new NotFoundException(`Post with ID ${savedPost.id} not found after saving`);
        }

        return finalPost;
    }

    // Page management methods
    async getAllPages(page = 1, limit = 10): Promise<PaginationResponseInterface<Page>> {
        const [pages, total] = await this.pageRepository.findAndCount({
            relations: ['owner'],
            skip: (page - 1) * limit,
            take: limit,
            order: {
                createdAt: 'DESC',
            },
        });

        return {
            data: pages,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async createPage(ownerId: string, pageData: CreatePageDto): Promise<Page> {
        const owner = await this.userReferenceService.findById(ownerId);

        if (!owner) {
            throw new NotFoundException(`User with ID ${ownerId} not found`);
        }

        // Create the page with owner
        const page = this.pageRepository.create({
            ...pageData,
            owner,
        });

        const savedPage = await this.pageRepository.save(page);

        // Create a news feed for the page
        const newsFeed = this.newsFeedRepository.create({
            description: `${savedPage.name} Official Feed`,
            visibility: visibilityEnum.PUBLIC,
            pageOwner: savedPage,
        });

        const savedNewsFeed = await this.newsFeedRepository.save(newsFeed);

        // Update the page with the news feed ID
        savedPage.newsFeed = savedNewsFeed;
        await this.pageRepository.save(savedPage);

        return savedPage;
    }

    async getMyPages(userId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<Page>> {
        const user = await this.userReferenceService.findById(userId);

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        const [pages, total] = await this.pageRepository.findAndCount({
            where: {owner: {id: userId}},
            relations: ['owner'],
            skip: (page - 1) * limit,
            take: limit,
            order: {
                createdAt: 'DESC',
            },
        });

        return {
            data: pages,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getPageById(id: string): Promise<Page> {
        const page = await this.pageRepository.findOne({
            where: {id},
            relations: ['owner', 'newsFeed', 'followers'],
        });

        if (!page) {
            throw new NotFoundException(`Page with ID ${id} not found`);
        }

        return page;
    }

    async updatePage(userId: string, pageId: string, updateData: UpdatePageDto): Promise<Page> {
        const page = await this.getPageById(pageId);

        // Check if the user is the owner of the page
        if (page.owner_id !== userId) {
            throw new ForbiddenException('Only page owners can update pages');
        }

        // Update the page with the new data
        this.pageRepository.merge(page, updateData);

        return this.pageRepository.save(page);
    }

    async deletePage(userId: string, pageId: string): Promise<{success: boolean}> {
        const page = await this.getPageById(pageId);

        // Check if the user is the owner of the page
        if (page.owner_id !== userId) {
            throw new ForbiddenException('Only page owners can delete pages');
        }

        // Delete the page
        await this.pageRepository.remove(page);

        return {success: true};
    }

    async followPage(userId: string, pageId: string): Promise<{success: boolean}> {
        const page = await this.getPageById(pageId);
        const user = await this.userReferenceService.findById(userId);

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        // Check if user is already a follower
        const isFollower = page.followers?.some((follower) => follower.id === userId);

        if (isFollower) {
            return {success: true}; // Already following
        }

        // Initialize followers array if not present
        if (!page.followers) {
            page.followers = [];
        }

        // Add user to followers
        page.followers.push(user);

        await this.pageRepository.save(page);

        return {success: true};
    }

    async unfollowPage(userId: string, pageId: string): Promise<{success: boolean}> {
        const page = await this.getPageById(pageId);

        // Check if user is a follower
        if (!page.followers) {
            return {success: true}; // No followers, nothing to do
        }

        // Remove user from followers
        page.followers = page.followers.filter((follower) => follower.id !== userId);

        await this.pageRepository.save(page);

        return {success: true};
    }

    async getPageFollowers(pageId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<UserReference>> {
        const foundPage = await this.getPageById(pageId);

        if (!foundPage.newsFeed) {
            return {
                data: [],
                metadata: {
                    total: 0,
                    page,
                    limit,
                    totalPages: 0,
                },
            };
        }
        const [followers, total] = await this.userReferenceRepository.findAndCount({
            where: {followedPages: {id: foundPage.id}},
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            data: followers,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getPagePosts(pageId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<any>> {
        const foundPage = await this.getPageById(pageId);

        if (!foundPage.newsFeed) {
            return {
                data: [],
                metadata: {
                    total: 0,
                    page,
                    limit,
                    totalPages: 0,
                },
            };
        }

        // Query posts directly from the repository instead of relying on the loaded relationship
        const [posts, total] = await this.postRepository.findAndCount({
            where: {newsFeed: {id: foundPage.newsFeed.id}},
            relations: ['postAttachments', 'topics'],
            skip: (page - 1) * limit,
            take: limit,
            order: {createdAt: 'DESC'},
        });

        // Add page owner information to posts and get share counts
        const postsWithOwnerAndShareCounts = await Promise.all(
            posts.map(async (post) => {
                const shareCount = await this.getShareCount(post.id);
                return {
                    ...post,
                    userOwner: foundPage.owner,
                    topics: post.topics.map((topic) => ({
                        name: topic.topicName,
                        description: topic.topicDescription,
                    })),

                    share_count: shareCount,
                };
            })
        );

        return {
            data: postsWithOwnerAndShareCounts,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async updatePageProfileImage(userId: string, pageId: string, imageUrl: string): Promise<Page> {
        const page = await this.getPageById(pageId);

        // Check if the user is the owner of the page
        if (page.owner_id !== userId) {
            throw new ForbiddenException('Only page owners can update page profile images');
        }

        // Update profile image URL
        page.profileImageUrl = imageUrl;

        return this.pageRepository.save(page);
    }

    async updatePageCoverImage(userId: string, pageId: string, imageUrl: string): Promise<Page> {
        const page = await this.getPageById(pageId);

        // Check if the user is the owner of the page
        if (page.owner_id !== userId) {
            throw new ForbiddenException('Only page owners can update page cover images');
        }

        // Update cover image URL
        page.coverImageUrl = imageUrl;

        return this.pageRepository.save(page);
    }

    // Group management methods
    async getAllGroups(page = 1, limit = 10): Promise<PaginationResponseInterface<Group>> {
        const [groups, total] = await this.groupRepository.findAndCount({
            relations: ['owner', 'groupRules'],
            skip: (page - 1) * limit,
            take: limit,
            order: {
                createdAt: 'DESC',
            },
        });

        return {
            data: groups,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getMyGroups(userId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<Group>> {
        const user = await this.userReferenceService.findById(userId);

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        // Find groups where the user is either the owner or a member
        const [ownedGroups] = await this.groupRepository.findAndCount({
            where: {owner: {id: userId}},
            relations: ['owner', 'groupRules'],
            skip: (page - 1) * limit,
            take: limit,
            order: {
                createdAt: 'DESC',
            },
        });

        const memberGroups = await this.groupRepository
            .createQueryBuilder('group')
            .innerJoin('group.members', 'member', 'member.id = :userId', {userId})
            .leftJoinAndSelect('group.owner', 'owner')
            .leftJoinAndSelect('group.groupRules', 'groupRules')
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('group.createdAt', 'DESC')
            .getMany();

        // Combine and deduplicate
        const uniqueGroups = [...ownedGroups];
        for (const group of memberGroups) {
            if (!uniqueGroups.some((g) => g.id === group.id)) {
                uniqueGroups.push(group);
            }
        }

        // Sort by creation date
        uniqueGroups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Apply pagination manually
        const paginatedGroups = uniqueGroups.slice(0, limit);

        return {
            data: paginatedGroups,
            metadata: {
                total: uniqueGroups.length,
                page,
                limit,
                totalPages: Math.ceil(uniqueGroups.length / limit),
            },
        };
    }

    async createGroup(ownerId: string, groupData: CreateGroupDto): Promise<Group> {
        const owner = await this.userReferenceService.findById(ownerId);

        if (!owner) {
            throw new NotFoundException(`User with ID ${ownerId} not found`);
        }

        // Create the group with owner
        const group = this.groupRepository.create({
            ...groupData,
            owner,
        });

        // Save the group and properly cast it to a single Group object
        const savedGroup = (await this.groupRepository.save(group)) as unknown as Group;

        // Create a news feed for the group
        const newsFeed = this.newsFeedRepository.create({
            description: `${savedGroup.name} Group Feed`,
            visibility:
                savedGroup.visibility === groupVisibility.PUBLIC ? visibilityEnum.PUBLIC : visibilityEnum.PRIVATE,
            groupOwner: savedGroup,
        });

        const savedNewsFeed = await this.newsFeedRepository.save(newsFeed);

        // Update the group with the news feed ID
        savedGroup.newsFeed = savedNewsFeed;
        await this.groupRepository.save(savedGroup);

        // Add the owner as a member
        if (!savedGroup.members) {
            savedGroup.members = [];
        }
        savedGroup.members.push(owner);
        await this.groupRepository.save(savedGroup);

        return savedGroup;
    }

    async getGroupById(id: string): Promise<Group> {
        const group = await this.groupRepository.findOne({
            where: {id},
            relations: ['owner', 'newsFeed', 'members', 'groupRules'],
        });

        if (!group) {
            throw new NotFoundException(`Group with ID ${id} not found`);
        }

        return group;
    }

    async updateGroup(userId: string, groupId: string, updateData: UpdateGroupDto): Promise<Group> {
        const group = await this.getGroupById(groupId);

        // Check if the user is the owner of the group
        if (group.owner_id !== userId) {
            throw new ForbiddenException('Only group owners can update groups');
        }

        // Update the group with the new data
        this.groupRepository.merge(group, updateData);

        // Cast the result to Group
        return (await this.groupRepository.save(group)) as unknown as Group;
    }

    async deleteGroup(userId: string, groupId: string): Promise<{success: boolean}> {
        const group = await this.getGroupById(groupId);

        // Check if the user is the owner of the group
        if (group.owner_id !== userId) {
            throw new ForbiddenException('Only group owners can delete groups');
        }

        // Delete the group
        await this.groupRepository.remove(group);

        return {success: true};
    }

    async joinGroup(userId: string, groupId: string): Promise<{success: boolean}> {
        const user = await this.userReferenceService.findById(userId);
        const group = await this.groupRepository.findOne({
            where: {id: groupId},
            relations: ['members'],
        });

        if (!group) {
            throw new NotFoundException(`Group with ID ${groupId} not found`);
        }

        // Check if user is already a member
        const isMember = group.members.some((member) => member.id === userId);
        if (isMember) {
            return {success: true};
        }

        if (group.visibility === groupVisibility.PUBLIC) {
            group.members.push(user);
            await this.groupRepository.save(group);
            return {success: true};
        } else {
            return this.applyToGroup(userId, groupId);
        }
    }

    async applyToGroup(userId: string, groupId: string, message?: string): Promise<{success: boolean}> {
        const user = await this.userReferenceService.findById(userId);
        const group = await this.groupRepository.findOne({
            where: {id: groupId},
            relations: ['members'],
        });

        if (!group) {
            throw new NotFoundException(`Group with ID ${groupId} not found`);
        }

        // Check if user is already a member
        const isMember = group.members.some((member) => member.id === userId);
        if (isMember) {
            return {success: true};
        }

        // Check if user already has a pending application
        const existingApplication = await this.groupApplicantRepository.findOne({
            where: {
                user_id: userId,
                group_id: groupId,
            },
        });

        if (existingApplication) {
            return {success: true}; // Application already exists
        }

        // Create a new application
        const newApplication = this.groupApplicantRepository.create({
            user,
            group,
            user_id: userId,
            group_id: groupId,
            isVerified: false,
            message,
        });

        await this.groupApplicantRepository.save(newApplication);
        return {success: true};
    }

    async getGroupApplicants(
        groupId: string,
        page = 1,
        limit = 10
    ): Promise<PaginationResponseInterface<GroupApplicant>> {
        const group = await this.groupRepository.findOne({
            where: {id: groupId},
        });

        if (!group) {
            throw new NotFoundException(`Group with ID ${groupId} not found`);
        }

        const [applicants, total] = await this.groupApplicantRepository.findAndCount({
            where: {
                group_id: groupId,
                isVerified: false,
            },
            relations: ['user'],
            skip: (page - 1) * limit,
            take: limit,
            order: {createdAt: 'DESC'},
        });

        return {
            data: applicants,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async verifyGroupApplicant(userId: string, applicationId: string): Promise<{success: boolean}> {
        // Find the application
        const application = await this.groupApplicantRepository.findOne({
            where: {id: applicationId},
            relations: ['group', 'user'],
        });

        if (!application) {
            throw new NotFoundException(`Application with ID ${applicationId} not found`);
        }

        // Verify the user is the group owner
        const group = await this.groupRepository.findOne({
            where: {id: application.group_id},
            relations: ['owner', 'members'],
        });

        if (!group) {
            throw new NotFoundException(`Group not found`);
        }

        if (group.owner_id !== userId) {
            throw new UnauthorizedException('Only the group owner can verify applications');
        }

        // Update application to verified
        application.isVerified = true;
        await this.groupApplicantRepository.save(application);

        // Add the user to group members
        const applicantUser = await this.userReferenceService.findById(application.user_id);
        const isAlreadyMember = group.members.some((member) => member.id === applicantUser.id);

        if (!isAlreadyMember) {
            group.members.push(applicantUser);
            await this.groupRepository.save(group);
        }

        return {success: true};
    }

    async rejectGroupApplicant(userId: string, applicationId: string): Promise<{success: boolean}> {
        // Find the application
        const application = await this.groupApplicantRepository.findOne({
            where: {id: applicationId},
            relations: ['group'],
        });

        if (!application) {
            throw new NotFoundException(`Application with ID ${applicationId} not found`);
        }

        // Verify the user is the group owner
        const group = await this.groupRepository.findOne({
            where: {id: application.group_id},
            relations: ['owner'],
        });

        if (!group) {
            throw new NotFoundException(`Group not found`);
        }

        if (group.owner_id !== userId) {
            throw new UnauthorizedException('Only the group owner can reject applications');
        }

        // Delete the application
        await this.groupApplicantRepository.delete(applicationId);

        return {success: true};
    }

    async leaveGroup(userId: string, groupId: string): Promise<{success: boolean}> {
        const group = await this.getGroupById(groupId);

        // Check if user is the owner
        if (group.owner_id === userId) {
            throw new ForbiddenException(
                'Group owners cannot leave their own groups. Transfer ownership or delete the group.'
            );
        }

        // Check if user is a member
        if (!group.members) {
            return {success: true}; // No members, nothing to do
        }

        // Remove user from members
        group.members = group.members.filter((member) => member.id !== userId);

        await this.groupRepository.save(group);

        return {success: true};
    }

    async getGroupMembers(groupId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<UserReference>> {
        // Get the user IDs from the join table
        const memberIdsResult = await this.groupRepository.query(
            'SELECT "userReferencesId" FROM "group_members_user_references" WHERE "groupId" = $1',
            [groupId]
        );

        // If no members found, return empty result
        if (!memberIdsResult || memberIdsResult.length === 0) {
            return {
                data: [],
                metadata: {
                    total: 0,
                    page,
                    limit,
                    totalPages: 0,
                },
            };
        }

        // Extract the user IDs from the result
        const memberIds = memberIdsResult.map((row) => row.userReferencesId);
        const total: number = memberIds.length;

        // Calculate pagination
        const startIdx = (page - 1) * limit;
        const endIdx = Math.min(startIdx + limit, total);
        const paginatedMemberIds = memberIds.slice(startIdx, endIdx);

        // Query the user_references table to get full user information
        const members = await this.userReferenceRepository.find({
            where: {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                id: In(paginatedMemberIds),
            },
            order: {
                username: 'ASC',
            },
        });

        // Ensure members are returned in the same order as the IDs
        const sortedMembers = paginatedMemberIds
            .map((id) => members.find((member) => member.id === id))
            .filter(Boolean) as UserReference[];

        return {
            data: sortedMembers,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getGroupPosts(groupId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<any>> {
        const group = await this.getGroupById(groupId);

        if (!group.newsFeed) {
            return {
                data: [],
                metadata: {
                    total: 0,
                    page,
                    limit,
                    totalPages: 0,
                },
            };
        }

        // Query posts directly from the repository
        const [posts, total] = await this.postRepository.findAndCount({
            where: {newsFeed: {id: group.newsFeed.id}},
            relations: ['postAttachments', 'topics', 'owner'],
            skip: (page - 1) * limit,
            take: limit,
            order: {createdAt: 'DESC'},
        });

        // Add share counts to posts and include userOwner field
        const postsWithShareCounts = await Promise.all(
            posts.map(async (post) => {
                const shareCount = await this.getShareCount(post.id);
                return {
                    ...post,
                    userOwner: post.owner,
                    topics: post.topics.map((topic) => ({
                        name: topic.topicName,
                        description: topic.topicDescription,
                    })),
                    share_count: shareCount,
                };
            })
        );

        return {
            data: postsWithShareCounts,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async createGroupPost(
        userId: string,
        groupId: string,
        postData: CreatePostDto,
        files: Array<{url: string; fileName: string; mimeType: string}>,
        attachmentType: AttachmentType[]
    ): Promise<Post> {
        this.logger.log(`Creating post with ${files?.length || 0} attachments for group ${groupId}`);

        const group = await this.getGroupById(groupId);

        // Check if user is a member of the group
        const isMember = group.members?.some((member) => member.id === userId) || group.owner_id === userId;

        if (!isMember) {
            throw new ForbiddenException('Only group members can post in groups');
        }

        if (!group.newsFeed) {
            throw new NotFoundException('Group newsfeed not found');
        }

        const user = await this.userReferenceService.findById(userId);

        // Create post
        const post = this.postRepository.create({
            content: postData.content,
            owner: user,
            newsFeed: group.newsFeed,
        });

        try {
            // Call Gemini API to analyze content and classify topics
            const topicIds = await this.classifyPostContent(postData.content);

            // Find the corresponding topic entities
            if (topicIds && topicIds.length > 0) {
                const topics = await this.topicRepository.findBy({
                    id: In(topicIds),
                });

                // Associate topics with the post
                if (topics && topics.length > 0) {
                    post.topics = topics;
                    this.logger.log(`Post classified into ${topics.length} topics`);
                }
            }
        } catch (error: any) {
            this.logger.error(`Error classifying post content: ${error.message}`);
            // Continue with post creation even if classification fails
        }

        // Save the post first to get an ID and cast to Post
        const savedPost = (await this.postRepository.save(post)) as unknown as Post;

        // Now create and link attachments if they exist
        if (files && files.length > 0) {
            // Initialize post.postAttachments if not already
            if (!savedPost.postAttachments) {
                savedPost.postAttachments = [];
            }

            // Wait for all attachments to be saved
            await Promise.all(
                files.map((file, index) => {
                    const attachment = new PostAttachment();
                    attachment.attachment_url = file.url;
                    attachment.post = savedPost;
                    attachment.attachmentType =
                        index < attachmentType.length ? attachmentType[index] : AttachmentType.IMAGE;

                    return this.postAttachmentRepository.save(attachment);
                })
            ).then((savedAttachments) => {
                savedPost.postAttachments = savedAttachments;
            });

            // Update the post with the attachments
            await this.postRepository.save(savedPost);
        }

        // Load the post with attachments to return
        const finalPost = await this.postRepository.findOne({
            where: {id: savedPost.id},
            relations: ['postAttachments', 'topics', 'owner'],
        });

        if (!finalPost) {
            throw new NotFoundException(`Post with ID ${savedPost.id} not found after saving`);
        }

        return finalPost;
    }

    async updateGroupProfileImage(userId: string, groupId: string, imageUrl: string): Promise<Group> {
        const group = await this.getGroupById(groupId);

        // Check if the user is the owner of the group
        if (group.owner_id !== userId) {
            throw new ForbiddenException('Only group owners can update group profile images');
        }

        // Update profile image URL
        group.profileImageUrl = imageUrl;

        // Cast the result to Group
        return (await this.groupRepository.save(group)) as unknown as Group;
    }

    async updateGroupCoverImage(userId: string, groupId: string, imageUrl: string): Promise<Group> {
        const group = await this.getGroupById(groupId);

        // Check if the user is the owner of the group
        if (group.owner_id !== userId) {
            throw new ForbiddenException('Only group owners can update group cover images');
        }

        // Update cover image URL
        group.coverImageUrl = imageUrl;

        // Cast the result to Group
        return (await this.groupRepository.save(group)) as unknown as Group;
    }

    async addGroupRule(
        userId: string,
        groupId: string,
        rule: {title: string; description: string}
    ): Promise<GroupRule> {
        const group = await this.getGroupById(groupId);

        // Check if the user is the owner of the group
        if (group.owner_id !== userId) {
            throw new ForbiddenException('Only group owners can add group rules');
        }

        const groupRule = this.groupRuleRepository.create({
            title: rule.title,
            description: rule.description,
            group: group,
        });

        // Cast to GroupRule if needed
        return (await this.groupRuleRepository.save(groupRule)) as unknown as GroupRule;
    }

    async removeGroupRule(userId: string, groupId: string, ruleId: string): Promise<{success: boolean}> {
        const group = await this.getGroupById(groupId);

        // Check if the user is the owner of the group
        if (group.owner_id !== userId) {
            throw new ForbiddenException('Only group owners can remove group rules');
        }

        // Find the rule
        const rule = await this.groupRuleRepository.findOne({
            where: {id: ruleId, group: {id: groupId}},
        });

        if (!rule) {
            throw new NotFoundException(`Rule with ID ${ruleId} not found in group ${groupId}`);
        }

        // Delete the rule
        await this.groupRuleRepository.remove(rule);

        return {success: true};
    }

    async sharePost(userId: string, postId: string): Promise<Post> {
        // Find the post to be shared
        const originalPost = await this.postRepository.findOne({
            where: {id: postId},
            relations: ['postAttachments', 'topics', 'newsFeed', 'owner'],
        });

        if (!originalPost) {
            throw new NotFoundException(`Post with ID ${postId} not found`);
        }

        // Get user's newsfeed
        const userNewsFeed = await this.ensureUserHasNewsFeed(userId);
        const user = await this.userReferenceService.findById(userId);

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        // Create a duplicate post with the same content
        const duplicatePost = this.postRepository.create({
            content: originalPost.content, // Use the original post content
            newsFeed: userNewsFeed,
            owner: user,
            topics: originalPost.topics, // Inherit topics from original post
        });

        const savedPost = await this.postRepository.save(duplicatePost);

        // Duplicate attachments if any
        if (originalPost.postAttachments && originalPost.postAttachments.length > 0) {
            for (const attachment of originalPost.postAttachments) {
                const duplicateAttachment = this.postAttachmentRepository.create({
                    attachment_url: attachment.attachment_url,
                    attachmentType: attachment.attachmentType,
                    post: savedPost,
                });
                await this.postAttachmentRepository.save(duplicateAttachment);
            }
        }

        // Create record in UserSharePost to track the share
        const userSharePost = this.userSharePostRepository.create({
            user_id: userId,
            post_id: originalPost.id,
        });
        await this.userSharePostRepository.save(userSharePost);

        return savedPost;
    }

    async getSharedPostsByUser(userId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<Post>> {
        // Get the records of posts shared by this user
        const [shares, total] = await this.userSharePostRepository.findAndCount({
            where: {user_id: userId},
            relations: ['post', 'post.owner', 'post.topics', 'post.postAttachments'],
            skip: (page - 1) * limit,
            take: limit,
            order: {createdAt: 'DESC'},
        });

        // Extract the posts from the shares
        const posts = shares.map((share) => share.post);

        return {
            data: posts,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getTrendingTag(
        page = 1,
        limit = 10
    ): Promise<PaginationResponseInterface<{trending: string; popularity: number}>> {
        try {
            // Get a sample of recent posts (limit to a reasonable number to avoid overwhelming Gemini API)
            const recentPosts = await this.postRepository.find({
                order: {
                    createdAt: 'DESC',
                },
                take: 200, // Analyze recent 200 posts
                select: ['id', 'content'],
            });

            // Collect all post content
            const allPostContent = recentPosts.map((post) => post.content).join('\n\n');

            if (!allPostContent.trim()) {
                return {
                    data: [],
                    metadata: {
                        total: 0,
                        page,
                        limit,
                        totalPages: 0,
                    },
                };
            }

            const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
            const GEMINI_API_URL = process.env.GEMINI_API_URL;

            if (!GEMINI_API_KEY) {
                this.logger.warn('GEMINI_API_KEY not set in environment variables');
                return {
                    data: [],
                    metadata: {
                        total: 0,
                        page,
                        limit,
                        totalPages: 0,
                    },
                };
            }

            // Create the Gemini API request for trend analysis
            const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                contents: [
                    {
                        parts: [
                            {
                                text: `Analyze the following post content and identify trending topics, keywords, or hashtags. For each trending term, count how many posts it appears to be relevant to or mentioned in.

Here's a sample of recent posts:

${allPostContent}

Return ONLY a JSON array of objects with the format: 
[{"trending": "keyword1", "popularity": number}, {"trending": "keyword2", "popularity": number}, ...]

Make sure to:
1. Focus on specific trending words, hashtags, or short phrases (1-3 words)
2. Include the popularity count (estimated number of posts relevant to that trend)
3. Sort from most popular to least popular
4. Return at least 20 trending items if possible
5. Only return the JSON array, no additional text`,
                            },
                        ],
                    },
                ],
            });

            // Extract and parse the response to get trending tags
            let responseText: string = response.data.candidates[0].content.parts[0].text.trim();

            // Handle Markdown formatted responses
            if (responseText.includes('```')) {
                const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (codeBlockMatch && codeBlockMatch[1]) {
                    responseText = codeBlockMatch[1].trim();
                }
            }

            try {
                // Parse the JSON response
                const trendingTags = JSON.parse(responseText) as {trending: string; popularity: number}[];

                // Ensure array is sorted by popularity (highest first)
                trendingTags.sort((a, b) => b.popularity - a.popularity);

                // Apply pagination
                const startIndex = (page - 1) * limit;
                const endIndex = Math.min(startIndex + limit, trendingTags.length);
                const paginatedTags = trendingTags.slice(startIndex, endIndex);

                return {
                    data: paginatedTags,
                    metadata: {
                        total: trendingTags.length,
                        page,
                        limit,
                        totalPages: Math.ceil(trendingTags.length / limit),
                    },
                };
            } catch (jsonError: any) {
                this.logger.error(`Error parsing JSON response from Gemini: ${jsonError.message}`);
                this.logger.debug(`Raw response received: ${responseText}`);
                return {
                    data: [],
                    metadata: {
                        total: 0,
                        page,
                        limit,
                        totalPages: 0,
                    },
                };
            }
        } catch (error: any) {
            this.logger.error(`Error analyzing trending tags: ${error.message}`);
            return {
                data: [],
                metadata: {
                    total: 0,
                    page,
                    limit,
                    totalPages: 0,
                },
            };
        }
    }
}
