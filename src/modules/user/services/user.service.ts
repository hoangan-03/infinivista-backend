import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOneOptions } from "typeorm";

import { User } from "@/modules/user/entities/user.entity";
import { UpdateUser } from "@/modules/user/dto/update-user.dto";

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
    return this.userRepository.find({
      select: [
        "id",
        "email",
        "username",
        "firstName",
        "lastName",
      ],
    });
  }
  async findOne(where: FindOneOptions<User>): Promise<User> {
    const user = await this.userRepository.findOne(where);

    if (!user) {
      throw new NotFoundException(
        `There isn't any user with identifier: ${where}`
      );
    }

    return user;
  }

  async update(id: number, updates: UpdateUser): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: id.toString() });

    if (!user) {
      throw new NotFoundException(`There isn't any user with id: ${id}`);
    }

    this.userRepository.merge(user, updates);

    return this.userRepository.save(user);
  }
}
