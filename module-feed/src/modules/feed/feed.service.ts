import {BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import axios from 'axios';
import {In, Repository} from 'typeorm';

import {Comment} from '@/entities/local/comment.entity';
import {LiveStreamHistory} from '@/entities/local/live-stream-history.entity';
import {NewsFeed} from '@/entities/local/newsfeed.entity';
import {Post} from '@/entities/local/post.entity';
import {PostAttachment} from '@/entities/local/post-attachment';
import {Reel} from '@/entities/local/reel.entity';
import {Story} from '@/entities/local/story.entity';
import {Topic} from '@/entities/local/topic.entity';
import {UserReactPost} from '@/entities/local/user-react-post.entity';
import {UserReactStory} from '@/entities/local/user-react-story.entity';
import {PaginationResponseInterface} from '@/interfaces/pagination-response.interface';
import {ReactionType} from '@/modules/feed/enum/reaction-type.enum';

import {UserReferenceService} from '../user-reference/user-reference.service';
import {CreatePostDto} from './dto/create-post.dto';
import {CreateStoryDto} from './dto/create-story.dto';
import {AttachmentType} from './enum/attachment-type.enum';
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
        @InjectRepository(Topic)
        private readonly topicRepository: Repository<Topic>,
        @InjectRepository(Reel)
        private readonly reelRepository: Repository<Reel>
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
            relations: ['topics', 'postAttachments', 'newsFeed.owner'],
            skip: (page - 1) * limit,
            take: limit,
            order: {createdAt: 'DESC'},
        });

        // Map posts to include only topic name and description
        const mappedPosts = userPosts.map((post) => ({
            ...post,
            userOwner: userOwner,
            topics: post.topics.map((topic) => ({
                name: topic.topicName,
                description: topic.topicDescription,
            })),
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

    async getPopularPostNewsFeed(userId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<any>> {
        // Ensure the user has a newsfeed before proceeding
        const userFeed = await this.ensureUserHasNewsFeed(userId);
        const userOwner = await this.userReferenceService.findById(userId);

        console.log('this user owner', userOwner);
        console.log('this user feed', userFeed);

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

        const postsWithScores = posts.map((post) => {
            const reactionCount = reactionsByPostId[post.id] || 0;
            const commentCount = post.comments?.length || 0;
            const popularityScore = reactionCount * REACTION_WEIGHT + commentCount * COMMENT_WEIGHT;

            return {
                post,
                popularityScore,
            };
        });

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
            relations: ['newsFeed.owner', 'topics'],
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
        const mappedPosts = paginatedPosts.map((post) => ({
            ...post,
            userOwner: userOwner,
            topics: post.topics.map((topic) => ({
                name: topic.topicName,
                description: topic.topicDescription,
            })),
        }));

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
            relations: ['newsFeed.owner', 'topics'],
        });

        // Filter out posts that belong to the current user
        const filteredPublicPosts = publicPosts.filter((post) => post.newsFeed.owner.id !== userId);

        const postWithFriendVisibility = await this.postRepository.find({
            where: {newsFeed: {visibility: visibilityEnum.FRIENDS_ONLY}},
            relations: ['newsFeed.owner', 'topics'],
        });

        // CHECK OWNER ID OF THESE POST AND CHECK FRIENDSHIP WITH the owner
        const friendIds = await this.userReferenceService.getFriends(userId || '');
        const friendPost = postWithFriendVisibility.filter((post) => {
            const ownerId = post.newsFeed.owner.id;
            // Exclude user's own posts and only include friends' posts
            return ownerId !== userId && friendIds.some((friend) => friend.id === ownerId);
        });

        try {
            // Get user topic preferences based on reactions
            const preferredTopics = await this.getUserTopicPreferences(userId);

            // Combine filtered public posts and friend posts
            const combinedPosts = [...filteredPublicPosts, ...friendPost];

            if (preferredTopics.length === 0) {
                // No preferences found, return random posts
                for (let i = combinedPosts.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [combinedPosts[i], combinedPosts[j]] = [combinedPosts[j], combinedPosts[i]];
                }

                const startIndex = (page - 1) * limit;
                const endIndex = Math.min(page * limit, combinedPosts.length);
                const paginatedPosts = combinedPosts.slice(startIndex, endIndex);

                // Add userOwner to each post
                const mappedPosts = paginatedPosts.map((post) => ({
                    ...post,
                    userOwner: userOwner,
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
            const postsWithScores = combinedPosts.map((post) => {
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
            for (let i = combinedPosts.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [combinedPosts[i], combinedPosts[j]] = [combinedPosts[j], combinedPosts[i]];
            }

            // Add userOwner to each post
            const mappedPosts = combinedPosts.slice(0, limit).map((post) => ({
                ...post,
                userOwner: userOwner,
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

    async getPostById(postId: string): Promise<Post> {
        const post = await this.postRepository.findOne({
            where: {id: postId},
            relations: ['newsFeed', 'newsFeed.owner', 'comments', 'comments.user', 'postAttachments'],
        });

        if (!post) {
            throw new NotFoundException(`Post with ID ${postId} not found`);
        }
        const userOwner = await this.userReferenceService.findById(post.newsFeed.owner.id);

        // Add userOwner property
        const enhancedPost = {
            ...post,
            userOwner: userOwner,
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

        // Map reactions to include userOwner
        return reactions.map((reaction) => ({
            ...reaction,
            userOwner: reaction.user,
        }));
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

    async createPostAfterUploadingFiles(
        newsFeedId: string,
        postData: CreatePostDto,
        files: Array<{url: string; fileName: string; mimeType: string}>,
        attachmentType: AttachmentType[]
    ): Promise<Post> {
        this.logger.log(`Creating post with ${files?.length || 0} attachments for news feed ${newsFeedId}`);
        const newsFeed = await this.getNewsFeedById(newsFeedId);

        // Create the post first and associate it with the news feed
        const post = this.postRepository.create({
            content: postData.content,
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
}
