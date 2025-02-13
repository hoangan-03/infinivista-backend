import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { User } from "@/entities/user.entity";
import { Repository } from "typeorm";

@ValidatorConstraint({ name: "isUserNameAlreadyExist", async: true })
@Injectable()
export class IsUserNameAlreadyExist implements ValidatorConstraintInterface {
  private readonly logger = new Logger(IsUserNameAlreadyExist.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async validate(username: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { username },
      });
      return user === null || user === undefined;
    } catch (error) {
      this.logger.error(
        `Error validating username: ${(error as any).message}`,
        (error as any).stack
      );
      return false;
    }
  }
  defaultMessage(): string {
    return "The username $value is already registered.";
  }
}
