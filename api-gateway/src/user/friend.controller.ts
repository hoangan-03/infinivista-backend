import {Body, Controller, Delete, Get, Inject, Param, Post, Put, Query, UseGuards} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags} from '@nestjs/swagger';
import {lastValueFrom} from 'rxjs';

import {CurrentUser} from '@/decorators/user.decorator';
import {PaginationDto} from '@/dtos/common/pagination.dto';
import {FriendRequest} from '@/entities/user-module/local/friend-request.entity';
import {User} from '@/entities/user-module/local/user.entity';
import {JWTAuthGuard} from '@/guards/jwt-auth.guard';
import {JwtBlacklistGuard} from '@/guards/jwt-blacklist.guard';
import {PaginationResponseInterface} from '@/interfaces/common/pagination-response.interface';

@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard, JWTAuthGuard)
@ApiTags('Friend')
@Controller('friend')
export class FriendController {
    constructor(@Inject('USER_SERVICE') private userClient: ClientProxy) {}

    @Get('requests')
    @ApiOperation({summary: 'Get paginated friend requests of current user'})
    @ApiQuery({type: PaginationDto})
    @ApiResponse({status: 200, description: 'Return all friend requests', type: [FriendRequest]})
    @ApiResponse({status: 401, description: 'Unauthorized - Invalid or missing token'})
    async getFriendRequests(
        @CurrentUser() user: User,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<FriendRequest>> {
        return await lastValueFrom(
            this.userClient.send('GetFriendRequestsUserCommand', {
                userId: user.id,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }
    @Get(':id')
    @ApiOperation({summary: 'Get paginated list of friends for a user'})
    @ApiQuery({type: PaginationDto})
    @ApiResponse({status: 200, description: 'Returns paginated list of friends'})
    async getFriends(
        @Param('id') id: string,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<User>> {
        return await lastValueFrom(
            this.userClient.send('GetFriendsUserCommand', {
                userId: id,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Delete(':friendId')
    @ApiOperation({summary: 'Remove friend'})
    @ApiResponse({status: 200, description: 'Friend removed successfully'})
    @ApiResponse({status: 401, description: 'Unauthorized - Invalid or missing token'})
    @ApiResponse({status: 404, description: 'Not Found - Friend not found with the provided ID'})
    async removeFriend(@CurrentUser() user: User, @Param('friendId') friendId: string): Promise<{success: boolean}> {
        return await lastValueFrom(this.userClient.send('RemoveFriendUserCommand', {userId: user.id, friendId}));
    }

    @Post('request/:recipientId')
    @ApiOperation({summary: 'Send friend request'})
    @ApiResponse({status: 201, description: 'Friend request sent', type: FriendRequest})
    @ApiResponse({status: 401, description: 'Unauthorized - Invalid or missing token'})
    async sendFriendRequest(
        @CurrentUser() user: User,
        @Param('recipientId') recipientId: string
    ): Promise<FriendRequest> {
        return await lastValueFrom(
            this.userClient.send('SendFriendRequestUserCommand', {senderId: user.id, recipientId})
        );
    }

    @Put('request/:requestId')
    @ApiOperation({summary: 'Accept or decline friend request'})
    @ApiBody({
        schema: {
            type: 'object',
            properties: {accept: {type: 'boolean', description: 'Whether to accept the friend request'}},
        },
    })
    @ApiResponse({status: 200, description: 'Friend request response'})
    @ApiResponse({status: 400, description: 'Bad Request - Invalid input data'})
    @ApiResponse({status: 401, description: 'Unauthorized - Invalid or missing token'})
    async respondToRequest(
        @Param('requestId') requestId: string,
        @Body('accept') accept: boolean
    ): Promise<{success: boolean}> {
        await lastValueFrom(this.userClient.send('RespondToFriendRequestUserCommand', {requestId, accept}));
        return {success: true};
    }
}
