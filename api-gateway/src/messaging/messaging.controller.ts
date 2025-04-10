import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Post, Put, UseGuards} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags} from '@nestjs/swagger';
import {lastValueFrom} from 'rxjs';

import {CurrentUser} from '@/decorators/user.decorator';
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
     * Get all messages
     */
    @Get('')
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
    @Post('')
    @UseGuards(JWTAuthGuard)
    @ApiOperation({summary: 'Create a new message'})
    @ApiBody({
        description: 'Message Text',
        type: String,
    })
    @ApiResponse({
        status: 201,
        description: 'Message created successfully',
        type: Message,
    })
    async createMessage(@CurrentUser() user, createMessageDto: CreateMessageDto) {
        return await lastValueFrom(
            this.communicationClient.send('CreateMessageCommand', {senderId: user.id, createMessageDto})
        );
    }

    /**
     * Get a specific message
     */
    @Get('/:id')
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
    @Put('/:id')
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
    @Post('/:id/reaction')
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
    @Put('/:id/hide')
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
    @Delete('/:id')
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
