import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    Post,
    Put,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {ClientProxy} from '@nestjs/microservices';
import {FileInterceptor} from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {Express} from 'express';
import {lastValueFrom} from 'rxjs';

import {CurrentUser} from '@/decorators/user.decorator';
import {PaginationDto} from '@/dtos/common/pagination.dto';
import {AddUserGroupChatDto} from '@/dtos/communication-module/add-user-groupchat.dto';
import {CreateGroupMessageDto} from '@/dtos/communication-module/create-group-message.dto';
import {CreateMessageDto} from '@/dtos/communication-module/create-message.dto';
import {EmoteReactionDto} from '@/dtos/communication-module/emote-reaction.dto';
import {UpdateMessageDto} from '@/dtos/communication-module/update-message.dto';
import {UserReference} from '@/entities/communication-module/external/user-reference.entity';
import {GroupChat} from '@/entities/communication-module/internal/group-chat.entity';
import {GroupChatAttachment} from '@/entities/communication-module/internal/group-chat-attachment.entity';
import {Message} from '@/entities/communication-module/internal/message.entity';
import {MessageAttachment} from '@/entities/communication-module/internal/message-attachment.entity';
import {AttachmentType} from '@/enums/communication-module/attachment-type.enum';
import {JWTAuthGuard} from '@/guards/jwt-auth.guard';
import {JwtBlacklistGuard} from '@/guards/jwt-blacklist.guard';
import {PaginationResponseInterface} from '@/interfaces/common/pagination-response.interface';
import {FileUploadService} from '@/services/file-upload.service';

@ApiTags('Messaging')
@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard, JWTAuthGuard)
@Controller('messaging')
export class MessagingController {
    constructor(
        @Inject('COMMUNICATION_SERVICE') private communicationClient: ClientProxy,
        private configService: ConfigService,
        private fileUploadService: FileUploadService
    ) {}

