import { DataSource } from 'typeorm';
import { User } from '@/entities/user.entity';
import { PaymentMethods } from '@/entities/payment-methods.entity';
import { Setting } from '@/entities/setting.entity';
import { SecurityAnswer } from '@/entities/security-answer.entity';
import { SecurityQuestion } from '@/entities/security-question.entity';
import { Address } from '@/entities/address.entity';
import { City } from '@/entities/city.entity';
import { Country } from '@/entities/country.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  // host: 'db',
  // port: 5432,
  port: 5435,
  username: 'postgres',
  password: 'postgres',
  database: 'infinivista',
  entities: [User, SecurityQuestion, SecurityAnswer, Setting, PaymentMethods, Address, Country, City],
  migrations: ['migrations/*.ts'],
  synchronize: true, // set to false in production
});