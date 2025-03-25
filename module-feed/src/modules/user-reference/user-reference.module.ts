import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import {UserReference} from '@/entities/external/user-ref.entity';

import {UserReferenceController} from './user-reference.controller';
import {UserReferenceService} from './user-reference.service';

@Module({
    imports: [TypeOrmModule.forFeature([UserReference])],
    controllers: [UserReferenceController],
    providers: [UserReferenceService],
    exports: [UserReferenceService],
})
export class UserReferenceModule {}
