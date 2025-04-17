import {Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards} from '@nestjs/common';
import {Inject} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags} from '@nestjs/swagger';
import {lastValueFrom} from 'rxjs';

import {CurrentUser} from '@/decorators/user.decorator';
import {PaginationDto} from '@/dtos/common/pagination.dto';
import {CallHistory} from '@/entities/communication-module/internal/call-history.entity';
import {JWTAuthGuard} from '@/guards/jwt-auth.guard';
import {JwtBlacklistGuard} from '@/guards/jwt-blacklist.guard';
import {PaginationResponseInterface} from '@/interfaces/common/pagination-response.interface';

import {InitiateCallDto} from './dto/initiate-call.dto';

@ApiTags('Calling')
@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard, JWTAuthGuard)
@Controller('calling')
export class CallingController {
    constructor(@Inject('COMMUNICATION_SERVICE') private communicationClient: ClientProxy) {}

    @Post('initiate')
    @ApiOperation({summary: 'Initiate a new call'})
    @ApiBody({type: InitiateCallDto})
    @ApiResponse({status: 201, description: 'Call initiated successfully', type: CallHistory})
    async initiateCall(@CurrentUser() user, @Body() callData: InitiateCallDto): Promise<CallHistory> {
        return await lastValueFrom(this.communicationClient.send('InitiateCallCommand', {callerId: user.id, callData}));
    }

    @Post(':id/accept')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Accept an incoming call'})
    @ApiParam({name: 'id', description: 'Call ID to accept'})
    @ApiResponse({status: 200, description: 'Call accepted successfully', type: CallHistory})
    async acceptCall(@CurrentUser() user, @Param('id') callId: string): Promise<CallHistory> {
        return await lastValueFrom(this.communicationClient.send('AcceptCallCommand', {callId, userId: user.id}));
    }

    @Post(':id/reject')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Reject an incoming call'})
    @ApiParam({name: 'id', description: 'Call ID to reject'})
    @ApiResponse({status: 200, description: 'Call rejected successfully', type: CallHistory})
    async rejectCall(@CurrentUser() user, @Param('id') callId: string): Promise<CallHistory> {
        return await lastValueFrom(this.communicationClient.send('RejectCallCommand', {callId, userId: user.id}));
    }

    @Post(':id/end')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'End an active call'})
    @ApiParam({name: 'id', description: 'Call ID to end'})
    @ApiResponse({status: 200, description: 'Call ended successfully', type: CallHistory})
    async endCall(@CurrentUser() user, @Param('id') callId: string): Promise<CallHistory> {
        return await lastValueFrom(this.communicationClient.send('EndCallCommand', {callId, userId: user.id}));
    }

    @Get('history')
    @ApiOperation({summary: 'Get call history for current user'})
    @ApiQuery({name: 'page', required: false, description: 'Page number for pagination'})
    @ApiQuery({name: 'limit', required: false, description: 'Items per page for pagination'})
    @ApiResponse({status: 200, description: 'Call history retrieved successfully'})
    async getCallHistory(
        @CurrentUser() user,
        @Query() paginationDto: PaginationDto
    ): Promise<PaginationResponseInterface<CallHistory>> {
        return await lastValueFrom(
            this.communicationClient.send('GetCallHistoryCommand', {
                userId: user.id,
                page: paginationDto.page,
                limit: paginationDto.limit,
            })
        );
    }

    @Get(':id')
    @ApiOperation({summary: 'Get call details by ID'})
    @ApiParam({name: 'id', description: 'Call ID to retrieve'})
    @ApiResponse({status: 200, description: 'Call details retrieved successfully', type: CallHistory})
    async getCallById(@Param('id') callId: string): Promise<CallHistory> {
        return await lastValueFrom(this.communicationClient.send('GetCallByIdCommand', {callId}));
    }
}
