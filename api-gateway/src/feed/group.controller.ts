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
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {FileInterceptor, FilesInterceptor} from '@nestjs/platform-express';
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
import {UploadFileDto} from '@/dtos/common/upload-file.dto';
import {CreateGroupDto} from '@/dtos/feed-module/create-group.dto';
import {CreatePostDto} from '@/dtos/feed-module/create-post.dto';
import {UpdateGroupDto} from '@/dtos/feed-module/update-group.dto';
import {UserReference} from '@/entities/communication-module/external/user-reference.entity';
import {Group} from '@/entities/feed-module/local/group.entity';
import {GroupRule} from '@/entities/feed-module/local/group-rule.entity';
import {Post as PostEntity} from '@/entities/feed-module/local/post.entity';
import {AttachmentType} from '@/enums/feed-module/attachment-type.enum';
import {JWTAuthGuard} from '@/guards/jwt-auth.guard';
import {JwtBlacklistGuard} from '@/guards/jwt-blacklist.guard';
import {PaginationResponseInterface} from '@/interfaces/common/pagination-response.interface';
import {FileUploadService} from '@/services/file-upload.service';

@ApiTags('Group')
@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard, JWTAuthGuard)
@Controller('group')
export class GroupController {
    constructor(
        @Inject('FEED_SERVICE') private feedClient: ClientProxy,
        private fileUploadService: FileUploadService
    ) {}

    @Get('')
    @ApiOperation({summary: 'Get all groups in the system'})
    @ApiQuery({type: PaginationDto})
    async getAllGroups(@Query() paginationDto: PaginationDto): Promise<PaginationResponseInterface<Group>> {
        return await lastValueFrom(
            this.feedClient.send('GetAllGroups', {
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Post('')
    @ApiOperation({summary: 'Create a new group'})
    @ApiBody({type: CreateGroupDto})
    @ApiResponse({status: 201, description: 'Group created successfully', type: Group})
    async createGroup(@CurrentUser() user, @Body() groupData: CreateGroupDto): Promise<Group> {
        return await lastValueFrom(
            this.feedClient.send('CreateGroup', {
                ownerId: user.id,
                groupData,
            })
        );
    }

    @Post('create-post')
    @ApiOperation({summary: 'Create a post in a group'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'Content of the post',
                    example: 'This is a sample post content',
                },
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                },
                groupId: {
                    type: 'string',
                    description: 'ID of the group',
                    example: 'bc9656c4-f39a-4e12-87ab-39e438acab05',
                },
                attachmentTypes: {
                    type: 'string',
                    description: 'Comma-separated list of attachment types',
                    example: AttachmentType.IMAGE + ',' + AttachmentType.VIDEO,
                },
            },
            required: ['content', 'groupId'],
        },
    })
    @UseInterceptors(FilesInterceptor('files', 10))
    @ApiResponse({status: 201, description: 'Post created successfully', type: PostEntity})
    async createGroupPost(
        @CurrentUser() user,
        @Body('content') content: string,
        @Body('groupId') groupId: string,
        @Body('attachmentTypes') attachmentTypesStr: string,
        @UploadedFiles() files: Array<Express.Multer.File>
    ): Promise<PostEntity> {
        // Verify user is a member of the group
        await lastValueFrom(this.feedClient.send('GetGroupById', {id: groupId}));

        const attachmentTypes: AttachmentType[] = attachmentTypesStr
            ? attachmentTypesStr.split(',').map((type) => type.trim() as AttachmentType)
            : [];

        const fileUploadResponses: Array<{url: string; fileName: string; mimeType: string}> = [];

        // Upload each file to Google Drive if files exist
        if (files && files.length > 0) {
            for (const file of files) {
                const fileUrl = await this.fileUploadService.uploadFile(
                    file.buffer,
                    file.originalname,
                    file.mimetype,
                    'feed'
                );

                fileUploadResponses.push({
                    url: fileUrl,
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                });
            }
        }

        const postData: CreatePostDto = {
            content,
        };

        return await lastValueFrom(
            this.feedClient.send('CreateGroupPost', {
                userId: user.id,
                groupId,
                postData,
                files: fileUploadResponses,
                attachmentType: attachmentTypes,
            })
        );
    }

