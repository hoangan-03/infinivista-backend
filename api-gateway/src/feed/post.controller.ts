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
import {UserReactPost} from '@/entities/feed-module/local/user-react-post.entity';
import {ReactionType} from '@/enums/feed-module/reaction-type.enum';
import {JWTAuthGuard} from '@/guards/jwt-auth.guard';
import {JwtBlacklistGuard} from '@/guards/jwt-blacklist.guard';
import {PaginationResponseInterface} from '@/interfaces/common/pagination-response.interface';
import {FileUploadService} from '@/services/file-upload.service';

@ApiTags('Post')
@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard, JWTAuthGuard)
@Controller('post')
export class PostController {
    constructor(
        @Inject('FEED_SERVICE') private feedClient: ClientProxy,
        private fileUploadService: FileUploadService
    ) {}

    // Comment endpoints
    @Post(':postId/comment')
    @ApiOperation({summary: 'Add a comment to a post'})
    @ApiParam({name: 'postId', description: 'ID of the post'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                text: {type: 'string', example: 'This is a comment'},
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
    async createComment(
        @CurrentUser() user,
        @Param('postId') postId: string,
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
            this.feedClient.send('CreateCommentCommand', {
                postId,
                userId: user.id,
                text,
                attachmentUrl,
            })
        );
    }

    @Get(':postId/comments')
    @ApiOperation({summary: 'Get paginated comments for a post'})
    @ApiParam({name: 'postId', description: 'ID of the post'})
    @ApiQuery({type: PaginationDto})
    @ApiResponse({status: 200, description: 'List of comments', type: [Comment]})
    @ApiResponse({status: 404, description: 'Post not found'})
    async getCommentsByPostId(
        @Param('postId') postId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<Comment>> {
        return await lastValueFrom(
            this.feedClient.send('GetCommentsByPostIdCommand', {
                postId,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Patch('comment/:commentId')
    @ApiOperation({summary: 'Update a comment'})
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
    async updateComment(
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
            this.feedClient.send('UpdateCommentCommand', {
                commentId,
                userId: user.id,
                text,
                attachmentUrl,
            })
        );
    }

    @Delete('comment/:commentId')
    @ApiOperation({summary: 'Delete a comment'})
    @ApiParam({name: 'commentId', description: 'ID of the comment'})
    @ApiResponse({status: 200, description: 'Comment deleted successfully'})
    @ApiResponse({status: 404, description: 'Comment not found'})
    async deleteComment(@CurrentUser() user, @Param('commentId') commentId: string): Promise<Comment> {
        return await lastValueFrom(
            this.feedClient.send('DeleteCommentCommand', {
                commentId,
                userId: user.id,
            })
        );
    }

    // Reaction endpoints
    @Post(':postId/reaction')
    @ApiOperation({summary: 'Add a reaction to a post'})
    @ApiParam({name: 'postId', description: 'ID of the post'})
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
    @ApiResponse({status: 404, description: 'Post not found'})
    async addReaction(
        @CurrentUser() user,
        @Param('postId') postId: string,
        @Body('reactionType') reactionType: ReactionType
    ): Promise<UserReactPost> {
        return await lastValueFrom(
            this.feedClient.send('AddReactionCommand', {
                userId: user.id,
                postId,
                reactionType,
            })
        );
    }

    @Get(':postId/reactions')
    @ApiOperation({summary: 'Get all reactions for a post'})
    @ApiParam({name: 'postId', description: 'ID of the post'})
    @ApiResponse({status: 200, description: 'List of reactions', type: [UserReactPost]})
    async getReactionsByPostId(@Param('postId') postId: string): Promise<UserReactPost[]> {
        return await lastValueFrom(this.feedClient.send('GetReactionsByPostIdCommand', {postId}));
    }

    @Delete(':postId/reaction')
    @ApiOperation({summary: 'Remove your reaction from a post'})
    @ApiParam({name: 'postId', description: 'ID of the post'})
    @ApiResponse({status: 200, description: 'Reaction removed successfully'})
    @ApiResponse({status: 404, description: 'Reaction not found'})
    async removeReaction(@CurrentUser() user, @Param('postId') postId: string): Promise<{success: boolean}> {
        return await lastValueFrom(
            this.feedClient.send('RemoveReactionCommand', {
                postId,
                userId: user.id,
            })
        );
    }

    @Get(':postId/reaction-counts')
    @ApiOperation({summary: 'Get reaction counts by type for a post'})
    @ApiParam({name: 'postId', description: 'ID of the post'})
    @ApiResponse({status: 200, description: 'Reaction counts by type', type: Object})
    @ApiResponse({status: 404, description: 'Post not found'})
    async getReactionCountByType(@Param('postId') postId: string): Promise<Record<ReactionType, number>> {
        return await lastValueFrom(this.feedClient.send('GetReactionCountByTypeCommand', {postId}));
    }

    // Share post endpoints
    @Post(':postId/share')
    @ApiOperation({summary: "Share a post to user's newsfeed"})
    @ApiParam({name: 'postId', description: 'ID of the post to share'})
    @ApiResponse({status: 201, description: 'Post shared successfully'})
    @ApiResponse({status: 404, description: 'Post not found'})
    async sharePost(@CurrentUser() user, @Param('postId') postId: string): Promise<any> {
        return await lastValueFrom(
            this.feedClient.send('SharePostCommand', {
                userId: user.id,
                postId,
            })
        );
    }

    @Get('shared/by-user/:userId')
    @ApiOperation({summary: 'Get posts shared by a specific user'})
    @ApiParam({name: 'userId', description: 'ID of the user'})
    @ApiQuery({type: PaginationDto})
    @ApiResponse({status: 200, description: 'List of shared posts'})
    async getSharedPostsByUser(
        @Param('userId') userId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<any>> {
        return await lastValueFrom(
            this.feedClient.send('GetSharedPostsByUserCommand', {
                userId,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }
}
