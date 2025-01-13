import { PartialType } from '@nestjs/mapped-types';
import { CreateUser } from './create-user.dto';

export class UpdateUser extends PartialType(CreateUser) {}