    @Get('/my-groups')
    @ApiOperation({summary: 'Get groups owned or joined by the user'})
    @ApiQuery({type: PaginationDto})
    async getMyGroups(
        @CurrentUser() user,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<Group>> {
        return await lastValueFrom(
            this.feedClient.send('GetMyGroups', {
                userId: user.id,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Get(':id')
    @ApiOperation({summary: 'Get group by ID'})
    @ApiParam({name: 'id', type: String, description: 'Group ID'})
    @ApiResponse({status: 200, type: Group})
    @ApiResponse({status: 404, description: 'Group not found'})
    async getGroupById(@Param('id') id: string): Promise<Group> {
        return await lastValueFrom(this.feedClient.send('GetGroupById', {id}));
    }

    @Patch(':id')
    @ApiOperation({summary: 'Update group information'})
    @ApiParam({name: 'id', description: 'Group ID'})
    @ApiBody({type: UpdateGroupDto})
    @ApiResponse({status: 200, description: 'Group updated successfully', type: Group})
    async updateGroup(
        @CurrentUser() user,
        @Param('id') groupId: string,
        @Body() updateData: UpdateGroupDto
    ): Promise<Group> {
        return await lastValueFrom(
            this.feedClient.send('UpdateGroup', {
                userId: user.id,
                groupId,
                updateData,
            })
        );
    }

    @Delete(':id')
    @ApiOperation({summary: 'Delete a group'})
    @ApiParam({name: 'id', description: 'Group ID'})
    @ApiResponse({status: 200, description: 'Group deleted successfully'})
    async deleteGroup(@CurrentUser() user, @Param('id') groupId: string): Promise<{success: boolean}> {
        return await lastValueFrom(
            this.feedClient.send('DeleteGroup', {
                userId: user.id,
                groupId,
            })
        );
    }

    @Post(':id/join')
    @ApiOperation({summary: 'Join a group'})
    @ApiParam({name: 'id', description: 'Group ID'})
    @ApiResponse({status: 200, description: 'Group joined successfully'})
    async joinGroup(@CurrentUser() user, @Param('id') groupId: string): Promise<{success: boolean}> {
        return await lastValueFrom(
            this.feedClient.send('JoinGroup', {
                userId: user.id,
                groupId,
            })
        );
    }

    @Delete(':id/leave')
    @ApiOperation({summary: 'Leave a group'})
    @ApiParam({name: 'id', description: 'Group ID'})
    @ApiResponse({status: 200, description: 'Group left successfully'})
    async leaveGroup(@CurrentUser() user, @Param('id') groupId: string): Promise<{success: boolean}> {
        return await lastValueFrom(
            this.feedClient.send('LeaveGroup', {
                userId: user.id,
                groupId,
            })
        );
    }

    @Get(':id/members')
    @ApiOperation({summary: 'Get members of a group'})
    @ApiParam({name: 'id', description: 'Group ID'})
    @ApiQuery({type: PaginationDto})
    @ApiResponse({status: 200, description: 'List of group members'})
    async getGroupMembers(
        @Param('id') groupId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<UserReference>> {
        return await lastValueFrom(
            this.feedClient.send('GetGroupMembers', {
                groupId,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Get(':id/posts')
    @ApiOperation({summary: 'Get posts from a group'})
    @ApiParam({name: 'id', description: 'Group ID'})
    @ApiQuery({type: PaginationDto})
    @ApiResponse({status: 200, description: 'List of group posts'})
    async getGroupPosts(
        @Param('id') groupId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<PostEntity>> {
        return await lastValueFrom(
            this.feedClient.send('GetGroupPosts', {
                groupId,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Post(':id/profile-image')
    @ApiOperation({summary: 'Upload group profile image'})
    @ApiParam({name: 'id', description: 'Group ID'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({type: UploadFileDto})
    @UseInterceptors(FileInterceptor('file'))
    @ApiResponse({status: 200, description: 'Profile image uploaded successfully'})
    async uploadProfileImage(
        @CurrentUser() user,
        @Param('id') groupId: string,
        @UploadedFile() file: Express.Multer.File
    ): Promise<Group> {
        const url = await this.fileUploadService.uploadFile(file.buffer, file.originalname, file.mimetype, 'feed');

        return await lastValueFrom(
            this.feedClient.send('UpdateGroupProfileImage', {
                userId: user.id,
                groupId,
                imageUrl: url,
            })
        );
    }

    @Post(':id/cover-image')
    @ApiOperation({summary: 'Upload group cover image'})
    @ApiParam({name: 'id', description: 'Group ID'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({type: UploadFileDto})
    @UseInterceptors(FileInterceptor('file'))
    @ApiResponse({status: 200, description: 'Cover image uploaded successfully'})
    async uploadCoverImage(
        @CurrentUser() user,
        @Param('id') groupId: string,
        @UploadedFile() file: Express.Multer.File
    ): Promise<Group> {
        const url = await this.fileUploadService.uploadFile(file.buffer, file.originalname, file.mimetype, 'feed');

        return await lastValueFrom(
            this.feedClient.send('UpdateGroupCoverImage', {
                userId: user.id,
                groupId,
                imageUrl: url,
            })
        );
    }

    @Post(':id/rules')
    @ApiOperation({summary: 'Add a rule to a group'})
    @ApiParam({name: 'id', description: 'Group ID'})
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                title: {
                    type: 'string',
                    description: 'Title of the rule',
                    example: 'Be respectful',
                },
                description: {
                    type: 'string',
                    description: 'Description of the rule',
                    example: 'Treat everyone with respect. Healthy debates are natural, but kindness is required.',
                },
            },
            required: ['title'],
        },
    })
    @ApiResponse({status: 201, description: 'Rule added successfully'})
    async addGroupRule(
        @CurrentUser() user,
        @Param('id') groupId: string,
        @Body() rule: {title: string; description: string}
    ): Promise<GroupRule> {
        return await lastValueFrom(
            this.feedClient.send('AddGroupRule', {
                userId: user.id,
                groupId,
                rule,
            })
        );
    }

    @Delete(':id/rules/:ruleId')
    @ApiOperation({summary: 'Remove a rule from a group'})
    @ApiParam({name: 'id', description: 'Group ID'})
    @ApiParam({name: 'ruleId', description: 'Rule ID'})
    @ApiResponse({status: 200, description: 'Rule removed successfully'})
    async removeGroupRule(
        @CurrentUser() user,
        @Param('id') groupId: string,
        @Param('ruleId') ruleId: string
    ): Promise<{success: boolean}> {
        return await lastValueFrom(
            this.feedClient.send('RemoveGroupRule', {
                userId: user.id,
                groupId,
                ruleId,
            })
        );
    }

    @Post(':id/apply')
    @ApiOperation({summary: 'Apply to join a group'})
    @ApiParam({name: 'id', description: 'Group ID'})
    @ApiResponse({status: 200, description: 'Application submitted successfully'})
    async applyToGroup(
        @CurrentUser() user,
        @Param('id') groupId: string,
        @Body() application: {message?: string}
    ): Promise<{success: boolean}> {
        return await lastValueFrom(
            this.feedClient.send('ApplyToGroup', {
                userId: user.id,
                groupId,
                message: application.message,
            })
        );
    }

    @Get(':id/applicants')
    @ApiOperation({summary: 'Get applicants for a group'})
    @ApiParam({name: 'id', description: 'Group ID'})
    @ApiQuery({name: 'page', required: false, description: 'Page number'})
    @ApiQuery({name: 'limit', required: false, description: 'Items per page'})
    @ApiResponse({status: 200, description: 'Return list of applicants'})
    async getGroupApplicants(
        @CurrentUser() user,
        @Param('id') groupId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return await lastValueFrom(
            this.feedClient.send('GetGroupApplicants', {
                groupId,
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
            })
        );
    }

    @Post(':id/applicants/:applicantId/verify')
    @ApiOperation({summary: 'Verify a group applicant'})
    @ApiParam({name: 'id', description: 'Group ID'})
    @ApiParam({name: 'applicantId', description: 'Applicant ID'})
    @ApiResponse({status: 200, description: 'Applicant verified successfully'})
    async verifyGroupApplicant(
        @CurrentUser() user,
        @Param('id') groupId: string,
        @Param('applicantId') applicantId: string
    ): Promise<{success: boolean}> {
        return await lastValueFrom(
            this.feedClient.send('VerifyGroupApplicant', {
                userId: user.id,
                applicationId: applicantId,
            })
        );
    }

    @Post(':id/applicants/:applicantId/reject')
    @ApiOperation({summary: 'Reject a group applicant'})
    @ApiParam({name: 'id', description: 'Group ID'})
    @ApiParam({name: 'applicantId', description: 'Applicant ID'})
    @ApiResponse({status: 200, description: 'Applicant rejected successfully'})
    async rejectGroupApplicant(
        @CurrentUser() user,
        @Param('id') groupId: string,
        @Param('applicantId') applicantId: string
    ): Promise<{success: boolean}> {
        return await lastValueFrom(
            this.feedClient.send('RejectGroupApplicant', {
                userId: user.id,
                applicationId: applicantId,
            })
        );
    }
}
