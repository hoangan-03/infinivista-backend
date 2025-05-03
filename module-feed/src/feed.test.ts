import {INestApplication} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {ClientProxy, ClientsModule, Transport} from '@nestjs/microservices';
import {Test} from '@nestjs/testing';
import * as dotenv from 'dotenv';
import {firstValueFrom, timeout} from 'rxjs';

import {AppModule} from './app.module';
import {AttachmentType} from './modules/feed/enum/attachment-type.enum';
import {PageCategoryEnum} from './modules/feed/enum/page-category.enum';
import {ReactionType} from './modules/feed/enum/reaction-type.enum';

dotenv.config();

describe('Feed Module Tests', () => {
    let app: INestApplication;
    let clientProxy: ClientProxy;
    // Increase the default Jest timeout
    jest.setTimeout(60000);

    beforeAll(async () => {
        try {
            const mockUserReferenceService = {
                findById: jest.fn().mockImplementation((id) =>
                    Promise.resolve({
                        id: process.env.TEST_USER_ID,
                        username: `user_${id}`,
                        email: `user_${id}@example.com`,
                        firstName: 'Test',
                        lastName: 'User',
                        profileImageUrl: 'https://example.com/profile.jpg',
                        phoneNumber: '+1234567890',
                    })
                ),
                getFriends: jest.fn().mockResolvedValue([]),
                upsertUserReference: jest.fn().mockImplementation((userData) => Promise.resolve(userData)),
                checkFriendship: jest.fn().mockResolvedValue(true),
            };
            // Create a test module with both app and client
            const moduleRef = await Test.createTestingModule({
                imports: [
                    AppModule,
                    ClientsModule.registerAsync([
                        {
                            name: 'FEED_CLIENT_TEST',
                            imports: [ConfigModule],
                            useFactory: (configService: ConfigService) => ({
                                transport: Transport.RMQ,
                                options: {
                                    urls: [
                                        `amqp://${configService.getOrThrow<string>('RABBITMQ_HOST_NAME')}:${configService.getOrThrow<string>('RABBITMQ_PORT')}`,
                                    ],
                                    queue: configService.getOrThrow<string>('FEED_QUEUE_NAME'),
                                    queueOptions: {
                                        durable: false,
                                    },
                                    socketOptions: {
                                        heartbeatIntervalInSeconds: 5,
                                        reconnectTimeInSeconds: 1,
                                    },
                                },
                            }),
                            inject: [ConfigService],
                        },
                    ]),
                ],
            }).compile();

            // Create and start the application
            app = moduleRef.createNestApplication();

            // Configure the microservice
            app.connectMicroservice({
                transport: Transport.RMQ,
                options: {
                    urls: [`amqp://${process.env.RABBITMQ_HOST_NAME}:${process.env.RABBITMQ_PORT}`],
                    queue: process.env.FEED_QUEUE_NAME,
                    queueOptions: {
                        durable: false,
                    },
                    socketOptions: {
                        heartbeatIntervalInSeconds: 5,
                        reconnectTimeInSeconds: 1,
                    },
                },
            });

            await app.startAllMicroservices();
            await app.init();

            // Get the client proxy
            clientProxy = app.get('FEED_CLIENT_TEST');

            // Wait for client to be ready
            await new Promise((resolve) => setTimeout(resolve, 3000));
            console.log('RabbitMQ connection established');
        } catch (err) {
            console.error('Failed to initialize test setup:', err);
            throw err;
        }
    }, 30000); // Increased timeout for RabbitMQ connection

    afterAll(async () => {
        try {
            // Give time for any pending operations to complete
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Close connections in correct order
            if (clientProxy) {
                await clientProxy.close();
                console.log('Client proxy closed');
            }

            if (app) {
                await app.close();
                console.log('App closed');
            }
        } catch (err) {
            console.error('Error during test cleanup:', err);
        }
    }, 15000);

    // Helper function to make RPC calls with timeout handling
    const callCommand = async (command: string, payload: any) => {
        try {
            return await firstValueFrom(
                clientProxy.send(command, payload).pipe(
                    timeout(10000) // 10 second timeout for each call
                )
            );
        } catch (error) {
            console.error(`Error calling command ${command}:`, error);
            throw error;
        }
    };

    describe('NewsFeed commands', () => {
        // You'll need to use a valid user ID from your database
        const testUserId = process.env.TEST_USER_ID || '';

        // Skip tests if no test user ID is provided
        const conditionalIt = testUserId ? it : it.skip;

        // conditionalIt('should create a new feed', async () => {
        //     const description = `Test feed ${new Date().toISOString()}`;
        //     const newsFeed = await callCommand('CreateNewsFeedCommand', {
        //         id: testUserId,
        //         data: {description},
        //     });

        //     expect(newsFeed).toBeDefined();
        //     expect(newsFeed.description).toBe(description);
        //     expect(newsFeed.owner.id).toBe(testUserId);
        // });

        conditionalIt('should get popular newsfeed', async () => {
            const result = await callCommand('GetPopularNewsFeedCommand', {
                id: testUserId,
                page: 1,
                limit: 10,
            });

            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.metadata).toBeDefined();
        });

        // conditionalIt('should get friends newsfeed', async () => {
        //     const result = await callCommand('GetFriendsNewsFeedCommand', {
        //         id: testUserId,
        //         page: 1,
        //         limit: 10,
        //     });

        //     expect(result).toBeDefined();
        //     expect(result.data).toBeDefined();
        //     expect(Array.isArray(result.data)).toBe(true);
        //     expect(result.metadata).toBeDefined();
        // });

        // conditionalIt('should get random newsfeed', async () => {
        //     const result = await callCommand('GetRandomNewsFeedCommand', {
        //         id: testUserId,
        //         page: 1,
        //         limit: 10,
        //     });

        //     expect(result).toBeDefined();
        //     expect(result.data).toBeDefined();
        //     expect(Array.isArray(result.data)).toBe(true);
        //     expect(result.metadata).toBeDefined();
        // });

        conditionalIt('should get newsfeed by id', async () => {
            const result = await callCommand('GetByIdNewsFeedCommand', {
                id: testUserId,
            });

            expect(result).toBeDefined();
            expect(result.owner.id).toBe(testUserId);
        });
    });

    describe('Post commands', () => {
        const testUserId = process.env.TEST_USER_ID || '';
        const conditionalIt = testUserId ? it : it.skip;
        let testPostId = '';

        conditionalIt('should create a post with files', async () => {
            // First, get the user's newsfeed
            const newsFeed = await callCommand('GetByIdNewsFeedCommand', {id: testUserId});
            expect(newsFeed).toBeDefined();

            const content = `Test post content ${new Date().toISOString()}`;
            const post = await callCommand('CreatePostAfterUploadingFilesCommand', {
                newsFeedId: newsFeed.id,
                postData: {content},
                files: [
                    {
                        url: 'https://example.com/test-image.jpg',
                        fileName: 'test-image.jpg',
                        mimeType: 'image/jpeg',
                    },
                ],
                attachmentType: [AttachmentType.IMAGE],
            });

            expect(post).toBeDefined();
            expect(post.content).toBe(content);

            // Save post ID for later tests
            testPostId = post.id;
        });

        conditionalIt('should get a post by ID', async () => {
            // Skip if we don't have a post ID from previous test
            if (!testPostId) {
                console.warn('Skipping test because no post ID is available');
                return;
            }

            const post = await callCommand('GetAPostByIdCommand', {postId: testPostId});

            expect(post).toBeDefined();
            expect(post.id).toBe(testPostId);
        });

        // conditionalIt('should update a post', async () => {
        //     // Skip if we don't have a post ID from previous test
        //     if (!testPostId) {
        //         console.warn('Skipping test because no post ID is available');
        //         return;
        //     }

        //     const updatedContent = `Updated content ${new Date().toISOString()}`;
        //     const updatedPost = await callCommand('UpdatePostNewsFeedCommand', {
        //         postId: testPostId,
        //         postData: {content: updatedContent},
        //     });

        //     expect(updatedPost).toBeDefined();
        //     expect(updatedPost.content).toBe(updatedContent);
        // });

        conditionalIt('should get posts by newsfeed id', async () => {
            // First, get the user's newsfeed
            const newsFeed = await callCommand('GetByIdNewsFeedCommand', {id: testUserId});

            const posts = await callCommand('GetPostsByIdNewsFeedCommand', {
                newsfeedId: newsFeed.id,
                page: 1,
                limit: 10,
            });

            expect(posts).toBeDefined();
            expect(posts.data).toBeDefined();
            expect(Array.isArray(posts.data)).toBe(true);
        });

        // conditionalIt('should delete a post', async () => {
        //     // Skip if we don't have a post ID
        //     if (!testPostId) {
        //         console.warn('Skipping test because no post ID is available');
        //         return;
        //     }

        //     const deletedPost = await callCommand('DeletePostNewsFeedCommand', {
        //         postId: testPostId,
        //     });

        //     expect(deletedPost).toBeDefined();
        // });
    });

    describe('Comment commands', () => {
        const testUserId = process.env.TEST_USER_ID || '';
        const conditionalIt = testUserId ? it : it.skip;

        let testPostId = '';
        let testCommentId = '';

        conditionalIt('should create a post and add a comment', async () => {
            // First, get the user's newsfeed
            const newsFeed = await callCommand('GetByIdNewsFeedCommand', {id: testUserId});

            // Create a post first
            const postContent = `Test post for comments ${new Date().toISOString()}`;
            const post = await callCommand('CreatePostAfterUploadingFilesCommand', {
                newsFeedId: newsFeed.id,
                postData: {content: postContent},
                files: [],
                attachmentType: [],
            });

            expect(post).toBeDefined();
            testPostId = post.id;

            // Now add a comment
            const commentText = `Test comment ${new Date().toISOString()}`;
            const comment = await callCommand('CreateCommentCommand', {
                postId: testPostId,
                userId: testUserId,
                text: commentText,
            });

            expect(comment).toBeDefined();
            expect(comment.text).toBe(commentText);
            expect(comment.user.id).toBe(testUserId);

            testCommentId = comment.id;
        });

        conditionalIt('should get comments for a post', async () => {
            // Skip if we don't have a post ID from previous test
            if (!testPostId) {
                console.warn('Skipping test because no post ID is available');
                return;
            }

            const comments = await callCommand('GetCommentsByPostIdCommand', {
                postId: testPostId,
                page: 1,
                limit: 10,
            });

            expect(comments).toBeDefined();
            expect(comments.data).toBeDefined();
            expect(Array.isArray(comments.data)).toBe(true);
        });

        conditionalIt('should update a comment', async () => {
            // Skip if we don't have a comment ID from previous test
            if (!testCommentId) {
                console.warn('Skipping test because no comment ID is available');
                return;
            }

            const updatedText = `Updated comment ${new Date().toISOString()}`;
            const updatedComment = await callCommand('UpdateCommentCommand', {
                commentId: testCommentId,
                userId: testUserId,
                text: updatedText,
            });

            expect(updatedComment).toBeDefined();
            expect(updatedComment.text).toBe(updatedText);
        });

        conditionalIt('should delete a comment', async () => {
            // Skip if we don't have a comment ID from previous test
            if (!testCommentId) {
                console.warn('Skipping test because no comment ID is available');
                return;
            }

            const deletedComment = await callCommand('DeleteCommentCommand', {
                commentId: testCommentId,
                userId: testUserId,
            });

            expect(deletedComment).toBeDefined();
        });
    });

    describe('Reaction commands', () => {
        const testUserId = process.env.TEST_USER_ID || '';
        const conditionalIt = testUserId ? it : it.skip;

        let testPostId = '';

        conditionalIt('should create a post and add a reaction', async () => {
            // First, get the user's newsfeed
            const newsFeed = await callCommand('GetByIdNewsFeedCommand', {id: testUserId});

            // Create a post first
            const postContent = `Test post for reactions ${new Date().toISOString()}`;
            const post = await callCommand('CreatePostAfterUploadingFilesCommand', {
                newsFeedId: newsFeed.id,
                postData: {content: postContent},
                files: [],
                attachmentType: [],
            });

            expect(post).toBeDefined();
            testPostId = post.id;

            // Now add a reaction
            const reaction = await callCommand('AddReactionCommand', {
                userId: testUserId,
                postId: testPostId,
                reactionType: ReactionType.LIKE,
            });

            expect(reaction).toBeDefined();
            expect(reaction.user_id).toBe(testUserId);
            expect(reaction.post_id).toBe(testPostId);
        });

        conditionalIt('should get reactions for a post', async () => {
            // Skip if we don't have a post ID from previous test
            if (!testPostId) {
                console.warn('Skipping test because no post ID is available');
                return;
            }

            const reactions = await callCommand('GetReactionsByPostIdCommand', {
                postId: testPostId,
            });

            expect(reactions).toBeDefined();
            expect(Array.isArray(reactions)).toBe(true);
        });

        conditionalIt('should get reaction counts by type', async () => {
            // Skip if we don't have a post ID from previous test
            if (!testPostId) {
                console.warn('Skipping test because no post ID is available');
                return;
            }

            const counts = await callCommand('GetReactionCountByTypeCommand', {
                postId: testPostId,
            });

            expect(counts).toBeDefined();
            expect(counts[ReactionType.LIKE]).toBeDefined();
        });

        conditionalIt('should remove a reaction', async () => {
            // Skip if we don't have a post ID from previous test
            if (!testPostId) {
                console.warn('Skipping test because no post ID is available');
                return;
            }

            const result = await callCommand('RemoveReactionCommand', {
                postId: testPostId,
                userId: testUserId,
            });

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
        });
    });

    describe('Story commands', () => {
        const testUserId = process.env.TEST_USER_ID || '';
        const conditionalIt = testUserId ? it : it.skip;

        let testStoryId = '';

        conditionalIt('should create a story', async () => {
            // First, get the user's newsfeed
            const newsFeed = await callCommand('GetByIdNewsFeedCommand', {id: testUserId});

            const storyData = {
                story_url: `https://example.com/story-${Date.now()}.jpg`,
                duration: 15,
                attachmentType: AttachmentType.IMAGE,
            };

            const story = await callCommand('CreateStoryNewsFeedCommand', {
                newsFeedId: newsFeed.id,
                storyData,
            });

            expect(story).toBeDefined();
            expect(story.story_url).toBe(storyData.story_url);

            testStoryId = story.id;
        });

        conditionalIt('should get a story by ID', async () => {
            // Skip if we don't have a story ID from previous test
            if (!testStoryId) {
                console.warn('Skipping test because no story ID is available');
                return;
            }

            const story = await callCommand('GetAStoryByIdCommand', {
                storyId: testStoryId,
            });

            expect(story).toBeDefined();
            expect(story.id).toBe(testStoryId);
        });

        conditionalIt('should get stories by newsfeed ID', async () => {
            // First, get the user's newsfeed
            const newsFeed = await callCommand('GetByIdNewsFeedCommand', {id: testUserId});

            const stories = await callCommand('GetStoriesByIdNewsFeedCommand', {
                newsFeedId: newsFeed.id,
                page: 1,
                limit: 10,
            });

            expect(stories).toBeDefined();
            expect(stories.data).toBeDefined();
            expect(Array.isArray(stories.data)).toBe(true);
        });

        conditionalIt('should add a reaction to a story', async () => {
            // Skip if we don't have a story ID from previous test
            if (!testStoryId) {
                console.warn('Skipping test because no story ID is available');
                return;
            }

            const reaction = await callCommand('AddStoryReactionCommand', {
                userId: testUserId,
                storyId: testStoryId,
                reactionType: ReactionType.HEART,
            });

            expect(reaction).toBeDefined();
            expect(reaction.user_id).toBe(testUserId);
            expect(reaction.story_id).toBe(testStoryId);
        });

        conditionalIt('should get reactions for a story', async () => {
            // Skip if we don't have a story ID from previous test
            if (!testStoryId) {
                console.warn('Skipping test because no story ID is available');
                return;
            }

            const reactions = await callCommand('GetReactionsByStoryIdCommand', {
                storyId: testStoryId,
            });

            expect(reactions).toBeDefined();
            expect(Array.isArray(reactions)).toBe(true);
        });

        conditionalIt('should get story reaction counts', async () => {
            // Skip if we don't have a story ID from previous test
            if (!testStoryId) {
                console.warn('Skipping test because no story ID is available');
                return;
            }

            const counts = await callCommand('GetStoryReactionCountByTypeCommand', {
                storyId: testStoryId,
            });

            expect(counts).toBeDefined();
            expect(counts[ReactionType.HEART]).toBeDefined();
        });

        conditionalIt('should remove a reaction from a story', async () => {
            // Skip if we don't have a story ID from previous test
            if (!testStoryId) {
                console.warn('Skipping test because no story ID is available');
                return;
            }

            const result = await callCommand('RemoveStoryReactionCommand', {
                storyId: testStoryId,
                userId: testUserId,
            });

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
        });
    });

    describe('Page commands', () => {
        const testUserId = process.env.TEST_USER_ID || '';
        const conditionalIt = testUserId ? it : it.skip;

        let testPageId = '';

        conditionalIt('should create a page', async () => {
            const pageData = {
                name: `Test Page ${Date.now()}`,
                description: 'This is a test page created during integration testing',
                category: PageCategoryEnum.ENTERTAINMENT,
            };

            const page = await callCommand('CreatePage', {
                ownerId: testUserId,
                pageData,
            });

            expect(page).toBeDefined();
            expect(page.name).toBe(pageData.name);
            expect(page.owner.id).toBe(testUserId);

            testPageId = page.id;
        });

        conditionalIt('should get a page by ID', async () => {
            // Skip if we don't have a page ID from previous test
            if (!testPageId) {
                console.warn('Skipping test because no page ID is available');
                return;
            }

            const page = await callCommand('GetPageById', {
                id: testPageId,
            });

            expect(page).toBeDefined();
            expect(page.id).toBe(testPageId);
        });

        conditionalIt('should get all pages', async () => {
            const result = await callCommand('GetAllPages', {
                page: 1,
                limit: 10,
            });

            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        });

        conditionalIt('should get pages owned by current user', async () => {
            const result = await callCommand('GetMyPages', {
                userId: testUserId,
                page: 1,
                limit: 10,
            });

            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        });

        conditionalIt('should update a page', async () => {
            // Skip if we don't have a page ID from previous test
            if (!testPageId) {
                console.warn('Skipping test because no page ID is available');
                return;
            }

            const updateData = {
                description: `Updated description ${Date.now()}`,
            };

            const updatedPage = await callCommand('UpdatePage', {
                userId: testUserId,
                pageId: testPageId,
                updateData,
            });

            expect(updatedPage).toBeDefined();
            expect(updatedPage.description).toBe(updateData.description);
        });

        // conditionalIt('should follow and unfollow a page', async () => {
        //     // Skip if we don't have a page ID from previous test
        //     if (!testPageId) {
        //         console.warn('Skipping test because no page ID is available');
        //         return;
        //     }

        //     // Follow the page
        //     const followResult = await callCommand('FollowPage', {
        //         userId: testUserId,
        //         pageId: testPageId,
        //     });

        //     expect(followResult).toBeDefined();
        //     expect(followResult.success).toBe(true);

        //     // Check followers
        //     const followers = await callCommand('GetPageFollowers', {
        //         pageId: testPageId,
        //         page: 1,
        //         limit: 10,
        //     });

        //     expect(followers).toBeDefined();
        //     expect(followers.data).toBeDefined();
        //     expect(Array.isArray(followers.data)).toBe(true);

        //     // Unfollow the page
        //     const unfollowResult = await callCommand('UnfollowPage', {
        //         userId: testUserId,
        //         pageId: testPageId,
        //     });

        //     expect(unfollowResult).toBeDefined();
        //     expect(unfollowResult.success).toBe(true);
        // });

        // Skip page deletion test to keep the test data for future test runs
        // We could add a cleanup flag similar to user.test.ts if needed
    });
});
