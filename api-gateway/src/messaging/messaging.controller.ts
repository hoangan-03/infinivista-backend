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
    Render,
    UseGuards,
} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags} from '@nestjs/swagger';
import {lastValueFrom} from 'rxjs';

import {CreateMessageDto} from '@/dtos/communication-module/create-message.dto';
import {EmoteReactionDto} from '@/dtos/communication-module/emote-reaction.dto';
import {UpdateMessageDto} from '@/dtos/communication-module/update-message.dto';
import {Message} from '@/entities/communication-module/internal/message.entity';
import {JWTAuthGuard} from '@/guards/jwt-auth.guard';
import {JwtBlacklistGuard} from '@/guards/jwt-blacklist.guard';

@ApiTags('Messaging')
@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard, JWTAuthGuard)
@Controller('messaging')
export class MessagingController {
    constructor(@Inject('COMMUNICATION_SERVICE') private communicationClient: ClientProxy) {}

    /**
     * Render chat interface
     */
    @Get('/chat')
    @Render('index')
    @ApiOperation({summary: 'Render chat interface'})
    Home() {
        return;
    }

    /**
     * Get all messages
     */
    @Get('/api/chat')
    @ApiOperation({summary: 'Get all messages'})
    @ApiResponse({
        status: 200,
        description: 'Returns all messages',
        type: [Message],
    })
    async getAllMessages() {
        return await lastValueFrom(this.communicationClient.send('GetAllMessageCommand', {}));
    }

    /**
     * Create a new message
     */
    @Post('/api/chat/messages')
    @UseGuards(JWTAuthGuard)
    @ApiOperation({summary: 'Create a new message'})
    @ApiResponse({
        status: 201,
        description: 'Message created successfully',
        type: Message,
    })
    async createMessage(@Body() createMessageDto: CreateMessageDto) {
        return await lastValueFrom(this.communicationClient.send('CreateMessageCommand', {createMessageDto}));
    }

    /**
     * Get a specific message
     */
    @Get('/api/chat/messages/:id')
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
    @Put('/api/chat/messages/:id')
    @UseGuards(JWTAuthGuard)
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
     * Add reaction/emotion to a message
     */
    @Post('/api/chat/messages/:id/reaction')
    @UseGuards(JWTAuthGuard)
    @ApiOperation({summary: 'Add a reaction to a message'})
    @ApiParam({name: 'id', description: 'Message ID'})
    @ApiResponse({
        status: 200,
        description: 'Reaction added successfully',
        type: Message,
    })
    async addReaction(@Param('id') id: string, @Body() emoteReactionDto: EmoteReactionDto) {
        return await lastValueFrom(this.communicationClient.send('AddReactionCommand', {id, emoteReactionDto}));
    }

    /**
     * Hide a message
     */
    @Put('/api/chat/messages/:id/hide')
    @UseGuards(JWTAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({summary: 'Hide a message'})
    @ApiParam({name: 'id', description: 'Message ID'})
    @ApiResponse({
        status: 204,
        description: 'Message hidden successfully',
    })
    async hideMessage(@Param('id') id: string) {
        return await lastValueFrom(this.communicationClient.send('HideMessageCommand', {id}));
    }

    /**
     * Delete a message
     */
    @Delete('/api/chat/messages/:id')
    @UseGuards(JWTAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({summary: 'Delete a message'})
    @ApiParam({name: 'id', description: 'Message ID'})
    @ApiResponse({
        status: 204,
        description: 'Message deleted successfully',
    })
    async deleteMessage(@Param('id') id: string) {
        return await lastValueFrom(this.communicationClient.send('DeleteMessageCommand', {id}));
    }
}
