import {faker} from '@faker-js/faker';
import {Logger} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {getRepositoryToken} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {AppModule} from '../app.module';
import {UserReference} from '../entities/external/user-reference.entity';
import {GroupChat} from '../entities/internal/group-chat.entity';
import {GroupChatAttachment} from '../entities/internal/group-chat-attachment.entity';
import {Message} from '../entities/internal/message.entity';
import {MessageAttachment} from '../entities/internal/message-attachment.entity';
import {MessageStatus} from '../modules/messaging/enums/message-status.enum';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const logger = new Logger('CommunicationSeeder');

    try {
        logger.log('Starting communication module seeding...');

        // Get repositories
        const userReferenceRepo = app.get<Repository<UserReference>>(getRepositoryToken(UserReference));
        const messageRepo = app.get<Repository<Message>>(getRepositoryToken(Message));
        const groupChatRepo = app.get<Repository<GroupChat>>(getRepositoryToken(GroupChat));
        const messageAttachmentRepo = app.get<Repository<MessageAttachment>>(getRepositoryToken(MessageAttachment));
        const groupChatAttachmentRepo = app.get<Repository<GroupChatAttachment>>(
            getRepositoryToken(GroupChatAttachment)
        );

        // Clear existing data (in proper order to respect foreign keys)
        logger.log('Clearing existing data...');
        await messageAttachmentRepo.clear();
        await groupChatAttachmentRepo.clear();
        await messageRepo.clear();
        await groupChatRepo.clear();
        await userReferenceRepo.clear();

        // Create user references (mirroring the users from user module)
        logger.log('Creating user references...');
        const userRefs: UserReference[] = [];

        // Admin reference
        const adminRef = userReferenceRepo.create({
            id: faker.string.uuid(),
        });
        await userReferenceRepo.save(adminRef);
        userRefs.push(adminRef);

        // Regular user references
        for (let i = 1; i <= 2; i++) {
            const userRef = userReferenceRepo.create({
                id: faker.string.uuid(),
            });
            await userReferenceRepo.save(userRef);
            userRefs.push(userRef);
        }

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
                status: MessageStatus.SENT,
                sender,
                receiver,
            });
            await messageRepo.save(message);

            // Occasionally add an attachment
            if (faker.datatype.boolean({probability: 0.3})) {
                const attachment = messageAttachmentRepo.create({
                    attachment_url: faker.image.url(),
                    attachment_name: `file${i}.jpg`,
                    sent_at: message.sent_at,
                    status: MessageStatus.SENT,
                    sender,
                    receiver,
                });
                await messageAttachmentRepo.save(attachment);
            }
        }

        // Messages between user1 and user2
        for (let i = 0; i < 2; i++) {
            const sender = i % 2 === 0 ? user1 : user2;
            const receiver = i % 2 === 0 ? user2 : user1;

            const message = messageRepo.create({
                messageText: faker.lorem.sentence(),
                sent_at: faker.date.recent({days: 3}),
                status: MessageStatus.SENT,
                sender,
                receiver,
            });
            await messageRepo.save(message);
        }

        // Create a group chat
        // logger.log('Creating group chat...');
        // const groupChat = groupChatRepo.create({
        //     name: 'Project Team',
        //     description: 'Group for project discussion',
        //     created_at: faker.date.recent({days: 10}),
        //     updated_at: new Date(),
        //     creator: admin,
        // });
        // await groupChatRepo.save(groupChat);

        // // Add members to the group chat
        // logger.log('Adding group members...');
        // for (const user of userRefs) {
        //     const member = groupMemberRepo.create({
        //         user,
        //         groupChat,
        //         joined_at: faker.date.recent({days: 10}),
        //     });
        //     await groupMemberRepo.save(member);
        // }

        // Create group messages
        // logger.log('Creating group messages...');
        // for (let i = 0; i < 3; i++) {
        //     const sender = faker.helpers.arrayElement(userRefs);
        //     const message = messageRepo.create({
        //         content: faker.lorem.sentence(),
        //         sent_at: faker.date.recent({days: 5}),
        //         status: MessageStatus.DELIVERED,
        //         sender,
        //         groupChat,
        //     });
        //     await messageRepo.save(message);
        // }

        // // Create a group attachment
        // const groupAttachment = groupChatAttachmentRepo.create({
        //     attachment_url: faker.image.url(),
        //     attachment_name: 'group-doc.pdf',
        //     sent_at: faker.date.recent({days: 2}),
        //     status: MessageStatus.DELIVERED,
        //     sender: faker.helpers.arrayElement(userRefs),
        //     groupChat,
        // });
        // await groupChatAttachmentRepo.save(groupAttachment);

        logger.log('Communication module seeding completed successfully!');
    } catch (error) {
        process.exitCode = 1;
    } finally {
        await app.close();
    }
}

bootstrap();
