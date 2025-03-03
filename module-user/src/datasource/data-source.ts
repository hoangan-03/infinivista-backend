import { DataSource } from 'typeorm';
import { User } from '@/entities/user.entity';
import { PaymentMethods } from '@/entities/payment-methods.entity';
import { Setting } from '@/entities/setting.entity';
import { SecurityAnswer } from '@/entities/security-answer.entity';
import { SecurityQuestion } from '@/entities/security-question.entity';
import { UserStatus} from '@/entities/user-status.entity';


export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5435,
  // host: 'db',
  // port: 5432,
  // For inside Docker container
  username: 'postgres',
  password: 'postgres',
  database: 'infinivista-user',
  entities: [User, SecurityQuestion, SecurityAnswer, Setting, PaymentMethods, UserStatus],
  migrations: ['migrations/*.ts'],
  synchronize: true, // set to false in production
});