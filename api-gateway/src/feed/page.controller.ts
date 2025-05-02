import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    Inject,
    NotFoundException,
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
import {CreatePageDto} from '@/dtos/feed-module/create-page.dto';
import {CreatePostDto} from '@/dtos/feed-module/create-post.dto';
import {UpdatePageDto} from '@/dtos/feed-module/update-page.dto';
import {UserReference} from '@/entities/communication-module/external/user-reference.entity';
import {Page} from '@/entities/feed-module/local/page.entity';
import {Post as PostEntity} from '@/entities/feed-module/local/post.entity';
import {AttachmentType} from '@/enums/feed-module/attachment-type.enum';
import {JWTAuthGuard} from '@/guards/jwt-auth.guard';
import {JwtBlacklistGuard} from '@/guards/jwt-blacklist.guard';
import {PaginationResponseInterface} from '@/interfaces/common/pagination-response.interface';
import {FileUploadService} from '@/services/file-upload.service';

@ApiTags('Page')
@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard, JWTAuthGuard)
@Controller('page')
export class PageController {
    constructor(
        @Inject('FEED_SERVICE') private feedClient: ClientProxy,
        private fileUploadService: FileUploadService
    ) {}

    @Get('')
    @ApiOperation({summary: 'Get all pages'})
    @ApiQuery({type: PaginationDto})
    async getAllPages(@Query() paginationDto: PaginationDto): Promise<PaginationResponseInterface<Page>> {
        return await lastValueFrom(
            this.feedClient.send('GetAllPages', {
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Post('')
    @ApiOperation({summary: 'Create a new page'})
    @ApiBody({type: CreatePageDto})
    @ApiResponse({status: 201, description: 'Page created successfully', type: Page})
    async createPage(@CurrentUser() user, @Body() pageData: CreatePageDto): Promise<Page> {
        return await lastValueFrom(
            this.feedClient.send('CreatePage', {
                ownerId: user.id,
                pageData,
            })
        );
    }
    @Post('create-post')
    @ApiOperation({summary: 'Create a post on a page'})
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
                pageId: {
                    type: 'string',
                    description: 'ID of the page',
                    example: 'bc9656c4-f39a-4e12-87ab-39e438acab05',
                },
                attachmentTypes: {
                    type: 'string',
                    description: 'Comma-separated list of attachment types',
                    example: AttachmentType.IMAGE + ',' + AttachmentType.VIDEO,
                },
            },
            required: ['content', 'pageId'],
        },
    })
    @UseInterceptors(FilesInterceptor('files', 10))
    @ApiResponse({status: 201, description: 'Post created successfully', type: PostEntity})
    async createPagePost(
        @CurrentUser() user,
        @Body('content') content: string,
        @Body('pageId') pageId: string,
        @Body('attachmentTypes') attachmentTypesStr: string,
        @UploadedFiles() files: Array<Express.Multer.File>
    ): Promise<PostEntity> {
        const page: Page = await lastValueFrom(this.feedClient.send('GetPageById', {id: pageId}));
        if (page.owner_id !== user.id) {
            throw new ForbiddenException('Only page owners can post to pages');
        }

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

        if (!page.newsFeed) {
            throw new NotFoundException('Page not found');
        }

        return await lastValueFrom(
            this.feedClient.send('CreatePostInPageAfterUploadingFilesCommand', {
                userId: user.id,
                newsFeedId: page.newsFeed.id,
                postData,
                files: fileUploadResponses,
                attachmentType: attachmentTypes,
            })
        );
    }

