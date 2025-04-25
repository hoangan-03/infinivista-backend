import {
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Param,
    Patch,
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
import {lastValueFrom} from 'rxjs';

import {CurrentUser} from '@/decorators/user.decorator';
import {PaginationDto} from '@/dtos/common/pagination.dto';
import {Comment} from '@/entities/feed-module/local/comment.entity';
import {UserReactStory} from '@/entities/feed-module/local/user-react-story.entity';
import {ReactionType} from '@/enums/feed-module/reaction-type.enum';
import {JWTAuthGuard} from '@/guards/jwt-auth.guard';
import {JwtBlacklistGuard} from '@/guards/jwt-blacklist.guard';
import {PaginationResponseInterface} from '@/interfaces/common/pagination-response.interface';
import {FileUploadService} from '@/services/file-upload.service';

@ApiTags('Story')
@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard, JWTAuthGuard)
@Controller('story')
export class StoryController {
    constructor(
        @Inject('FEED_SERVICE') private feedClient: ClientProxy,
        private fileUploadService: FileUploadService
    ) {}

    // Story Comment endpoints
    @Post(':storyId/comment')
    @ApiOperation({summary: 'Add a comment to a story'})
    @ApiParam({name: 'storyId', description: 'ID of the story'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                text: {type: 'string', example: 'This is a story comment'},
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
            required: ['text'],
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    @ApiResponse({status: 201, description: 'Comment created successfully', type: Comment})
    async createStoryComment(
        @CurrentUser() user,
        @Param('storyId') storyId: string,
        @Body('text') text: string,
        @UploadedFile() file?: Express.Multer.File
    ): Promise<Comment> {
        let attachmentUrl;

        // Only upload if a file was provided
        if (file) {
            attachmentUrl = await this.fileUploadService.uploadFile(
                file.buffer,
                file.originalname,
                file.mimetype,
                'feed'
            );
        }

        return await lastValueFrom(
            this.feedClient.send('CreateStoryCommentCommand', {
                storyId,
                userId: user.id,
                text,
                attachmentUrl,
            })
        );
    }

    @Get(':storyId/comments')
    @ApiOperation({summary: 'Get paginated comments for a story'})
    @ApiParam({name: 'storyId', description: 'ID of the story'})
    @ApiQuery({type: PaginationDto})
    @ApiResponse({status: 200, description: 'List of comments', type: [Comment]})
    @ApiResponse({status: 404, description: 'Story not found'})
    async getCommentsByStoryId(
        @Param('storyId') storyId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<Comment>> {
        return await lastValueFrom(
            this.feedClient.send('GetCommentsByStoryIdCommand', {
                storyId,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Patch('comment/:commentId')
    @ApiOperation({summary: 'Update a comment on a story'})
    @ApiParam({name: 'commentId', description: 'ID of the comment'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                text: {type: 'string'},
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
            required: ['text'],
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    @ApiResponse({status: 200, description: 'Comment updated successfully', type: Comment})
    @ApiResponse({status: 404, description: 'Comment not found'})
    async updateStoryComment(
        @CurrentUser() user,
        @Param('commentId') commentId: string,
        @Body('text') text: string,
        @UploadedFile() file?: Express.Multer.File
    ): Promise<Comment> {
        let attachmentUrl;

        // Only upload if a file was provided
        if (file) {
            attachmentUrl = await this.fileUploadService.uploadFile(
                file.buffer,
                file.originalname,
                file.mimetype,
                'feed'
            );
        }

        return await lastValueFrom(
            this.feedClient.send('UpdateStoryCommentCommand', {
                commentId,
                userId: user.id,
                text,
                attachmentUrl,
            })
        );
    }

    @Delete('comment/:commentId')
    @ApiOperation({summary: 'Delete a comment on a story'})
    @ApiParam({name: 'commentId', description: 'ID of the comment'})
    @ApiResponse({status: 200, description: 'Comment deleted successfully'})
    @ApiResponse({status: 404, description: 'Comment not found'})
    async deleteStoryComment(@CurrentUser() user, @Param('commentId') commentId: string): Promise<Comment> {
        return await lastValueFrom(
            this.feedClient.send('DeleteStoryCommentCommand', {
                commentId,
                userId: user.id,
            })
        );
    }

    // Story Reaction endpoints
    @Post(':storyId/reaction')
    @ApiOperation({summary: 'Add a reaction to a story'})
    @ApiParam({name: 'storyId', description: 'ID of the story'})
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                reactionType: {
                    type: 'string',
                    enum: Object.values(ReactionType),
                    example: ReactionType.LIKE,
                },
            },
            required: ['reactionType'],
        },
    })
    @ApiResponse({status: 201, description: 'Reaction added successfully'})
    @ApiResponse({status: 404, description: 'Story not found'})
    async addStoryReaction(
        @CurrentUser() user,
        @Param('storyId') storyId: string,
        @Body('reactionType') reactionType: ReactionType
    ): Promise<UserReactStory> {
        return await lastValueFrom(
            this.feedClient.send('AddStoryReactionCommand', {
                userId: user.id,
                storyId,
                reactionType,
            })
        );
    }

    @Get(':storyId/reactions')
    @ApiOperation({summary: 'Get all reactions for a story'})
    @ApiParam({name: 'storyId', description: 'ID of the story'})
    @ApiResponse({status: 200, description: 'List of reactions', type: [UserReactStory]})
    async getReactionsByStoryId(@Param('storyId') storyId: string): Promise<UserReactStory[]> {
        return await lastValueFrom(this.feedClient.send('GetReactionsByStoryIdCommand', {storyId}));
    }

    @Delete(':storyId/reaction')
    @ApiOperation({summary: 'Remove your reaction from a story'})
    @ApiParam({name: 'storyId', description: 'ID of the story'})
    @ApiResponse({status: 200, description: 'Reaction removed successfully'})
    @ApiResponse({status: 404, description: 'Reaction not found'})
    async removeStoryReaction(@CurrentUser() user, @Param('storyId') storyId: string): Promise<{success: boolean}> {
        return await lastValueFrom(
            this.feedClient.send('RemoveStoryReactionCommand', {
                storyId,
                userId: user.id,
            })
        );
    }

    @Get(':storyId/reaction-counts')
    @ApiOperation({summary: 'Get reaction counts by type for a story'})
    @ApiParam({name: 'storyId', description: 'ID of the story'})
    @ApiResponse({status: 200, description: 'Reaction counts by type', type: Object})
    @ApiResponse({status: 404, description: 'Story not found'})
    async getStoryReactionCountByType(@Param('storyId') storyId: string): Promise<Record<ReactionType, number>> {
        return await lastValueFrom(this.feedClient.send('GetStoryReactionCountByTypeCommand', {storyId}));
    }
}
