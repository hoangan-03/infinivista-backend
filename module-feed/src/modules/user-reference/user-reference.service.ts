import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {UserReference} from '@/entities/external/user-ref.entity';

@Injectable()
export class UserReferenceService {
    constructor(
        @InjectRepository(UserReference)
        private readonly userReferenceRepository: Repository<UserReference>
    ) {}

    async findById(id: string): Promise<UserReference> {
        let userRef = await this.userReferenceRepository.findOne({where: {id}});
        if (!userRef) {
            userRef = this.userReferenceRepository.create({id});
            await this.userReferenceRepository.save(userRef);
        }
        return userRef;
    }

    async upsertUserReference(userData: Partial<UserReference>): Promise<UserReference> {
        const {id} = userData;

        const existingRef = await this.userReferenceRepository.findOne({
            where: {id},
        });

        if (existingRef) {
            this.userReferenceRepository.merge(existingRef, userData);
            return this.userReferenceRepository.save(existingRef);
        } else {
            const newRef = this.userReferenceRepository.create(userData);
            return this.userReferenceRepository.save(newRef);
        }
    }
}
