import {INestApplication} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {ClientProxy, ClientsModule, Transport} from '@nestjs/microservices';
import {Test} from '@nestjs/testing';
import * as dotenv from 'dotenv';
import {firstValueFrom} from 'rxjs';

import {AppModule} from './app.module';
import {SocialLink} from './entities/local/social-link.entity';
import {SocialLinkType} from './modules/user/enums/social-link.enum';

dotenv.config();

describe('User Microservice E2E Tests', () => {
    let app: INestApplication;
    let clientProxy: ClientProxy;

    beforeAll(async () => {
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
            },
        });

        await app.startAllMicroservices();
        await app.init();

        // Get the client proxy
        clientProxy = app.get('USER_CLIENT_TEST');
        await clientProxy.connect();
    }, 30000); // Increased timeout for RabbitMQ connection

    afterAll(async () => {
        await app.close();
    });

    describe('User commands', () => {
        // You'll need to use a valid user ID from your database
        const testUserId = process.env.TEST_USER_ID || '';

        // Skip tests if no test user ID is provided
        const conditionalIt = testUserId ? it : it.skip;

        conditionalIt('should get a user by ID', async () => {
            const user = await firstValueFrom(clientProxy.send('GetByIdUserCommand', {id: testUserId}));

            expect(user).toBeDefined();
            expect(user.id).toBe(testUserId);
        });

        conditionalIt('should get user events', async () => {
            const events = await firstValueFrom(clientProxy.send('GetUserEventsUserCommand', {userId: testUserId}));

            expect(Array.isArray(events)).toBe(true);
        });

        conditionalIt('should update user biography', async () => {
            const testBio = `Test biography ${new Date().toISOString()}`;

            const updatedUser = await firstValueFrom(
                clientProxy.send('UpdateBiographyUserCommand', {
                    userId: testUserId,
                    biography: testBio,
                })
            );

            expect(updatedUser).toBeDefined();
            expect(updatedUser.biography).toBe(testBio);

            // Verify the update was successful by getting the user again
            const user = await firstValueFrom(clientProxy.send('GetByIdUserCommand', {id: testUserId}));

            expect(user.biography).toBe(testBio);
        });

        // Get all users test
        it('should get all users', async () => {
            const users = await firstValueFrom(clientProxy.send('GetAllUserCommand', {}));

            expect(users).toBeDefined();
            expect(Array.isArray(users)).toBe(true);
        });

        // Social links tests
        conditionalIt('should get social links for a user', async () => {
            const socialLinks = await firstValueFrom(
                clientProxy.send('GetSocialLinksUserCommand', {userId: testUserId})
            );

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
            const updatedSocialLinks = await firstValueFrom(
                clientProxy.send('UpdateSocialLinksUserCommand', {
                    userId: testUserId,
                    socialLinks: testSocialLinks,
                })
            );

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

            const updatedUser = await firstValueFrom(
                clientProxy.send('UpdateUserEventsUserCommand', {
                    userId: testUserId,
                    events: [testEvent],
                })
            );

            expect(updatedUser).toBeDefined();
            expect(updatedUser.userEvent).toBeDefined();
            expect(Array.isArray(updatedUser.userEvent)).toBe(true);
            expect(updatedUser.userEvent).toContain(testEvent);
        });

        // Friends tests
        // conditionalIt('should get friends for a user', async () => {
        //     const friendsResponse = await firstValueFrom(
        //         clientProxy.send('GetFriendsUserCommand', {
        //             userId: testUserId,
        //             page: 1,
        //             limit: 10,
        //         })
        //     );

        //     expect(friendsResponse).toBeDefined();
        //     expect(friendsResponse.data).toBeDefined();
        //     expect(Array.isArray(friendsResponse.data)).toBe(true);
        //     expect(typeof friendsResponse.count).toBe('number');
        // });

        // conditionalIt('should get friend requests for a user', async () => {
        //     const requestsResponse = await firstValueFrom(
        //         clientProxy.send('GetFriendRequestsUserCommand', {
        //             userId: testUserId,
        //             page: 1,
        //             limit: 10,
        //         })
        //     );

        //     expect(requestsResponse).toBeDefined();
        //     expect(requestsResponse.data).toBeDefined();
        //     expect(Array.isArray(requestsResponse.data)).toBe(true);
        //     expect(typeof requestsResponse.count).toBe('number');
        // });

        // Profile settings test
        conditionalIt('should update profile privacy settings', async () => {
            const privacy = 'FRIENDS'; // Using 'FRIENDS' as a test value

            const updatedUser = await firstValueFrom(
                clientProxy.send('UpdateProfilePrivacyUserCommand', {
                    id: testUserId,
                    privacy: privacy,
                })
            );

            expect(updatedUser).toBeDefined();
            expect(updatedUser.profilePrivacy).toBe(privacy);

            // Verify the update was successful by getting the user again
            const user = await firstValueFrom(clientProxy.send('GetByIdUserCommand', {id: testUserId}));

            expect(user.profilePrivacy).toBe(privacy);
        });

        // Settings test
        conditionalIt('should update user settings', async () => {
            const settingType = 'THEME';
            const settingValue = `theme-${Date.now()}`;

            const updatedSetting = await firstValueFrom(
                clientProxy.send('UpdateSettingsUserCommand', {
                    id: testUserId,
                    type: settingType,
                    value: settingValue,
                })
            );

            expect(updatedSetting).toBeDefined();
            expect(updatedSetting.type).toBe(settingType);
            expect(updatedSetting.value).toBe(settingValue);
        });
    });
});
