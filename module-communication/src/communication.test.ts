import {INestApplication} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {ClientProxy, ClientsModule, Transport} from '@nestjs/microservices';
import {Test} from '@nestjs/testing';
import * as dotenv from 'dotenv';
import {firstValueFrom, timeout} from 'rxjs';

import {AppModule} from './app.module';
import {EmoteIcon} from './modules/messaging/enums/emote-icon.enum';

dotenv.config();

describe('Communication Module Tests', () => {
    let app: INestApplication;
    let clientProxy: ClientProxy;

    // Increase the default Jest timeout
    jest.setTimeout(60000);

    beforeAll(async () => {
        try {
            const mockUserReferenceService = {
                findById: jest.fn().mockImplementation((id) =>
                    Promise.resolve({
                        id: process.env.TEST_SENDER_ID,
                        username: `user_${id}`,
                        email: `user_${id}@example.com`,
                        firstName: 'Test',
                        lastName: 'User',
                        profileImageUrl: 'https://example.com/profile.jpg',
                        phoneNumber: '+1234567890',
                    })
                ),
                upsertUserReference: jest.fn().mockImplementation((userData) => Promise.resolve(userData)),
            };
            // Create a test module with both app and client
            const moduleRef = await Test.createTestingModule({
                imports: [
                    AppModule,
                    ClientsModule.registerAsync([
                        {
                            name: 'COMMUNICATION_CLIENT_TEST',
                            imports: [ConfigModule],
                            useFactory: (configService: ConfigService) => ({
                                transport: Transport.RMQ,
                                options: {
                                    urls: [
                                        `amqp://${configService.getOrThrow<string>('RABBITMQ_HOST_NAME')}:${configService.getOrThrow<string>('RABBITMQ_PORT')}`,
                                    ],
                                    queue: configService.getOrThrow<string>('COMMUNICATION_QUEUE_NAME'),
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
                    queue: process.env.COMMUNICATION_QUEUE_NAME,
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
            clientProxy = app.get('COMMUNICATION_CLIENT_TEST');

            // Wait for client to be ready
            await new Promise((resolve) => setTimeout(resolve, 3000));
            console.log('RabbitMQ connection established');
        } catch (err) {
            console.error('Failed to initialize test setup:', err);
            throw err;
        }
    }, 30000);

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

    describe('Messaging commands', () => {
        // You'll need to use valid user IDs from your database
        const testSenderId = process.env.TEST_SENDER_ID || '';
        const testRecipientId = process.env.TEST_RECIPIENT_ID || '';

        // Skip tests if no test user IDs are provided
        const conditionalIt = testSenderId && testRecipientId ? it : it.skip;

        // Get all messages test
        conditionalIt('should get all messages', async () => {
            const messagesResponse = await callCommand('GetAllMessageCommand', {page: 1, limit: 10});

            expect(messagesResponse).toBeDefined();
            expect(messagesResponse.data).toBeDefined();
            expect(Array.isArray(messagesResponse.data)).toBe(true);
            expect(messagesResponse.metadata).toBeDefined();
            expect(typeof messagesResponse.metadata.total).toBe('number');
        });

        // Create and get message tests
        conditionalIt('should create a new text message and retrieve it', async () => {
            const testMessage = `Test message ${new Date().toISOString()}`;

            // Create a message
            const message = await callCommand('CreateMessageCommand', {
                senderId: testSenderId,
                createMessageDto: {
                    recipientId: testRecipientId,
                    messageText: testMessage,
                },
            });

            expect(message).toBeDefined();
            expect(message.messageText).toBe(testMessage);
            expect(message.sender.id).toBe(testSenderId);
            expect(message.receiver.id).toBe(testRecipientId);

            // Get the message by ID
            const retrievedMessage = await callCommand('GetIdMessageCommand', {id: message.id});

            expect(retrievedMessage).toBeDefined();
            expect(retrievedMessage.id).toBe(message.id);
            expect(retrievedMessage.messageText).toBe(testMessage);
        });

        conditionalIt('should get messages from a conversation', async () => {
            const conversationResponse = await callCommand('GetAllMessageFromConversationCommand', {
                currentId: testSenderId,
                targetId: testRecipientId,
                page: 1,
                limit: 10,
            });

            expect(conversationResponse).toBeDefined();
            expect(conversationResponse.data).toBeDefined();
            expect(Array.isArray(conversationResponse.data)).toBe(true);
        });

        conditionalIt('should add reaction to a message', async () => {
            // First, create a message
            const testMessage = `Test message for reaction ${new Date().toISOString()}`;
            const message = await callCommand('CreateMessageCommand', {
                senderId: testSenderId,
                createMessageDto: {
                    recipientId: testRecipientId,
                    messageText: testMessage,
                },
            });

            // Add reaction
            const reactionMessage = await callCommand('AddReactionCommand', {
                id: message.id,
                currentId: testRecipientId,
                emoteReactionDto: {
                    emotion: EmoteIcon.LIKE,
                },
            });

            expect(reactionMessage).toBeDefined();
            expect(reactionMessage.id).toBe(message.id);
            expect(reactionMessage.emotion).toBe(EmoteIcon.LIKE);
        });
    });

    describe('Group Chat commands', () => {
        const testUserId = process.env.TEST_SENDER_ID || '';

        // Skip tests if no test user ID is provided
        const conditionalIt = testUserId ? it : it.skip;

        let testGroupChatId = '';

        conditionalIt('should create a group chat and retrieve it', async () => {
            const groupName = `Test Group ${new Date().toISOString()}`;

            // Create a group chat
            const groupChat = await callCommand('CreateGroupChatCommand', {
                userId: testUserId,
                groupName: groupName,
            });

            expect(groupChat).toBeDefined();
            expect(groupChat.group_name).toBe(groupName);

            // Save the group chat ID for later tests
            testGroupChatId = groupChat.group_chat_id;

            // Get user's group chats
            const userGroupChats = await callCommand('GetCurrentUserGroupChatsCommand', {
                userId: testUserId,
                page: 1,
                limit: 10,
            });

            expect(userGroupChats).toBeDefined();
            expect(userGroupChats.data).toBeDefined();
            expect(Array.isArray(userGroupChats.data)).toBe(true);
        });
    });

    describe('Calling commands', () => {
        const testCallerId = process.env.TEST_SENDER_ID || '';
        const testReceiverId = process.env.TEST_RECIPIENT_ID || '';

        // Skip tests if no test user IDs are provided
        const conditionalIt = testCallerId && testReceiverId ? it : it.skip;

        conditionalIt('should get call history for a user', async () => {
            const callHistory = await callCommand('GetCallHistoryCommand', {
                userId: testCallerId,
                page: 1,
                limit: 10,
            });

            expect(callHistory).toBeDefined();
            expect(callHistory.data).toBeDefined();
            expect(Array.isArray(callHistory.data)).toBe(true);
            expect(callHistory.metadata).toBeDefined();
        });

        // Note: We don't test actual call initiation as it would require WebSocket connections
        // and might trigger real call notifications. Instead, we're just testing the history endpoint.
    });

    describe('Attachment commands', () => {
        const testSenderId = process.env.TEST_SENDER_ID || '';
        const testRecipientId = process.env.TEST_RECIPIENT_ID || '';

        // Skip tests if no test user IDs are provided
        const conditionalIt = testSenderId && testRecipientId ? it : it.skip;

        conditionalIt('should get attachments from a conversation', async () => {
            const attachments = await callCommand('GetAllAttachmentsFromConversationCommand', {
                currentId: testSenderId,
                targetId: testRecipientId,
                page: 1,
                limit: 10,
            });

            expect(attachments).toBeDefined();
            expect(attachments.data).toBeDefined();
            expect(Array.isArray(attachments.data)).toBe(true);
        });

        // Note: We're not testing actual file uploads which would require file buffer handling
        // Instead we're just testing the query endpoint for attachments
    });

    describe('Mixed content commands', () => {
        const testSenderId = process.env.TEST_SENDER_ID || '';
        const testRecipientId = process.env.TEST_RECIPIENT_ID || '';

        // Skip tests if no test user IDs are provided
        const conditionalIt = testSenderId && testRecipientId ? it : it.skip;

        conditionalIt('should get mixed conversation content', async () => {
            const mixedContent = await callCommand('GetMixedConversationContentCommand', {
                currentId: testSenderId,
                targetId: testRecipientId,
                page: 1,
                limit: 10,
            });

            expect(mixedContent).toBeDefined();
            expect(mixedContent.data).toBeDefined();
            expect(Array.isArray(mixedContent.data)).toBe(true);
        });
    });
});
