import {INestApplication} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {ClientProxy, ClientsModule, Transport} from '@nestjs/microservices';
import {Test} from '@nestjs/testing';
import * as dotenv from 'dotenv';
import {firstValueFrom, timeout} from 'rxjs';

import {AppModule} from './app.module';
import {SocialLinkType} from './modules/user/enums/social-link.enum';

dotenv.config();

describe('User Module Tests', () => {
    let app: INestApplication;
    let clientProxy: ClientProxy;

    // Increase the default Jest timeout
    jest.setTimeout(60000);

    beforeAll(async () => {
        try {
            // Create a test module with both app and client
            const moduleRef = await Test.createTestingModule({
                imports: [
                    AppModule,
                    ClientsModule.registerAsync([
                        {
                            name: 'USER_CLIENT_TEST',
                            imports: [ConfigModule],
                            useFactory: (configService: ConfigService) => ({
                                transport: Transport.RMQ,
                                options: {
                                    urls: [
                                        `amqp://${configService.getOrThrow<string>('RABBITMQ_HOST_NAME')}:${configService.getOrThrow<string>('RABBITMQ_PORT')}`,
                                    ],
                                    queue: configService.getOrThrow<string>('USER_QUEUE_NAME'),
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
                    queue: process.env.USER_QUEUE_NAME,
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
            clientProxy = app.get('USER_CLIENT_TEST');

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

    describe('User commands', () => {
        // You'll need to use a valid user ID from your database
        const testUserId = process.env.TEST_USER_ID || '';

        // Skip tests if no test user ID is provided
        const conditionalIt = testUserId ? it : it.skip;

        conditionalIt('should get a user by ID', async () => {
            const user = await callCommand('GetByIdUserCommand', {id: testUserId});

            expect(user).toBeDefined();
            expect(user.id).toBe(testUserId);
        });

        conditionalIt('should get user events', async () => {
            const events = await callCommand('GetUserEventsUserCommand', {userId: testUserId});

            expect(Array.isArray(events)).toBe(true);
        });

        conditionalIt('should update user biography', async () => {
            const testBio = `Test biography ${new Date().toISOString()}`;

            const updatedUser = await callCommand('UpdateBiographyUserCommand', {
                userId: testUserId,
                biography: testBio,
            });

            expect(updatedUser).toBeDefined();
            expect(updatedUser.biography).toBe(testBio);

            // Verify the update was successful by getting the user again
            const user = await callCommand('GetByIdUserCommand', {id: testUserId});

            expect(user.biography).toBe(testBio);
        });

        // Get all users test
        it('should get all users', async () => {
            const users = await callCommand('GetAllUserCommand', {});

            expect(users).toBeDefined();
            expect(Array.isArray(users)).toBe(true);
        });

        // Social links tests
        conditionalIt('should get social links for a user', async () => {
            const socialLinks = await callCommand('GetSocialLinksUserCommand', {userId: testUserId});

            expect(socialLinks).toBeDefined();
            expect(Array.isArray(socialLinks)).toBe(true);
        });

        conditionalIt('should update social links for a user', async () => {
            // Create brand new test social links - no need to include existing ones
            // since the service deletes them all before creating new ones
            const testSocialLinks = [
                {
                    type: SocialLinkType.FACEBOOK,
                    link: `https://facebook.com/test-${Date.now()}`,
                },
                {
                    type: SocialLinkType.X,
                    link: `https://twitter.com/test-${Date.now()}`,
                },
                {
                    type: SocialLinkType.LINKEDIN,
                    link: `https://linkedin.com/test-${Date.now()}`,
                },
            ];

            // Update the social links
            const updatedSocialLinks = await callCommand('UpdateSocialLinksUserCommand', {
                userId: testUserId,
                socialLinks: testSocialLinks,
            });

            expect(updatedSocialLinks).toBeDefined();
            expect(Array.isArray(updatedSocialLinks)).toBe(true);
            expect(updatedSocialLinks.length).toBe(testSocialLinks.length);

            // Verify the links were created with the correct types
            const fbLink = updatedSocialLinks.find((link) => link.type === SocialLinkType.FACEBOOK);
            const twitterLink = updatedSocialLinks.find((link) => link.type === SocialLinkType.X);
            const linkedInLink = updatedSocialLinks.find((link) => link.type === SocialLinkType.LINKEDIN);

            expect(fbLink).toBeDefined();
            expect(twitterLink).toBeDefined();
            expect(linkedInLink).toBeDefined();
        });

        // User events tests
        conditionalIt('should add events to a user', async () => {
            const testEvent = `test-event-${Date.now()}`;

            const updatedUser = await callCommand('UpdateUserEventsUserCommand', {
                userId: testUserId,
                events: [testEvent],
            });

            expect(updatedUser).toBeDefined();
            expect(updatedUser.userEvent).toBeDefined();
            expect(Array.isArray(updatedUser.userEvent)).toBe(true);
            expect(updatedUser.userEvent).toContain(testEvent);
        });

        // Friends tests
        conditionalIt('should get friends for a user', async () => {
            try {
                const friendsResponse = await callCommand('GetFriendsUserCommand', {
                    userId: testUserId,
                    page: 1,
                    limit: 10,
                });

                expect(friendsResponse).toBeDefined();
                expect(friendsResponse.metadata).toBeDefined();
                expect(friendsResponse.data).toBeDefined();
                expect(Array.isArray(friendsResponse.data)).toBe(true);

                // Use optional chaining to avoid errors on undefined properties
                const total = friendsResponse?.metadata?.total;
                expect(typeof total).toBe('number');
            } catch (error) {
                console.error('Error in friends test:', error);
                throw error;
            }
        });

        // Profile picture test
        conditionalIt('should update user profile picture', async () => {
            const imageUrl = `https://example.com/profile-${Date.now()}.jpg`;

            const updatedUser = await callCommand('UpdateProfilePictureUserCommand', {
                id: testUserId,
                imageUrl: imageUrl,
            });

            expect(updatedUser).toBeDefined();
            expect(updatedUser.profileImageUrl).toBe(imageUrl);

            // Verify the update was successful by getting the user again
            const user = await callCommand('GetByIdUserCommand', {id: testUserId});
            expect(user.profileImageUrl).toBe(imageUrl);
        });

        // Cover photo test
        conditionalIt('should update user cover photo', async () => {
            const imageUrl = `https://example.com/cover-${Date.now()}.jpg`;

            const updatedUser = await callCommand('UpdateCoverPhotoUserCommand', {
                id: testUserId,
                imageUrl: imageUrl,
            });

            expect(updatedUser).toBeDefined();
            expect(updatedUser.coverImageUrl).toBe(imageUrl);

            // Verify the update was successful by getting the user again
            const user = await callCommand('GetByIdUserCommand', {id: testUserId});
            expect(user.coverImageUrl).toBe(imageUrl);
        });

        // Account suspension tests - USE WITH CAUTION
        // These tests modify account state in ways that might affect other testing
        if (process.env.RUN_ACCOUNT_STATUS_TESTS === 'true' && testUserId) {
            it('should suspend and unsuspend a user account', async () => {
                try {
                    // Suspend account
                    const suspendedUser = await callCommand('SuspendAccountUserCommand', {userId: testUserId});

                    expect(suspendedUser).toBeDefined();
                    expect(suspendedUser.status.isSuspended).toBe(true);

                    // Unsuspend account
                    const unsuspendedUser = await callCommand('UnsuspendAccountUserCommand', {userId: testUserId});

                    expect(unsuspendedUser).toBeDefined();
                    expect(unsuspendedUser.status.isSuspended).toBe(false);
                } catch (error) {
                    console.error('Error in account suspension test:', error);
                    throw error;
                }
            });
        }

        // Test sync all users - USE WITH CAUTION
        // This might be resource-intensive
        if (process.env.RUN_SYNC_ALL_USERS_TEST === 'true') {
            it('should sync all users', async () => {
                try {
                    const result = await callCommand('SyncAllUsersCommand', {});

                    expect(result).toBeDefined();
                } catch (error) {
                    console.error('Error syncing all users:', error);
                    throw error;
                }
            });
        }

        // Security Questions test

        // Settings test
        conditionalIt('should update user settings', async () => {
            const settingType = 'THEME';
            const settingValue = `theme-${Date.now()}`;

            const updatedSetting = await callCommand('UpdateSettingsUserCommand', {
                id: testUserId,
                type: settingType,
                value: settingValue,
            });

            expect(updatedSetting).toBeDefined();
            expect(updatedSetting.type).toBe(settingType);
            expect(updatedSetting.value).toBe(settingValue);
        });
    });
});