    @Get('/my-pages')
    @ApiOperation({summary: 'Get pages owned by the user'})
    @ApiQuery({type: PaginationDto})
    async getMyPages(
        @CurrentUser() user,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<Page>> {
        return await lastValueFrom(
            this.feedClient.send('GetMyPages', {
                userId: user.id,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Get(':id')
    @ApiOperation({summary: 'Get page by ID'})
    @ApiParam({name: 'id', type: String, description: 'Page ID'})
    @ApiResponse({status: 200, type: Page})
    @ApiResponse({status: 404, description: 'Page not found'})
    async getPageById(@Param('id') id: string): Promise<Page> {
        return await lastValueFrom(this.feedClient.send('GetPageById', {id}));
    }

    @Patch(':id')
    @ApiOperation({summary: 'Update page information'})
    @ApiParam({name: 'id', description: 'Page ID'})
    @ApiBody({type: UpdatePageDto})
    @ApiResponse({status: 200, description: 'Page updated successfully', type: Page})
    async updatePage(
        @CurrentUser() user,
        @Param('id') pageId: string,
        @Body() updateData: UpdatePageDto
    ): Promise<Page> {
        return await lastValueFrom(
            this.feedClient.send('UpdatePage', {
                userId: user.id,
                pageId,
                updateData,
            })
        );
    }

    @Delete(':id')
    @ApiOperation({summary: 'Delete a page'})
    @ApiParam({name: 'id', description: 'Page ID'})
    @ApiResponse({status: 200, description: 'Page deleted successfully'})
    async deletePage(@CurrentUser() user, @Param('id') pageId: string): Promise<{success: boolean}> {
        return await lastValueFrom(
            this.feedClient.send('DeletePage', {
                userId: user.id,
                pageId,
            })
        );
    }

    @Post(':id/follow')
    @ApiOperation({summary: 'Follow a page'})
    @ApiParam({name: 'id', description: 'Page ID'})
    @ApiResponse({status: 200, description: 'Page followed successfully'})
    async followPage(@CurrentUser() user, @Param('id') pageId: string): Promise<{success: boolean}> {
        return await lastValueFrom(
            this.feedClient.send('FollowPage', {
                userId: user.id,
                pageId,
            })
        );
    }

    @Delete(':id/unfollow')
    @ApiOperation({summary: 'Unfollow a page'})
    @ApiParam({name: 'id', description: 'Page ID'})
    @ApiResponse({status: 200, description: 'Page unfollowed successfully'})
    async unfollowPage(@CurrentUser() user, @Param('id') pageId: string): Promise<{success: boolean}> {
        return await lastValueFrom(
            this.feedClient.send('UnfollowPage', {
                userId: user.id,
                pageId,
            })
        );
    }

    @Get(':id/followers')
    @ApiOperation({summary: 'Get followers of a page'})
    @ApiParam({name: 'id', description: 'Page ID'})
    @ApiQuery({type: PaginationDto})
    @ApiResponse({status: 200, description: 'List of page followers'})
    async getPageFollowers(
        @Param('id') pageId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<UserReference>> {
        return await lastValueFrom(
            this.feedClient.send('GetPageFollowers', {
                pageId,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Get(':id/posts')
    @ApiOperation({summary: 'Get posts from a page'})
    @ApiParam({name: 'id', description: 'Page ID'})
    @ApiQuery({type: PaginationDto})
    @ApiResponse({status: 200, description: 'List of page posts'})
    async getPagePosts(
        @Param('id') pageId: string,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<PostEntity>> {
        return await lastValueFrom(
            this.feedClient.send('GetPagePosts', {
                pageId,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Post(':id/profile-image')
    @ApiOperation({summary: 'Upload page profile image'})
    @ApiParam({name: 'id', description: 'Page ID'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({type: UploadFileDto})
    @UseInterceptors(FileInterceptor('file'))
    @ApiResponse({status: 200, description: 'Profile image uploaded successfully'})
    async uploadProfileImage(
        @CurrentUser() user,
        @Param('id') pageId: string,
        @UploadedFile() file: Express.Multer.File
    ): Promise<Page> {
        const url = await this.fileUploadService.uploadFile(file.buffer, file.originalname, file.mimetype, 'feed');

        return await lastValueFrom(
            this.feedClient.send('UpdatePageProfileImage', {
                userId: user.id,
                pageId,
                imageUrl: url,
            })
        );
    }

    @Post(':id/cover-image')
    @ApiOperation({summary: 'Upload page cover image'})
    @ApiParam({name: 'id', description: 'Page ID'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({type: UploadFileDto})
    @UseInterceptors(FileInterceptor('file'))
    @ApiResponse({status: 200, description: 'Cover image uploaded successfully'})
    async uploadCoverImage(
        @CurrentUser() user,
        @Param('id') pageId: string,
        @UploadedFile() file: Express.Multer.File
    ): Promise<Page> {
        const url = await this.fileUploadService.uploadFile(file.buffer, file.originalname, file.mimetype, 'feed');

        return await lastValueFrom(
            this.feedClient.send('UpdatePageCoverImage', {
                userId: user.id,
                pageId,
                imageUrl: url,
            })
        );
    }
}
