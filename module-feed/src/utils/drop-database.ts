import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config();

const configService = new ConfigService();

const dropDatabase = async () => {
  const dataSource = new DataSource({
    type: 'postgres',
    host: configService.get<string>('POSTGRES_HOST'),
    port: configService.get<number>('POSTGRES_PORT'),
    username: configService.get<string>('POSTGRES_USER'),
    password: configService.get<string>('POSTGRES_PASSWORD'),
    database: configService.get<string>('POSTGRES_DB'),
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    
    // Drop tables in correct order due to foreign key constraints
    const queryRunner = dataSource.createQueryRunner();
    
    console.log('Dropping database tables...');
    
    // Drop tables with foreign keys first
    await queryRunner.query('DROP TABLE IF EXISTS settings CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS security_answers CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS payment_methods CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS user_status CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS users CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS security_questions CASCADE');

    // Drop any remaining types
    await queryRunner.query('DROP TYPE IF EXISTS gender_enum CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS setting_type_enum CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS payment_method_type_enum CASCADE');

    console.log(`Database ${configService.get<string>('POSTGRES_DB')} tables dropped successfully.`);
    
  } catch (error) {
    console.error('Error dropping database:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
};

if (require.main === module) {
  dropDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed to drop database:', error);
      process.exit(1);
    });
}

export { dropDatabase };