    /**
     * Get all messages
     */
    @Get('/messsage')
    @ApiOperation({summary: 'Get all messages'})
    @ApiQuery({type: PaginationDto})
    @ApiResponse({
        status: 200,
        description: 'Returns paginated messages',
        type: [Message],
    })
    async getAllMessages(@Query() paginationDto: PaginationDto): Promise<PaginationResponseInterface<Message>> {
        return await lastValueFrom(
            this.communicationClient.send('GetAllMessageCommand', {
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    /**
     * Create a new message
     */
    @Post('/messsage')
    @ApiOperation({summary: 'Create a new message'})
    @ApiBody({
        description: 'Message Text',
        type: CreateMessageDto,
    })
    @ApiResponse({
        status: 201,
        description: 'Message created successfully',
        type: Message,
    })
    async createMessage(@CurrentUser() user, @Body() createMessageDto: CreateMessageDto) {
        return await lastValueFrom(
            this.communicationClient.send('CreateMessageCommand', {senderId: user.id, createMessageDto})
        );
    }

    /**
     * Get all messages from a conversation with a friend
     */
    @Get('/conversation/:targetId')
    @ApiOperation({summary: 'Get all messages from a conversation with a friend'})
    @ApiParam({name: 'targetId', description: 'Target user ID'})
    @ApiQuery({type: PaginationDto})
    @ApiResponse({
        status: 200,
        description: 'Returns paginated messages from the conversation',
        type: [Message],
    })
    async getAllMessageFromConversation(
        @CurrentUser() user,
        @Param('targetId') targetId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<Message>> {
        return await lastValueFrom(
            this.communicationClient.send('GetAllMessageFromConversationCommand', {
                currentId: user.id,
                targetId,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    /**
     * Get all attachments from a conversation
     */
    @Get('/conversation/:targetId/attachments')
    @ApiOperation({summary: 'Get all attachments from a conversation with a friend'})
    @ApiParam({name: 'targetId', description: 'Target user ID'})
    @ApiQuery({type: PaginationDto})
    @ApiResponse({
        status: 200,
        description: 'Returns paginated attachments from the conversation',
        type: [MessageAttachment],
    })
    async getAllAttachmentsFromConversation(
        @CurrentUser() user,
        @Param('targetId') targetId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<MessageAttachment>> {
        return await lastValueFrom(
            this.communicationClient.send('GetAllAttachmentsFromConversationCommand', {
                currentId: user.id,
                targetId,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    /**
     * Get all mixed messages and attachments from a conversation
     */
    @Get('/conversation/:targetId/mixed')
    @ApiOperation({summary: 'Get all mixed messages and attachments from a conversation'})
    @ApiParam({name: 'targetId', description: 'Target user ID'})
    @ApiQuery({type: PaginationDto})
    @ApiResponse({
        status: 200,
        description: 'Returns paginated mixed content from the conversation',
    })
    async getMixedConversationContent(
        @CurrentUser() user,
        @Param('targetId') targetId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<any>> {
        return await lastValueFrom(
            this.communicationClient.send('GetMixedConversationContentCommand', {
                currentId: user.id,
                targetId,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    /**
     * Create a message attachment
     */
    @Post('/messsage/attachment')
    @ApiOperation({summary: 'Create a new message attachment'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                recipientId: {
                    type: 'string',
                    example: 'c88d5a3d-2f71-499c-b5be-bab40e6b75ad',
                },
                attachmentType: {
                    type: 'string',
                    enum: Object.values(AttachmentType),
                    example: AttachmentType.IMAGE,
                },
            },
            required: ['file', 'recipientId'],
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    @ApiResponse({
        status: 201,
        description: 'Attachment created successfully',
        type: MessageAttachment,
    })
    async createAttachment(
        @CurrentUser() user,
        @UploadedFile() file: Express.Multer.File,
        @Body('recipientId') recipientId: string,
        @Body('attachmentType') attachmentType: AttachmentType
    ): Promise<MessageAttachment> {
        // Send file data to the communication microservice for upload
        const fileUrl = await this.fileUploadService.uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            'communication'
        );

        // Create the message attachment with the uploaded file URL
        return await lastValueFrom(
            this.communicationClient.send('CreateAttachmentMessageCommand', {
                senderId: user.id,
                attachmentMessageDto: {
                    recipientId,
                    attachmentUrl: fileUrl,
                    attachmentName: file.originalname,
                    attachmentType,
                },
            })
        );
    }

    /**
     * Delete a message attachment
     */
    @Delete('/messsage/attachment/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({summary: 'Delete a message attachment'})
    @ApiParam({name: 'id', description: 'Attachment ID'})
    @ApiResponse({
        status: 204,
        description: 'Attachment deleted successfully',
    })
    async deleteAttachment(@Param('id') id: string, @CurrentUser() user): Promise<{success: boolean}> {
        return await lastValueFrom(this.communicationClient.send('DeleteAttachmentCommand', {id, currentId: user.id}));
    }

    /**
     * Mark an attachment as seen
     */
    @Post('/messsage/attachment/:id/seen')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({summary: 'Mark a message attachment as seen'})
    @ApiParam({name: 'id', description: 'Attachment ID'})
    @ApiResponse({
        status: 204,
        description: 'Attachment marked as seen successfully',
        type: MessageAttachment,
    })
    async markAttachmentAsSeen(@Param('id') id: string, @CurrentUser() user): Promise<MessageAttachment> {
        return await lastValueFrom(
            this.communicationClient.send('MarkAttachmentAsSeenCommand', {id, currentId: user.id})
        );
    }

    /**
     * Add reaction to an attachment
     */
    @Post('/messsage/attachment/:id/reaction')
    @ApiOperation({summary: 'Add a reaction to a message attachment'})
    @ApiParam({name: 'id', description: 'Attachment ID'})
    @ApiBody({type: EmoteReactionDto})
    @ApiResponse({
        status: 200,
        description: 'Reaction added successfully',
        type: MessageAttachment,
    })
    async addReactionToAttachment(
        @Param('id') id: string,
        @Body() emoteReactionDto: EmoteReactionDto,
        @CurrentUser() user
    ): Promise<MessageAttachment> {
        return await lastValueFrom(
            this.communicationClient.send('AddReactionToAttachmentCommand', {
                id,
                emoteReactionDto,
                currentId: user.id,
            })
        );
    }

    /**
     * Remove reaction from an attachment
     */
    @Delete('/messsage/attachment/:id/reaction')
    @ApiOperation({summary: 'Remove a reaction from a message attachment'})
    @ApiParam({name: 'id', description: 'Attachment ID'})
    @ApiResponse({
        status: 200,
        description: 'Reaction removed successfully',
        type: MessageAttachment,
    })
    async removeReactionFromAttachment(@Param('id') id: string, @CurrentUser() user): Promise<MessageAttachment> {
        return await lastValueFrom(
            this.communicationClient.send('RemoveReactionFromAttachmentCommand', {id, currentId: user.id})
        );
    }

    /**
     * Get a specific message
     */
    @Get('/messsage/:id')
    @ApiOperation({summary: 'Get a message by ID'})
    @ApiParam({name: 'id', description: 'Message ID'})
    @ApiResponse({
        status: 200,
        description: 'Message found',
        type: Message,
    })
    @ApiResponse({
        status: 404,
        description: 'Message not found',
    })
    async getMessage(@Param('id') id: string) {
        return await lastValueFrom(this.communicationClient.send('GetIdMessageCommand', {id}));
    }

    /**
     * Update message text
     */
    @Put('/messsage/:id')
    @ApiOperation({summary: 'Update message text'})
    @ApiParam({name: 'id', description: 'Message ID'})
    @ApiResponse({
        status: 200,
        description: 'Message updated successfully',
        type: Message,
    })
    async updateMessage(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
        return await lastValueFrom(this.communicationClient.send('UpdateMessageCommand', {id, updateMessageDto}));
    }

    /**
     * Delete a message
     */
    @Delete('/messsage/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({summary: 'Delete a message'})
    @ApiParam({name: 'id', description: 'Message ID'})
    @ApiResponse({
        status: 204,
        description: 'Message deleted successfully',
    })
    async deleteMessage(@Param('id') id: string, @CurrentUser() user): Promise<{success: boolean}> {
        return await lastValueFrom(this.communicationClient.send('DeleteMessageCommand', {id, currentId: user.id}));
    }

    /**
     * Mark a message as seen
     */
    @Post('/messsage/:id/seen')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({summary: 'Mark a message as seen'})
    @ApiResponse({
        status: 204,
        type: Message,
        description: 'Message marked as seen successfully',
    })
    @ApiParam({name: 'id', description: 'Message ID'})
    async markMessageAsSeen(@Param('id') id: string, @CurrentUser() user): Promise<Message> {
        return await lastValueFrom(this.communicationClient.send('MarkMessageAsSeenCommand', {id, currentId: user.id}));
    }

    /**
     * Add reaction/emotion to a message
     */
    @Post('/messsage/:id/reaction')
    @ApiOperation({summary: 'Add a reaction to a message'})
    @ApiParam({name: 'id', description: 'Message ID'})
    @ApiResponse({
        status: 200,
        description: 'Reaction added successfully',
        type: Message,
    })
    async addReaction(
        @Param('id') id: string,
        @Body() emoteReactionDto: EmoteReactionDto,
        @CurrentUser() user
    ): Promise<Message> {
        return await lastValueFrom(
            this.communicationClient.send('AddReactionCommand', {id, emoteReactionDto, currentId: user.id})
        );
    }

    /**
     * Change reaction emote on a message
     */
    @Put('/messsage/:id/reaction')
    @ApiOperation({summary: 'Change a reaction on a message'})
    @ApiParam({name: 'id', description: 'Message ID'})
    @ApiBody({type: EmoteReactionDto})
    @ApiResponse({
        status: 200,
        description: 'Reaction changed successfully',
        type: Message,
    })
    async changeReaction(
        @Param('id') id: string,
        @Body() emoteReactionDto: EmoteReactionDto,
        @CurrentUser() user
    ): Promise<Message> {
        return await lastValueFrom(
            this.communicationClient.send('ChangeReactionCommand', {id, emoteReactionDto, currentId: user.id})
        );
    }

    /**
     * Remove reaction from a message
     */
    @Delete('/messsage/:id/reaction')
    @ApiOperation({summary: 'Remove a reaction from a message'})
    @ApiParam({name: 'id', description: 'Message ID'})
    @ApiResponse({
        status: 200,
        description: 'Reaction removed successfully',
        type: Message,
    })
    async removeReaction(@Param('id') id: string, @CurrentUser() user): Promise<Message> {
        return await lastValueFrom(this.communicationClient.send('RemoveReactionCommand', {id, currentId: user.id}));
    }

    /**
     * Hide a message
     */
    @Put('/messsage/:id/hide')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({summary: 'Hide a message'})
    @ApiParam({name: 'id', description: 'Message ID'})
    @ApiResponse({
        status: 204,
        description: 'Message hidden successfully',
    })
    async hideMessage(@Param('id') id: string): Promise<{success: boolean}> {
        return await lastValueFrom(this.communicationClient.send('HideMessageCommand', {id}));
    }

    @Get('/groupchat')
    @ApiOperation({summary: 'Get all group chats of current user'})
    @ApiQuery({type: PaginationDto})
    @ApiResponse({
        status: 200,
        description: 'Returns paginated group chats',
        type: [GroupChat],
    })
    async getAllGroupChats(
        @CurrentUser() user,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<GroupChat>> {
        return await lastValueFrom(
            this.communicationClient.send('GetCurrentUserGroupChatsCommand', {
                userId: user.id,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Post('/groupchat')
    @ApiOperation({summary: 'Create a new group chat'})
    @ApiBody({
        description: 'Group chat name',
        required: true,
        type: String,
    })
    @ApiResponse({
        status: 201,
        description: 'Group chat created successfully',
        type: GroupChat,
    })
    async createGroupChat(@CurrentUser() user, @Body() groupName: string): Promise<GroupChat> {
        return await lastValueFrom(
            this.communicationClient.send('CreateGroupChatCommand', {userId: user.id, groupName})
        );
    }

    @Get('/groupchat/messages/:groupChatId')
    @ApiOperation({summary: 'Get all messages from a group chat'})
    @ApiParam({name: 'groupChatId', description: 'Group chat ID'})
    @ApiQuery({type: PaginationDto})
    @ApiResponse({
        status: 200,
        description: 'Returns paginated messages from the group chat',
        type: [Message],
    })
    async getAllMessagesFromGroupChat(
        @Param('groupChatId') groupChatId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<Message>> {
        return await lastValueFrom(
            this.communicationClient.send('GetAllMessageFromGroupChatCommand', {
                groupChatId,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Post('/groupchat/message/')
    @ApiOperation({summary: 'Send a message to group chat'})
    @ApiBody({
        description: 'Message Text',
        type: CreateGroupMessageDto,
    })
    @ApiResponse({
        status: 201,
        description: 'Message sent to group chat successfully',
    })
    async sendMessageToGroupChat(@CurrentUser() user, @Body() createGroupMessageDto: CreateGroupMessageDto) {
        return await lastValueFrom(
            this.communicationClient.send('SendMessageToGroupChatCommand', {
                userId: user.id,
                groupChatId: createGroupMessageDto.groupChatId,
                textMessage: createGroupMessageDto.messageText,
            })
        );
    }

    // Get All users in a group chat
    @Get('/groupchat/users/:groupChatId/')
    @ApiOperation({summary: 'Get all users in a group chat'})
    @ApiParam({name: 'groupChatId', description: 'Group chat ID'})
    @ApiResponse({
        status: 200,
        description: 'Returns all users in the group chat',
        type: [UserReference],
    })
    @ApiQuery({type: PaginationDto})
    async getAllUsersInGroupChat(
        @Param('groupChatId') groupChatId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<UserReference[]> {
        return await lastValueFrom(
            this.communicationClient.send('GetAllUsersInGroupChatCommand', {
                groupChatId,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    // Add a user to a group chat\
    @Post('/groupchat/user/:groupChatId')
    @ApiOperation({summary: 'Add a user to a group chat'})
    @ApiParam({name: 'groupChatId', description: 'Group chat ID'})
    @ApiBody({
        description: 'User ID',
        type: AddUserGroupChatDto,
    })
    @ApiResponse({
        status: 201,
        description: 'User added to group chat successfully',
    })
    async addUserToGroupChat(
        @Body() addUserGroupChatDto: AddUserGroupChatDto,
        @Param('groupChatId') groupChatId: string
    ): Promise<GroupChat> {
        return await lastValueFrom(
            this.communicationClient.send('AddUserToGroupChatCommand', {
                userId: addUserGroupChatDto.userId,
                groupChatId,
            })
        );
    }

    /**
     * Create a groupchat attachment
     */
    @Post('/groupchat/attachment')
    @ApiOperation({summary: 'Create a new groupchat attachment'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                groupChatId: {
                    type: 'string',
                    example: 'c88d5a3d-2f71-499c-b5be-bab40e6b75ad',
                },
                attachmentType: {
                    type: 'string',
                    enum: Object.values(AttachmentType),
                    example: AttachmentType.IMAGE,
                },
            },
            required: ['file', 'groupChatId'],
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    @ApiResponse({
        status: 201,
        description: 'Attachment created successfully',
        type: GroupChatAttachment,
    })
    async createGroupChatAttachment(
        @CurrentUser() user,
        @UploadedFile() file: Express.Multer.File,
        @Body('groupChatId') groupChatId: string,
        @Body('attachmentType') attachmentType: AttachmentType
    ): Promise<GroupChatAttachment> {
        // Send file data to the communication microservice for upload
        const fileUrl = await this.fileUploadService.uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            'communication'
        );

        // Create the message attachment with the uploaded file URL
        return await lastValueFrom(
            this.communicationClient.send('CreateAttachmentMessageGroupChatCommand', {
                senderId: user.id,
                attachmentMessageDto: {
                    groupChatId,
                    attachmentUrl: fileUrl,
                    attachmentName: file.originalname,
                    attachmentType,
                },
            })
        );
    }

    // Get GroupChat by ID
    @Get('/groupchat/:groupChatId')
    @ApiOperation({summary: 'Get a group chat by ID'})
    @ApiParam({name: 'groupChatId', description: 'Group chat ID'})
    @ApiResponse({
        status: 200,
        description: 'Group chat found',
        type: GroupChat,
    })
    @ApiResponse({
        status: 404,
        description: 'Group chat not found',
    })
    async getGroupChat(@Param('groupChatId') groupChatId: string) {
        return await lastValueFrom(this.communicationClient.send('GetGroupChatByIdCommand', {groupChatId}));
    }

    // Leave a group chat
    @Post('/groupchat/leave/:groupChatId')
    @ApiOperation({summary: 'Leave a group chat'})
    @ApiParam({name: 'groupChatId', description: 'Group chat ID'})
    @ApiResponse({
        status: 200,
        description: 'Left group chat successfully',
        type: GroupChat,
    })
    async leaveGroupChat(@Param('groupChatId') groupChatId: string, @CurrentUser() user): Promise<GroupChat> {
        return await lastValueFrom(
            this.communicationClient.send('LeaveGroupChatCommand', {userId: user.id, groupChatId})
        );
    }
}
