import {faker} from '@faker-js/faker';
import {Logger} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import axios from 'axios';
import {DataSource} from 'typeorm';

import {CallHistory} from '@/entities/internal/call-history.entity';
import {CallStatus} from '@/modules/calling/enums/call-status.enum';
import {AttachmentType} from '@/modules/messaging/enums/attachment-type.enum';
import {EmoteIcon} from '@/modules/messaging/enums/emote-icon.enum';

import {AppModule} from '../app.module';
import {UserReference} from '../entities/external/user-reference.entity';
import {GroupChat} from '../entities/internal/group-chat.entity';
import {GroupChatAttachment} from '../entities/internal/group-chat-attachment.entity';
import {GroupChatMessage} from '../entities/internal/group-chat-message.entity';
import {Message} from '../entities/internal/message.entity';
import {MessageAttachment} from '../entities/internal/message-attachment.entity';
import {MessageStatus} from '../modules/messaging/enums/message-status.enum';
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

async function generateMeaningfulMessageContent(
    logger: Logger,
    context?: {
        relationship?: 'friend' | 'acquaintance' | 'family' | 'professional';
        previousMessage?: string;
        sender?: {firstName?: string; lastName?: string; username?: string};
        recipient?: {firstName?: string; lastName?: string; username?: string};
        isGroupChat?: boolean;
    }
): Promise<string> {
    let attempts = 0;
    const maxAttempts = 3;
    const baseDelay = 2000; // 2 seconds base delay for exponential backoff
    const maxDelay = 30000; // Maximum delay of 30 seconds

    while (attempts < maxAttempts) {
        try {
            const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
            const GEMINI_API_URL = process.env.GEMINI_API_URL;

            if (!GEMINI_API_KEY) {
                logger.warn('GEMINI_API_KEY not set in environment variables');
                return getFallbackMessageContent(context);
            }

            // Wait for a rate limit slot before making the request
            await geminiRateLimiter.waitForSlot();

            // Build prompt based on provided context
            let prompt = context?.isGroupChat
                ? 'Generate a realistic group chat message'
                : 'Generate a realistic direct message';

            if (context?.relationship) prompt += ` between ${context.relationship}s`;

            if (context?.sender) {
                const senderName = getSenderName(context.sender);
                prompt += ` from ${senderName}`;
            }

            if (context?.recipient && !context.isGroupChat) {
                const recipientName = getSenderName(context.recipient);
                prompt += ` to ${recipientName}`;
            }

            if (context?.previousMessage) {
                prompt += ` in response to: "${context.previousMessage}"`;
            }

            prompt += '. Make it sound natural, concise, and conversational. Maximum 20 words.';

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
            attempts++;

            // Check if it's a rate limit error (usually 429 status code)
            const isRateLimit = error.response?.status === 429;

            if (isRateLimit && attempts < maxAttempts) {
                // Calculate exponential backoff time with jitter
                const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
                const jitter = Math.random() * 3000; // Add up to 3 seconds of random jitter
                const delayMs = exponentialDelay + jitter;

                logger.warn(
                    `Rate limit hit for Gemini API. Retrying after ${delayMs.toFixed(2)}ms (attempt ${attempts}/${maxAttempts})`
                );

                // Wait before retrying
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            } else {
                if (attempts >= maxAttempts) {
                    logger.error(`Exceeded maximum retry attempts (${maxAttempts}) for Gemini API`);
                } else {
                    logger.error(`Error generating message content with Gemini: ${error.message}`);
                }
                // Fall back to static content after all retries fail
                return getFallbackMessageContent(context);
            }
        }
    }

    return getFallbackMessageContent(context);
}

function getSenderName(person: {firstName?: string; lastName?: string; username?: string}): string {
    if (person.firstName && person.lastName) {
        return `${person.firstName} ${person.lastName}`;
    } else if (person.firstName) {
        return person.firstName;
    } else if (person.username) {
        return person.username;
    }
    return 'User';
}

