import {
    Body,
    Controller,
    Get,
    Inject,
    Param,
    Post,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
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
import {UserReference} from '@/entities/communication-module/external/user-reference.entity';
import {GroupChat} from '@/entities/communication-module/internal/group-chat.entity';
import {GroupChatAttachment} from '@/entities/communication-module/internal/group-chat-attachment.entity';
import {Message} from '@/entities/communication-module/internal/message.entity';
import {AttachmentType} from '@/enums/communication-module/attachment-type.enum';
import {JWTAuthGuard} from '@/guards/jwt-auth.guard';
import {JwtBlacklistGuard} from '@/guards/jwt-blacklist.guard';
import {PaginationResponseInterface} from '@/interfaces/common/pagination-response.interface';
import {FileUploadService} from '@/services/file-upload.service';

@ApiTags('Groupchat')
@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard, JWTAuthGuard)
@Controller('groupchat')
export class GroupChatController {
    constructor(
        @Inject('COMMUNICATION_SERVICE') private communicationClient: ClientProxy,
        private fileUploadService: FileUploadService
    ) {}

    @Get('')
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

    @Post('')
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

    @Get('/messages/:groupChatId')
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

    @Post('/message/')
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
    @Get('/users/:groupChatId/')
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
    @Post('/user/:groupChatId')
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
    @Post('/attachment')
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
    @Get('/:groupChatId')
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
    @Post('/leave/:groupChatId')
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
