import { DataSource } from 'typeorm';
import { User } from '@/modules/user/entities/user.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  // host: 'db',
  // port: 5432,
  port: 5435,
  username: 'postgres',
  password: 'postgres',
  database: 'infinivista',
  entities: [User],
  migrations: ['migrations/*.ts'],
  synchronize: false,
});