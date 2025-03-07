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
    
    console.log('Dropping communication database tables...');
    
    // Drop tables with foreign keys first
    await queryRunner.query('DROP TABLE IF EXISTS user_messages_group_chat CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS user_messages_user CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS message_attachment CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS message_text CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS "message" CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS group_chat CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS call_histories CASCADE');

    console.log(`Communication database ${configService.get<string>('POSTGRES_DB')} tables dropped successfully.`);
    
  } catch (error) {
    console.error('Error dropping communication database tables:', error);
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
      console.error('Failed to drop communication database tables:', error);
      process.exit(1);
    });
}

export { dropDatabase };