function getFallbackMessageContent(context?: any): string {
    const messageTypes = {
        friend: [
            "Hey! How's it going?",
            'What are you up to today?',
            "Did you see that new movie everyone's talking about?",
            'Got plans for the weekend?',
            "Miss you! Let's catch up soon.",
            "Haven't seen you in forever. How have you been?",
            "Just thought of you! Hope you're doing well.",
            "Remember that time we went to that restaurant? Let's go again!",
            "I've been meaning to ask you about that new job.",
            'Wanted to share some good news with you!',
            'Are you free this weekend? Thinking of having people over.',
        ],
        family: [
            'Have you eaten yet?',
            'Call me when you get a chance.',
            "Don't forget about Sunday dinner!",
            'Can you pick up some groceries on your way?',
            'Love you! Stay safe.',
            "Mom's asking when you're coming to visit.",
            'Did you see the photos I sent from the family reunion?',
            "Let's plan something special for dad's birthday.",
            'Can you help me with something this weekend?',
            "Just checking in to make sure you're doing okay.",
        ],
        professional: [
            'Just following up on our meeting yesterday.',
            'Could you share those files when you get a chance?',
            'Are we still on for 3pm?',
            'Great work on the presentation!',
            'Let me know if you need any clarification.',
            "I've reviewed the proposal and have some feedback.",
            'When would be a good time to discuss the project timeline?',
            'The client really liked your approach on this.',
            'Can we move our meeting to tomorrow instead?',
            'I just sent you an email with the quarterly numbers.',
            'Looking forward to your presentation at the all-hands.',
            'Do you have capacity to take on another task this sprint?',
        ],
        acquaintance: [
            'Nice to connect with you!',
            'How have you been since we last talked?',
            'Remember me from the conference?',
            'Thought you might find this interesting.',
            "Let's grab coffee sometime.",
            'I saw something that reminded me of our conversation.',
            'It was great meeting you at the event last week.',
            'Would love to continue our discussion about that project.',
            'Are you going to the networking event next month?',
        ],
        group: [
            "Who's free this weekend?",
            'Did everyone see the announcement?',
            "I'm sharing this with all of you.",
            'Can someone help me with something?',
            'Great discussion everyone!',
            'Has anyone heard back about the proposal?',
            "Let's coordinate on this project together.",
            "I've uploaded all the files to our shared folder.",
            'What does everyone think about the new direction?',
            'Can we find a time that works for everyone next week?',
            'Looking forward to seeing everyone at the event!',
            "Just a reminder about tomorrow's deadline.",
        ],
        default: ['Hey there!', 'How are you?', 'Just checking in.', "What's new?", "Hope you're doing well!"],
    };

    // Determine the appropriate category based on context
    let category: keyof typeof messageTypes = 'default';

    if (context?.isGroupChat) {
        category = 'group';
    } else if (context?.relationship && messageTypes[context.relationship as keyof typeof messageTypes]) {
        category = context.relationship as keyof typeof messageTypes;
    }

    const availableMessages = messageTypes[category];
    return faker.helpers.arrayElement(availableMessages);
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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const seedCommunicationDatabase = async (dataSource: DataSource) => {
    const app = await NestFactory.createApplicationContext(AppModule);
    const logger = new Logger('CommunicationSeeder');

    try {
        logger.log('Starting communication module seeding...');

        // Get repositories
        const userReferenceRepo = dataSource.getRepository(UserReference);
        const messageRepo = dataSource.getRepository(Message);
        const groupChatRepo = dataSource.getRepository(GroupChat);
        const messageAttachmentRepo = dataSource.getRepository(MessageAttachment);
        const groupChatMessageRepo = dataSource.getRepository(GroupChatMessage);
        const groupChatAttachmentRepo = dataSource.getRepository(GroupChatAttachment);
        const CallHistoryRepo = dataSource.getRepository(CallHistory);

        // Clear existing data (in proper order to respect foreign keys)
        logger.log('Clearing existing data...');
        await CallHistoryRepo.query('TRUNCATE TABLE "call_history" CASCADE;');
        await messageAttachmentRepo.query('TRUNCATE TABLE "message_attachment" CASCADE;');
        await groupChatAttachmentRepo.query('TRUNCATE TABLE "group_chat_attachment" CASCADE;');
        await groupChatMessageRepo.query('TRUNCATE TABLE "group_chat_message" CASCADE;');
        await messageRepo.query('TRUNCATE TABLE "message" CASCADE;');
        await userReferenceRepo.query('TRUNCATE TABLE "user_reference" CASCADE;');
        await groupChatRepo.query('TRUNCATE TABLE "group_chat" CASCADE;');

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

        // Create user references with exact IDs and data from user module
        logger.log('Creating user references with actual user data...');
        const userRefs: UserReference[] = [];
        let adminUserRef: UserReference | undefined;
        let admin2UserRef: UserReference | undefined;
        const otherUserRefs: UserReference[] = [];

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

            if (userData.username === 'admin') {
                adminUserRef = userRef; // Store the admin user reference for later use
                logger.log(`Found admin user: ${userData.username} with ID ${userData.id}`);
            } else if (userData.username === 'admin2') {
                admin2UserRef = userRef; // Store the second admin user reference
                logger.log(`Found second admin user: ${userData.username} with ID ${userData.id}`);
            } else {
                otherUserRefs.push(userRef); // Store non-admin users separately
            }

            logger.log(`Created user reference for ${userData.username} with ID ${userData.id}`);
        }

        if (!adminUserRef) {
            logger.warn('Admin user not found. Using first user as admin for seeding purposes.');
            adminUserRef = userRefs[0];
        }

        // Close the user module connection
        await userModuleConnection.destroy();
        logger.log('Closed connection to user module database');

        // Create messages between the two admin users
        if (adminUserRef && admin2UserRef) {
            logger.log('Creating direct messages between admin users...');
            // Create 35-50 messages between admin users
            const messageCount = faker.number.int({min: 35, max: 50});

            // Store previous message to provide context for the next one
            let previousMessage: string | undefined = undefined;

            for (let i = 0; i < messageCount; i++) {
                // Add a small delay every 5 messages to avoid hitting rate limits
                if (i > 0 && i % 5 === 0) {
                    await delay(1000); // 1 second delay every 5 messages
                }

                // Roughly equal number of messages from each admin
                const isAdmin1Sender = faker.datatype.boolean();
                const sender = isAdmin1Sender ? adminUserRef : admin2UserRef;
                const receiver = isAdmin1Sender ? admin2UserRef : adminUserRef;

                // Generate AI message content
                const messageText = await generateMeaningfulMessageContent(logger, {
                    relationship: 'professional',
                    previousMessage,
                    sender: {
                        firstName: sender.firstName,
                        lastName: sender.lastName,
                        username: sender.username,
                    },
                    recipient: {
                        firstName: receiver.firstName,
                        lastName: receiver.lastName,
                        username: receiver.username,
                    },
                });

                const message = messageRepo.create({
                    messageText: messageText,
                    sent_at: faker.date.recent({days: 21}),
                    status: faker.helpers.arrayElement([MessageStatus.SENT, MessageStatus.SEEN]),
                    sender,
                    receiver,
                    emotion: faker.helpers.maybe(() => faker.helpers.arrayElement(Object.values(EmoteIcon)), {
                        probability: 0.4,
                    }),
                });
                await messageRepo.save(message);

                // Save for context in next message
                previousMessage = messageText;

                // Admin messages often contain attachments (50% probability)
                if (faker.datatype.boolean()) {
                    const attachmentType = faker.helpers.arrayElement(Object.values(AttachmentType));
                    const attachment = messageAttachmentRepo.create({
                        attachment_url:
                            attachmentType === AttachmentType.VIDEO
                                ? faker.helpers.arrayElement(videoLinks)
                                : faker.helpers.arrayElement(imageLinks),
                        attachment_name: `admin-doc-${i}.${faker.helpers.arrayElement(['jpg', 'pdf', 'xlsx', 'docx', 'png'])}`,
                        attachmentType,
                        sent_at: message.sent_at,
                        status: faker.helpers.arrayElement([MessageStatus.SENT, MessageStatus.SEEN]),
                        sender,
                        receiver,
                    });
                    await messageAttachmentRepo.save(attachment);
                }
            }
            logger.log(`Created ${messageCount} messages between admin users`);
        }

        // Create direct messages between admins and other users (REDUCED VOLUME)
        logger.log('Creating direct messages primarily for admin users...');

        // Create messages between first admin and each other user
        for (const otherUser of otherUserRefs) {
            // Reduce to 10-15 messages between admin and each user (previously 20-30)
            const messageCount = faker.number.int({min: 10, max: 15});

            // Store previous message to provide context for the next one
            let previousMessage: string | undefined = undefined;

            for (let i = 0; i < messageCount; i++) {
                if (i > 0 && i % 5 === 0) {
                    await delay(1000); // 1 second delay every 5 messages
                }
                // Admin sends 70% of messages, other user sends 30%
                const isAdminSender = faker.datatype.boolean({probability: 0.7});
                const sender = isAdminSender ? adminUserRef : otherUser;
                const receiver = isAdminSender ? otherUser : adminUserRef;

                // Use Gemini AI for meaningful message content
                const messageText = await generateMeaningfulMessageContent(logger, {
                    relationship: 'professional',
                    previousMessage,
                    sender: {
                        firstName: sender.firstName,
                        lastName: sender.lastName,
                        username: sender.username,
                    },
                    recipient: {
                        firstName: receiver.firstName,
                        lastName: receiver.lastName,
                        username: receiver.username,
                    },
                });

                const message = messageRepo.create({
                    messageText: messageText,
                    sent_at: faker.date.recent({days: 14}),
                    status: faker.helpers.arrayElement([MessageStatus.SENT, MessageStatus.SEEN]),
                    sender,
                    receiver,
                    emotion: faker.helpers.maybe(() => faker.helpers.arrayElement(Object.values(EmoteIcon)), {
                        probability: 0.3,
                    }),
                });
                await messageRepo.save(message);

                // Save for context in next message
                previousMessage = messageText;

                // Occasionally add an attachment (40% for admin-sent messages, 20% for user-sent)
                const attachmentProbability = isAdminSender ? 0.4 : 0.2;
                if (faker.datatype.boolean({probability: attachmentProbability})) {
                    const attachmentType = faker.helpers.arrayElement(Object.values(AttachmentType));
                    const attachment = messageAttachmentRepo.create({
                        attachment_url:
                            attachmentType === AttachmentType.VIDEO
                                ? faker.helpers.arrayElement(videoLinks)
                                : faker.helpers.arrayElement(imageLinks),
                        attachment_name: `file${i}_${faker.lorem.word()}.${faker.helpers.arrayElement(['jpg'])}`,
                        attachmentType,
                        sent_at: message.sent_at,
                        status: faker.helpers.arrayElement([MessageStatus.SENT, MessageStatus.SEEN]),
                        sender,
                        receiver,
                    });
                    await messageAttachmentRepo.save(attachment);
                }
            }
        }

        // Create messages between second admin and each other user
        if (admin2UserRef) {
            for (const otherUser of otherUserRefs) {
                // Reduce to 8-12 messages between admin2 and each user (previously 15-25)
                const messageCount = faker.number.int({min: 8, max: 12});

                // Store previous message to provide context for the next one
                let previousMessage: string | undefined = undefined;

                for (let i = 0; i < messageCount; i++) {
                    if (i > 0 && i % 5 === 0) {
                        await delay(1000); // 1 second delay every 5 messages
                    }
                    // Admin2 sends 65% of messages, other user sends 35%
                    const isAdminSender = faker.datatype.boolean({probability: 0.65});
                    const sender = isAdminSender ? admin2UserRef : otherUser;
                    const receiver = isAdminSender ? otherUser : admin2UserRef;

                    // Use Gemini AI for meaningful message content
                    const messageText = await generateMeaningfulMessageContent(logger, {
                        relationship: 'professional',
                        previousMessage,
                        sender: {
                            firstName: sender.firstName,
                            lastName: sender.lastName,
                            username: sender.username,
                        },
                        recipient: {
                            firstName: receiver.firstName,
                            lastName: receiver.lastName,
                            username: receiver.username,
                        },
                    });

                    const message = messageRepo.create({
                        messageText: messageText,
                        sent_at: faker.date.recent({days: 10}),
                        status: faker.helpers.arrayElement([MessageStatus.SENT, MessageStatus.SEEN]),
                        sender,
                        receiver,
                        emotion: faker.helpers.maybe(() => faker.helpers.arrayElement(Object.values(EmoteIcon)), {
                            probability: 0.3,
                        }),
                    });
                    await messageRepo.save(message);

                    // Save for context in next message
                    previousMessage = messageText;

                    // Occasionally add an attachment (35% for admin2-sent messages, 20% for user-sent)
                    const attachmentProbability = isAdminSender ? 0.35 : 0.2;
                    if (faker.datatype.boolean({probability: attachmentProbability})) {
                        const attachmentType = faker.helpers.arrayElement(Object.values(AttachmentType));
                        const attachment = messageAttachmentRepo.create({
                            attachment_url:
                                attachmentType === AttachmentType.VIDEO
                                    ? faker.helpers.arrayElement(videoLinks)
                                    : faker.helpers.arrayElement(imageLinks),
                            attachment_name: `file${i}_${faker.lorem.word()}.${faker.helpers.arrayElement(['jpg', 'pdf', 'doc', 'png'])}`,
                            attachmentType,
                            sent_at: message.sent_at,
                            status: faker.helpers.arrayElement([MessageStatus.SENT, MessageStatus.SEEN]),
                            sender,
                            receiver,
                        });
                        await messageAttachmentRepo.save(attachment);
                    }
                }
            }
        }

        // Create group chats with admin always included
        logger.log('Creating group chats with admin as a prominent member...');

        // Create 5-8 group chats
        const groupChatCount = faker.number.int({min: 5, max: 8});

        for (let i = 0; i < groupChatCount; i++) {
            // Always include at least one admin user as the creator
            const isAdmin1Creator = faker.datatype.boolean();
            const creator: UserReference | undefined = isAdmin1Creator ? adminUserRef : admin2UserRef;
            if (!creator) {
                logger.error('No admin user reference found. Skipping group chat creation.');
                continue;
            }

            // Add 5-12 members to the group
            const memberCount = faker.number.int({min: 5, max: 12});
            const members = faker.helpers.arrayElements(otherUserRefs, memberCount - 2); // Leave space for admins

            // Ensure both admins are always in the group chat if they exist
            if (adminUserRef) members.push(adminUserRef);
            if (admin2UserRef) members.push(admin2UserRef);

            // Create a meaningful group chat name that reflects real usage patterns
            const groupChatNameTypes = [
                // Project/team style names
                `${faker.company.buzzNoun()} ${faker.company.buzzAdjective()} Team`,
                `${faker.commerce.department()} Project`,
                `${faker.company.name()} Planning`,

                // Friend/social group style names
                `${faker.location.city()} Trip ${faker.date.future().getFullYear()}`,
                `Weekend ${faker.word.adjective()} Group`,
                `${faker.music.genre()} Fans`,

                // Casual/fun group names with emoji
                `🎉 ${faker.word.adjective({length: {min: 3, max: 8}})} Squad`,
                `🔥 ${faker.commerce.productAdjective()} Friends`,
                `${faker.animal.type()} ${faker.helpers.arrayElement(['Lovers', 'Group', 'Chat'])} 🌟`,
            ];

            const groupChat = groupChatRepo.create({
                group_name: faker.helpers.arrayElement(groupChatNameTypes),
                users: members,
                group_image_url: faker.helpers.arrayElement(imageLinks),
            });

            await groupChatRepo.save(groupChat);

            // Create 10-25 messages in the group
            const messageCount = faker.number.int({min: 10, max: 25});
            let previousGroupMessage: string | undefined = undefined;

            for (let j = 0; j < messageCount; j++) {
                if (i > 0 && i % 5 === 0) {
                    await delay(1000); // 1 second delay every 5 messages
                }
                // Random member sends the message
                const sender = faker.helpers.arrayElement(members);

                // Generate AI message content for group chat
                const messageText = await generateMeaningfulMessageContent(logger, {
                    relationship: 'friend',
                    previousMessage: previousGroupMessage,
                    sender: {
                        firstName: sender.firstName,
                        lastName: sender.lastName,
                        username: sender.username,
                    },
                    isGroupChat: true,
                });

                const message = groupChatMessageRepo.create({
                    textMessage: messageText,
                    sent_at: faker.date.recent({days: 14}),
                    sender,
                    status: faker.helpers.arrayElement([MessageStatus.SENT, MessageStatus.SEEN]),
                    groupChat,
                });

                await groupChatMessageRepo.save(message);
                previousGroupMessage = messageText;

                // 30% chance of having an attachment
                if (faker.datatype.boolean({probability: 0.3})) {
                    const attachmentType = faker.helpers.arrayElement(Object.values(AttachmentType));
                    const attachment = groupChatAttachmentRepo.create({
                        attachment_url:
                            attachmentType === AttachmentType.VIDEO
                                ? faker.helpers.arrayElement(videoLinks)
                                : faker.helpers.arrayElement(imageLinks),
                        attachment_name: `group-file-${j}.${faker.helpers.arrayElement(['jpg', 'pdf', 'doc', 'png'])}`,
                        attachmentType,
                        sent_at: message.sent_at,
                        status: faker.helpers.arrayElement([MessageStatus.SENT, MessageStatus.SEEN]),
                        sender,
                        groupChat,
                    });

                    await groupChatAttachmentRepo.save(attachment);
                }
            }

            logger.log(
                `Created group chat "${groupChat.group_name}" with ${messageCount} messages and ${members.length} members`
            );
        }

        // Create call history records with focus on admins
        logger.log('Creating call history records focused on admin users...');
        const callStatusOptions = Object.values(CallStatus);

        // Create calls between the two admin users
        if (adminUserRef && admin2UserRef) {
            logger.log('Creating call history between admin users...');
            const callCount = faker.number.int({min: 6, max: 9});

            for (let i = 0; i < callCount; i++) {
                const isAdmin1Caller = faker.datatype.boolean();
                const caller = isAdmin1Caller ? adminUserRef : admin2UserRef;
                const receiver = isAdmin1Caller ? admin2UserRef : adminUserRef;

                // Generate call details
                const startTime = faker.date.recent({days: 30}); // Within last month
                const callStatus = faker.helpers.arrayElement(callStatusOptions);
                let endTime: Date | undefined = undefined;
                let acceptedAt: Date | undefined = undefined;

                // Admins usually have longer successful calls
                if (callStatus === CallStatus.ENDED) {
                    acceptedAt = new Date(startTime.getTime() + faker.number.int({min: 1000, max: 3000}));
                    endTime = new Date(acceptedAt!.getTime() + faker.number.int({min: 300000, max: 3600000})); // 5-60 min call
                } else if (callStatus === CallStatus.REJECTED) {
                    endTime = new Date(startTime.getTime() + faker.number.int({min: 3000, max: 10000}));
                } else if (callStatus === CallStatus.MISSED) {
                    endTime = new Date(startTime.getTime() + faker.number.int({min: 15000, max: 30000}));
                }

                const callHistory = CallHistoryRepo.create({
                    start_time: startTime,
                    end_time: endTime,
                    accepted_at: acceptedAt,
                    status: callStatus,
                    caller,
                    receiver,
                });

                await CallHistoryRepo.save(callHistory);
            }
            logger.log(`Created ${callCount} calls between admin users`);
        }

        const admin1CallCount = 10;
        for (let i = 0; i < admin1CallCount; i++) {
            const isAdminCaller = faker.datatype.boolean();
            const otherUser = faker.helpers.arrayElement(otherUserRefs);

            const caller = isAdminCaller ? adminUserRef : otherUser;
            const receiver = isAdminCaller ? otherUser : adminUserRef;

            // Generate call details
            const startTime = faker.date.recent({days: 21}); // Within last 3 weeks
            const callStatus = faker.helpers.arrayElement(callStatusOptions);
            let endTime: Date | undefined = undefined;
            let acceptedAt: Date | undefined = undefined;

            if (callStatus === CallStatus.ENDED) {
                acceptedAt = new Date(startTime.getTime() + faker.number.int({min: 1000, max: 5000}));
                endTime = new Date(acceptedAt!.getTime() + faker.number.int({min: 30000, max: 1800000})); // 30s - 30 min call
            } else if (callStatus === CallStatus.REJECTED) {
                endTime = new Date(startTime.getTime() + faker.number.int({min: 3000, max: 10000}));
            } else if (callStatus === CallStatus.MISSED) {
                endTime = new Date(startTime.getTime() + faker.number.int({min: 15000, max: 30000}));
            }

            const callHistory = CallHistoryRepo.create({
                start_time: startTime,
                end_time: endTime,
                accepted_at: acceptedAt,
                status: callStatus,
                caller,
                receiver,
            });

            await CallHistoryRepo.save(callHistory);
        }

        if (admin2UserRef) {
            const admin2CallCount = 10;
            for (let i = 0; i < admin2CallCount; i++) {
                const isAdminCaller = faker.datatype.boolean();
                const otherUser = faker.helpers.arrayElement(otherUserRefs);

                const caller = isAdminCaller ? admin2UserRef : otherUser;
                const receiver = isAdminCaller ? otherUser : admin2UserRef;

                // Generate call details
                const startTime = faker.date.recent({days: 14});
                const callStatus = faker.helpers.arrayElement(callStatusOptions);
                let endTime: Date | undefined = undefined;
                let acceptedAt: Date | undefined = undefined;

                if (callStatus === CallStatus.ENDED) {
                    acceptedAt = new Date(startTime.getTime() + faker.number.int({min: 1000, max: 5000}));
                    endTime = new Date(acceptedAt!.getTime() + faker.number.int({min: 30000, max: 1200000})); // 30s - 20 min call
                } else if (callStatus === CallStatus.REJECTED) {
                    endTime = new Date(startTime.getTime() + faker.number.int({min: 3000, max: 10000}));
                } else if (callStatus === CallStatus.MISSED) {
                    endTime = new Date(startTime.getTime() + faker.number.int({min: 15000, max: 30000}));
                }

                const callHistory = CallHistoryRepo.create({
                    start_time: startTime,
                    end_time: endTime,
                    accepted_at: acceptedAt,
                    status: callStatus,
                    caller,
                    receiver,
                });

                await CallHistoryRepo.save(callHistory);
            }
        }

        const regularUserCallCount = 1;
        for (let i = 0; i < regularUserCallCount; i++) {
            const userIndices = faker.helpers.shuffle([...Array(otherUserRefs.length).keys()]);
            const caller = otherUserRefs[userIndices[0]];
            const receiver = otherUserRefs[userIndices[1]];

            // Generate call details
            const startTime = faker.date.recent({days: 14});
            const callStatus = faker.helpers.arrayElement(callStatusOptions);
            let endTime: Date | undefined = undefined;
            let acceptedAt: Date | undefined = undefined;

            if (callStatus === CallStatus.ENDED) {
                acceptedAt = new Date(startTime.getTime() + faker.number.int({min: 1000, max: 5000}));
                endTime = new Date(acceptedAt.getTime() + faker.number.int({min: 10000, max: 600000})); // 10s - 10 min call
            } else if (callStatus === CallStatus.REJECTED) {
                endTime = new Date(startTime.getTime() + faker.number.int({min: 3000, max: 10000}));
            } else if (callStatus === CallStatus.MISSED) {
                endTime = new Date(startTime.getTime() + faker.number.int({min: 15000, max: 30000}));
            }

            const callHistory = CallHistoryRepo.create({
                start_time: startTime,
                end_time: endTime,
                accepted_at: acceptedAt,
                status: callStatus,
                caller,
                receiver,
            });

            await CallHistoryRepo.save(callHistory);
        }

        const totalCallCount =
            admin1CallCount +
            (admin2UserRef ? 20 : 0) +
            regularUserCallCount +
            (adminUserRef && admin2UserRef ? faker.number.int({min: 15, max: 25}) : 0);
        logger.log(`Created approximately ${totalCallCount} call history records`);
        logger.log('Communication module seeding completed successfully!');
    } catch (error: any) {
        logger.error(`Error during seeding: ${error.message}`);
        logger.error(`Error details: ${JSON.stringify(error, null, 2)}`);
        if (error.stack) {
            logger.error(`Stack trace: ${error.stack}`);
        }
        logger.error('Communication module seeding failed!');
        process.exitCode = 1;
    } finally {
        await app.close();
    }
};
