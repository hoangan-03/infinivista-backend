import {faker} from '@faker-js/faker';
import {Logger} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {DataSource} from 'typeorm';

import {CallHistory} from '@/entities/internal/call-history.entity';
import {CallStatus} from '@/modules/calling/enums/call-status.enum';
import {CallType} from '@/modules/calling/enums/call-type.enum';
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

// Interface to match the user data structure from module-user
interface UserData {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string;
}

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
             SELECT u.id, u.email, u.username, u."firstName", u."lastName", u."profileImageUrl"
             FROM users u
             ORDER BY u.id
         `);

        logger.log(`Retrieved ${users.length} users from user module database`);

        // Create user references with exact IDs and data from user module
        logger.log('Creating user references with actual user data...');
        const userRefs: UserReference[] = [];

        for (const userData of users) {
            const userRef = userReferenceRepo.create({
                id: userData.id,
                email: userData.email,
                username: userData.username,
                firstName: userData.firstName,
                lastName: userData.lastName,
                profileImageUrl: userData.profileImageUrl,
            });
            await userReferenceRepo.save(userRef);
            userRefs.push(userRef);

            logger.log(`Created user reference for ${userData.username} with ID ${userData.id}`);
        }

        // Close the user module connection
        await userModuleConnection.destroy();
        logger.log('Closed connection to user module database');

        // Create direct messages between users
        logger.log('Creating direct messages...');
        const [admin, user1, user2] = userRefs;

        // Messages between admin and user1
        for (let i = 0; i < 3; i++) {
            const sender = i % 2 === 0 ? admin : user1;
            const receiver = i % 2 === 0 ? user1 : admin;

            const message = messageRepo.create({
                messageText: faker.lorem.sentence(),
                sent_at: faker.date.recent({days: 7}),
                status: faker.helpers.arrayElement(Object.values(MessageStatus)),
                sender,
                receiver,
            });
            await messageRepo.save(message);

            // Occasionally add an attachment
            if (faker.datatype.boolean({probability: 0.3})) {
                const attachment = messageAttachmentRepo.create({
                    attachment_url: faker.image.url(),
                    attachment_name: `file${i}.jpg`,
                    attachmentType: faker.helpers.arrayElement(Object.values(AttachmentType)),
                    sent_at: message.sent_at,
                    status: faker.helpers.arrayElement(Object.values(MessageStatus)),
                    sender,
                    receiver,
                });
                await messageAttachmentRepo.save(attachment);
            }
        }

        // Messages between user1 and user2
        for (let i = 0; i < 102; i++) {
            const sender = i % 2 === 0 ? user1 : user2;
            const receiver = i % 2 === 0 ? user2 : user1;

            const message = messageRepo.create({
                messageText: faker.lorem.sentence(),
                sent_at: faker.date.recent({days: 3}),
                status: faker.helpers.arrayElement(Object.values(MessageStatus)),
                emotion: faker.helpers.arrayElement(Object.values(EmoteIcon)),
                sender,
                receiver,
            });
            await messageRepo.save(message);
        }

        // Create a group chat with multiple users
        logger.log('Creating group chat...');
        const groupChat = groupChatRepo.create({
            group_name: 'Project Team',
        });
        await groupChatRepo.save(groupChat);

        // Add members to the group chat - Fix for "Cannot query across one-to-many" error
        logger.log('Adding users to group chat...');

        // Clear existing join table and/or GroupChat table as needed
        logger.log('Clearing group_chat_users join table...');
        try {
            await dataSource.query('TRUNCATE TABLE "group_chat_users" CASCADE;');
            logger.log('Join table cleared successfully');
        } catch (error: any) {
            logger.warn(`Could not clear join table: ${error.message}. This may be normal if it doesn't exist yet.`);
        }

        // Add each user to the group chat using direct SQL insertion into join table
        for (const user of userRefs) {
            try {
                // Insert into the join table directly
                await dataSource.query(
                    'INSERT INTO "group_chat_users" ("groupChatGroupChatId", "userReferenceId") VALUES ($1, $2)',
                    [groupChat.group_chat_id, user.id]
                );
                logger.log(`Added user ${user.username} to group chat ${groupChat.group_name}`);
            } catch (error: any) {
                logger.error(`Failed to add user ${user.id} to group: ${error.message}`);
                // If the error is about the table not existing, we need to create the table
                if (error.message.includes('does not exist')) {
                    logger.log('Attempting to create the join table and retry...');

                    // Try to create the join table if it doesn't exist (optional/fallback)
                    await dataSource.query(`
                        CREATE TABLE IF NOT EXISTS "group_chat_users" (
                            "groupChatGroupChatId" uuid NOT NULL,
                            "userReferenceId" uuid NOT NULL,
                            CONSTRAINT "PK_group_chat_users" PRIMARY KEY ("groupChatGroupChatId", "userReferenceId")
                        )
                    `);

                    // Retry insertion
                    await dataSource.query(
                        'INSERT INTO "group_chat_users" ("groupChatGroupChatId", "userReferenceId") VALUES ($1, $2)',
                        [groupChat.group_chat_id, user.id]
                    );
                }
            }
        }

        // Create group messages
        logger.log('Creating group messages...');
        for (let i = 0; i < 102; i++) {
            const sender = faker.helpers.arrayElement(userRefs);
            const groupMessage = groupChatMessageRepo.create({
                textMessage: faker.lorem.sentence(),
                sent_at: faker.date.recent({days: 5}),
                last_modified_at: new Date(),
                status: faker.helpers.arrayElement(Object.values(MessageStatus)),
                emotion: faker.helpers.arrayElements(Object.values(EmoteIcon), {min: 2, max: 5}),
                sender,
                groupChat,
            });
            await groupChatMessageRepo.save(groupMessage);
        }

        // Create a group attachment
        const groupAttachment = groupChatAttachmentRepo.create({
            attachment_url: faker.image.url(),
            attachment_name: 'group-doc.pdf',
            attachmentType: faker.helpers.arrayElement(Object.values(AttachmentType)),
            sent_at: faker.date.recent({days: 2}),
            status: faker.helpers.arrayElement(Object.values(MessageStatus)),
            sender: faker.helpers.arrayElement(userRefs),
            groupChat,
        });
        await groupChatAttachmentRepo.save(groupAttachment);

        // Create call history records
        logger.log('Creating call history records...');

        // Create various types of calls between users
        const callStatusOptions = Object.values(CallStatus);
        const callTypeOptions = Object.values(CallType);

        // Create 10 random calls between users
        for (let i = 0; i < 100; i++) {
            const caller = faker.helpers.arrayElement(userRefs);
            const receiver = faker.helpers.arrayElement(userRefs.filter((u) => u.id !== caller.id));

            // Generate call times
            const startTime = faker.date.recent({days: 14}); // Within last 2 weeks
            const callStatus = faker.helpers.arrayElement(callStatusOptions);
            let endTime: Date | undefined = undefined;
            const acceptedAt: Date | undefined = undefined;

            // Only add end_time and accepted_at for certain call statuses

            if (callStatus === CallStatus.ENDED) {
                const acceptedAt = new Date(startTime.getTime() + faker.number.int({min: 1000, max: 5000}));
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
                type: faker.helpers.arrayElement(callTypeOptions),
                caller: caller,
                receiver: receiver,
            });

            await CallHistoryRepo.save(callHistory);
        }

        logger.log(`Created ${100} call history records`);

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
