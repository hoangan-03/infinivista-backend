import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOneOptions } from "typeorm";
import { User } from "@/entities/user.entity";
import { UpdateUserDto } from "@/modules/user/dto/update-user.dto";
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { validate as uuidValidate } from "uuid";
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);

    return this.userRepository.save(user);
  }
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(where: FindOneOptions<User>): Promise<User> {
    if (where.where && "id" in where.where) {
      const id = where.where.id as string;
      if (!uuidValidate(id)) {
        throw new BadRequestException("Invalid UUID format");
      }
    }

    const user = await this.userRepository.findOne(where);

    if (!user) {
      const identifier = where.where
        ? Object.entries(where.where)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
        : "unknown";

      throw new NotFoundException(`User not found with ${identifier}`);
    }

    return user;
  }

  async update(id: string, updates: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: id });

    if (!user) {
      throw new NotFoundException(`There isn't any user with id: ${id}`);
    }

    this.userRepository.merge(user, updates);

    return this.userRepository.save(user);
  }
}
