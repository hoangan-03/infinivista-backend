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
import { Setting } from "@/entities/setting.entity";
import { SecurityAnswer } from "@/entities/security-answer.entity";
import { PaymentMethods } from "@/entities/payment-methods.entity";
import { SettingType } from "@/modules/user/enums/setting.enum";
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
    @InjectRepository(SecurityAnswer)
    private readonly securityAnswerRepository: Repository<SecurityAnswer>,
    @InjectRepository(PaymentMethods)
    private readonly paymentMethodRepository: Repository<PaymentMethods>
  ) {}

  // User Management
  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);

    return this.userRepository.save(user);
  }
  async getAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async getOne(options: FindOneOptions<User>): Promise<User> {
    if (options.where && "id" in options.where) {
      const id = options.where.id as string;
      if (!uuidValidate(id)) {
        throw new BadRequestException("Invalid UUID format");
      }
    }
    const user = await this.userRepository.findOne(options);
    if (!user) {
      const identifier = options.where
        ? Object.entries(options.where)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
        : "unknown";

      throw new NotFoundException(`There isn't any user with id:  ${identifier}`);
    }
    return user;
  }

  // Profile Management
  async updateProfile(id: string, updates: UpdateUserDto): Promise<User> {
    const user = await this.getOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`There isn't any user with id: ${id}`);
    }
    this.userRepository.merge(user, updates);
    return this.userRepository.save(user);
  }

  async updateProfilePicture(id: string, imageUrl: string): Promise<User> {
    const user = await this.getOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`There isn't any user with id: ${id}`);
    }
    user.profileImageUrl = imageUrl;
    return this.userRepository.save(user);
  }

  async updateCoverPhoto(id: string, imageUrl: string): Promise<User> {
    const user = await this.getOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`There isn't any user with id: ${id}`);
    }
    user.coverImageUrl = imageUrl;
    return this.userRepository.save(user);
  }

  // Settings Management
  async updateUserSettings(
    userId: string,
    type: SettingType,
    value: string
  ): Promise<Setting> {
    let setting = await this.settingRepository.findOne({
      where: { user_id: userId, type },
    });

    if (!setting) {
      setting = this.settingRepository.create({
        user_id: userId,
        type,
        value,
      });
    } else {
      setting.value = value;
    }

    return this.settingRepository.save(setting);
  }

  // Security Management
  async setSecurityQuestions(
    userId: string,
    answers: { questionId: string; answer: string }[]
  ): Promise<SecurityAnswer[]> {
    const savedAnswers: SecurityAnswer[] = [];

    for (const ans of answers) {
      const securityAnswer = this.securityAnswerRepository.create({
        user_id: userId,
        question_id: ans.questionId,
        answer: ans.answer,
      });
      savedAnswers.push(
        await this.securityAnswerRepository.save(securityAnswer)
      );
    }

    return savedAnswers;
  }

  // Payment Methods
  // async addPaymentMethod(
  //   userId: string,
  //   paymentMethod: Partial<PaymentMethods>
  // ): Promise<PaymentMethods> {
  //   const newPaymentMethod = this.paymentMethodRepository.create({
  //     ...paymentMethod,
  //     userId: userId,
  //   });
  //   return this.paymentMethodRepository.save(newPaymentMethod);
  // }

  // User Status
  async toggleOnlineStatus(id: string, isOnline: boolean): Promise<User> {
    const user = await this.getOne({ where: { id } });
    user.status.isOnline = isOnline;
    return this.userRepository.save(user);
  }

  async suspendUser(id: string, suspended: boolean): Promise<User> {
    const user = await this.getOne({ where: { id } });
    user.status.isSuspended = suspended;
    return this.userRepository.save(user);
  }

  // Advanced Queries
  async findBySecurityAnswer(
    questionId: string,
    answer: string
  ): Promise<User | undefined> {
    const result = await this.userRepository
      .createQueryBuilder("user")
      .innerJoin("user.securityAnswers", "answer")
      .where("answer.question_id = :questionId", { questionId })
      .andWhere("answer.answer = :answer", { answer })
      .getOne();
    return result || undefined;
  }

  async getUserWithFullProfile(id: string): Promise<User> {
    const result = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.setting", "setting")
      .leftJoinAndSelect("user.address", "address")
      .leftJoinAndSelect("user.securityAnswers", "securityAnswers")
      .leftJoinAndSelect("securityAnswers.question", "question")
      .where("user.id = :id", { id })
      .getOne();
    if (!result) {
      throw new NotFoundException(`There isn't any user with id: ${id}`);
    }
    return result;
  }
}
