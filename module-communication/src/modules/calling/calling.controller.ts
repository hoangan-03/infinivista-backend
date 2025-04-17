import {Controller, Logger} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';

import {CallHistory} from '@/entities/internal/call-history.entity';
import {PaginationResponseInterface} from '@/interfaces/pagination-response.interface';

import {CallingService} from './calling.service';
import {InitiateCallDto} from './dto/initiate-call.dto';

@Controller()
export class CallingController {
    private readonly logger = new Logger(CallingController.name);

    constructor(private readonly callingService: CallingService) {}

    @MessagePattern('InitiateCallCommand')
    async initiateCall(payload: {callerId: string; callData: InitiateCallDto}): Promise<CallHistory> {
        this.logger.log(`Initiating call from ${payload.callerId} to ${payload.callData.receiverId}`);
        return await this.callingService.initiateCall(payload.callerId, payload.callData);
    }

    @MessagePattern('AcceptCallCommand')
    async acceptCall(payload: {callId: string; userId: string}): Promise<CallHistory> {
        this.logger.log(`Accepting call ${payload.callId} by ${payload.userId}`);
        return await this.callingService.acceptCall(payload.callId, payload.userId);
    }

    @MessagePattern('RejectCallCommand')
    async rejectCall(payload: {callId: string; userId: string}): Promise<CallHistory> {
        this.logger.log(`Rejecting call ${payload.callId} by ${payload.userId}`);
        return await this.callingService.rejectCall(payload.callId, payload.userId);
    }

    @MessagePattern('EndCallCommand')
    async endCall(payload: {callId: string; userId: string}): Promise<CallHistory> {
        this.logger.log(`Ending call ${payload.callId} by ${payload.userId}`);
        return await this.callingService.endCall(payload.callId, payload.userId);
    }

    @MessagePattern('GetCallByIdCommand')
    async getCallById(payload: {callId: string}): Promise<CallHistory> {
        return await this.callingService.getCallById(payload.callId);
    }

    @MessagePattern('GetCallHistoryCommand')
    async getCallHistory(payload: {
        userId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<CallHistory>> {
        return await this.callingService.getCallHistory(payload.userId, payload.page, payload.limit);
    }
}
