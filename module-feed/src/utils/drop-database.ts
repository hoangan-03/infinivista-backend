// module-feed/src/utils/drop-database.ts
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
    
    console.log('Dropping feed database tables...');
    
    // Drop tables with foreign keys first
    await queryRunner.query('DROP TABLE IF EXISTS user_comments_news_feed CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS user_shares_news_feed CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS user_views_news_feed CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS user_reacts_news_feed CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS post CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS story CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS live_stream_history CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS reaction CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS news_feed CASCADE');

    // Drop any remaining types
    await queryRunner.query('DROP TYPE IF EXISTS reaction_type_enum CASCADE');
    await queryRunner.query('DROP TYPE IF EXISTS content_type_enum CASCADE');

    console.log(`Feed database ${configService.get<string>('POSTGRES_DB')} tables dropped successfully.`);
    
  } catch (error) {
    console.error('Error dropping feed database tables:', error);
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
      console.error('Failed to drop feed database tables:', error);
      process.exit(1);
    });
}

export { dropDatabase };