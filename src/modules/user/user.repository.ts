import { Injectable , Logger} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/modules/user/entities/user.entity';

@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}


  async findOneByEmail(email: string): Promise<User | null> {
    this.logger.debug(`Searching for user with email: ${email}`);
    
    const user = await this.userRepository.findOne({ 
      where: { email } 
    });

    this.logger.debug(`Search result: ${user ? 'User found' : 'No user found'}`);
    
    return user || null;
  }
  async create(user: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async update(id: string, user: Partial<User>): Promise<User | null> {
    await this.userRepository.update(id, user);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}