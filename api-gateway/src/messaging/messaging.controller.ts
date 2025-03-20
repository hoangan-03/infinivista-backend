// import {
//     Body,
//     Controller,
//     Delete,
//     Get,
//     HttpCode,
//     HttpStatus,
//     NotFoundException,
//     Param,
//     Post,
//     Put,
//     Render,
//     UseGuards,
// } from '@nestjs/common';
// import {ApiOperation, ApiParam, ApiResponse, ApiTags} from '@nestjs/swagger';

// import {Message} from '@/entities/message.entity';
// import {MessageText} from '@/entities/message-text.entity';
// import {CreateMessageDto} from '@/modules/messaging/dto/create-message.dto';
// import {UpdateMessageDto} from '@/modules/messaging/dto/update-message.dto';

// import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
// import {EmoteReactionDto} from './dto/emote-reaction.dto';
// import {MessageStatus} from './enums/message-status.enum';
// import {MessageType} from './enums/message-type.enum';
// import {MessagingService} from './messaging.service';

// @ApiTags('messaging')
// @Controller()
// export class MessagingController {
//     constructor(private readonly messageService: MessagingService) {}

//     /**
//      * Render chat interface
//      */
//     @Get('/chat')
//     @Render('index')
//     @ApiOperation({summary: 'Render chat interface'})
//     Home() {
//         return;
//     }

//     /**
//      * Get all messages
//      */
//     @Get('/api/chat')
//     @ApiOperation({summary: 'Get all messages'})
//     @ApiResponse({
//         status: 200,
//         description: 'Returns all messages',
//         type: [Message],
//     })
//     async getAllMessages() {
//         return await this.messageService.getMessages();
//     }

//     /**
//      * Create a new message
//      */
//     @Post('/api/chat/messages')
//     @UseGuards(JwtAuthGuard)
//     @ApiOperation({summary: 'Create a new message'})
//     @ApiResponse({
//         status: 201,
//         description: 'Message created successfully',
//         type: Message,
//     })
//     async createMessage(@Body() createMessageDto: CreateMessageDto) {
//         // Create a new message entity
//         const message = new Message();
//         message.type = createMessageDto.type;
//         message.status = createMessageDto.status || MessageStatus.SENT;
//         message.sent_at = new Date();

//         // Save the message first
//         const savedMessage = await this.messageService.createMessage(message);

//         // If it's a text message, create the text content
//         if (createMessageDto.type === MessageType.TEXT && createMessageDto.text) {
//             // Create text content
//             const textMessage = new MessageText();
//             textMessage.text = createMessageDto.text;
//             textMessage.message = savedMessage;

//             // This will handle saving the text and updating the message relation
//             await this.messageService.updateMessage(savedMessage.id.toString(), createMessageDto.text);
//         }

//         // Return the created message
//         return savedMessage;
//     }

//     /**
//      * Get a specific message
//      */
//     @Get('/api/chat/messages/:id')
//     @ApiOperation({summary: 'Get a message by ID'})
//     @ApiParam({name: 'id', description: 'Message ID'})
//     @ApiResponse({
//         status: 200,
//         description: 'Message found',
//         type: Message,
//     })
//     @ApiResponse({
//         status: 404,
//         description: 'Message not found',
//     })
//     async getMessage(@Param('id') id: string) {
//         const message = await this.messageService.getMessageById(id);
//         if (!message) {
//             throw new NotFoundException(`Message with ID ${id} not found`);
//         }
//         return message;
//     }

//     /**
//      * Update message text
//      */
//     @Put('/api/chat/messages/:id')
//     @UseGuards(JwtAuthGuard)
//     @ApiOperation({summary: 'Update message text'})
//     @ApiParam({name: 'id', description: 'Message ID'})
//     @ApiResponse({
//         status: 200,
//         description: 'Message updated successfully',
//     })
//     async updateMessage(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
//         return await this.messageService.updateMessage(id, updateMessageDto.text);
//     }

//     /**
//      * Add reaction/emotion to a message
//      */
//     @Post('/api/chat/messages/:id/reaction')
//     @UseGuards(JwtAuthGuard)
//     @ApiOperation({summary: 'Add a reaction to a message'})
//     @ApiParam({name: 'id', description: 'Message ID'})
//     @ApiResponse({
//         status: 200,
//         description: 'Reaction added successfully',
//     })
//     async addReaction(@Param('id') id: string, @Body() emoteReactionDto: EmoteReactionDto) {
//         return await this.messageService.dropEmote(emoteReactionDto.emotion, id);
//     }

//     /**
//      * Hide a message
//      */
//     @Put('/api/chat/messages/:id/hide')
//     @UseGuards(JwtAuthGuard)
//     @HttpCode(HttpStatus.NO_CONTENT)
//     @ApiOperation({summary: 'Hide a message'})
//     @ApiParam({name: 'id', description: 'Message ID'})
//     @ApiResponse({
//         status: 204,
//         description: 'Message hidden successfully',
//     })
//     async hideMessage(@Param('id') id: string) {
//         return await this.messageService.hiddenMessage(id);
//     }

//     /**
//      * Delete a message
//      */
//     @Delete('/api/chat/messages/:id')
//     @UseGuards(JwtAuthGuard)
//     @HttpCode(HttpStatus.NO_CONTENT)
//     @ApiOperation({summary: 'Delete a message'})
//     @ApiParam({name: 'id', description: 'Message ID'})
//     @ApiResponse({
//         status: 204,
//         description: 'Message deleted successfully',
//     })
//     async deleteMessage(@Param('id') id: string) {
//         return await this.messageService.deleteMessage(id);
//     }
// }
