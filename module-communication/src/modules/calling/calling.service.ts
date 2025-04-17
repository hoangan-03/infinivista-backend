import {BadRequestException, Inject, Injectable, Logger, NotFoundException} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {InjectRepository} from '@nestjs/typeorm';
import {firstValueFrom} from 'rxjs';
import {Repository} from 'typeorm';

import {UserReference} from '@/entities/external/user-reference.entity';
import {CallHistory} from '@/entities/internal/call-history.entity';
import {PaginationResponseInterface} from '@/interfaces/pagination-response.interface';

import {InitiateCallDto} from './dto/initiate-call.dto';
import {CallStatus} from './enums/call-status.enum';

@Injectable()
export class CallingService {
    private readonly logger = new Logger(CallingService.name);

    constructor(
        @InjectRepository(CallHistory)
        private callHistoryRepository: Repository<CallHistory>,
        @InjectRepository(UserReference)
        private userReferenceRepository: Repository<UserReference>,
        @Inject('USER_SERVICE') private userClient: ClientProxy
    ) {}

    async initiateCall(callerId: string, initiateCallDto: InitiateCallDto): Promise<CallHistory> {
        const caller = await this.userReferenceRepository.findOne({where: {id: callerId}});
        const receiver = await this.userReferenceRepository.findOne({where: {id: initiateCallDto.receiverId}});

        if (!caller) {
            throw new NotFoundException(`Caller with ID ${callerId} not found`);
        }

        if (!receiver) {
            throw new NotFoundException(`Receiver with ID ${initiateCallDto.receiverId} not found`);
        }

        // Check if users can call each other (e.g., are they friends?)
        try {
            const checkResult = await firstValueFrom(
                this.userClient.send('CheckFriendshipUserCommand', {
                    userId: callerId,
                    friendId: initiateCallDto.receiverId,
                })
            );

            if (!checkResult.isFriend) {
                throw new BadRequestException('You can only call users who are your friends');
            }
        } catch (error) {
            this.logger.error(`Error checking friendship: ${error}`);
            // Allow the call to proceed if the check fails
        }

        // Create a new call record
        const newCall = this.callHistoryRepository.create({
            caller,
            receiver,
            start_time: new Date(),
            status: CallStatus.INITIATED,
            type: initiateCallDto.callType,
        });

        return this.callHistoryRepository.save(newCall);
    }

    async acceptCall(callId: string, userId: string): Promise<CallHistory> {
        const call = await this.getCallById(callId);

        if (call.receiver.id !== userId) {
            throw new BadRequestException('Only the call recipient can accept this call');
        }

        if (call.status !== CallStatus.INITIATED) {
            throw new BadRequestException(`Call cannot be accepted as it is ${call.status}`);
        }

        call.status = CallStatus.ACTIVE;
        call.accepted_at = new Date();

        return this.callHistoryRepository.save(call);
    }

    async rejectCall(callId: string, userId: string): Promise<CallHistory> {
        const call = await this.getCallById(callId);

        if (call.receiver.id !== userId) {
            throw new BadRequestException('Only the call recipient can reject this call');
        }

        if (call.status !== CallStatus.INITIATED) {
            throw new BadRequestException(`Call cannot be rejected as it is ${call.status}`);
        }

        call.status = CallStatus.REJECTED;
        call.end_time = new Date();

        return this.callHistoryRepository.save(call);
    }

    async endCall(callId: string, userId: string): Promise<CallHistory> {
        const call = await this.getCallById(callId);

        if (call.caller.id !== userId && call.receiver.id !== userId) {
            throw new BadRequestException('You are not a participant in this call');
        }

        if (call.status !== CallStatus.ACTIVE) {
            throw new BadRequestException(`Call cannot be ended as it is ${call.status}`);
        }

        call.status = CallStatus.ENDED;
        call.end_time = new Date();

        return this.callHistoryRepository.save(call);
    }

    async getCallById(callId: string): Promise<CallHistory> {
        const call = await this.callHistoryRepository.findOne({
            where: {call_id: callId},
            relations: ['caller', 'receiver'],
        });

        if (!call) {
            throw new NotFoundException(`Call with ID ${callId} not found`);
        }

        return call;
    }

    async getCallHistory(userId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<CallHistory>> {
        const [calls, total] = await this.callHistoryRepository.findAndCount({
            where: [{caller: {id: userId}}, {receiver: {id: userId}}],
            relations: ['caller', 'receiver'],
            order: {start_time: 'DESC'},
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            data: calls,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
