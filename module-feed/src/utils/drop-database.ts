import {ConfigService} from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import {DataSource} from 'typeorm';

dotenv.config();

const configService = new ConfigService();

const dropDatabase = async () => {
    // Determine if running locally or in Docker
    const isRunningLocally = !fs.existsSync('/.dockerenv');

    // Use localhost if running outside Docker
    const host = isRunningLocally ? 'localhost' : configService.get<string>('POSTGRES_HOST');
    const port = isRunningLocally ? 5435 : configService.get<number>('POSTGRES_PORT');
    const dbName = configService.get<string>('POSTGRES_DB');
    const username = configService.get<string>('POSTGRES_USER');
    const password = configService.get<string>('POSTGRES_PASSWORD');

    console.log(`Connecting to database at ${host}:${port}`);

    try {
        // First connect to 'postgres' database to create our target database if needed
        if (isRunningLocally) {
            console.log('Running locally - connecting to postgres database first');
            const pgDataSource = new DataSource({
                type: 'postgres',
                host,
                port,
                username,
                password,
                database: 'postgres',
                synchronize: false,
                logging: true,
            });

            await pgDataSource.initialize();
            const pgQueryRunner = pgDataSource.createQueryRunner();

            // Create database if it doesn't exist
            try {
                console.log(`Creating database ${dbName} if it doesn't exist...`);
                await pgQueryRunner.query(`CREATE DATABASE "${dbName}"`);
                console.log(`Created database ${dbName}`);
            } catch (e) {
                console.log(`Database ${dbName} already exists`);
            }

            await pgDataSource.destroy();
        }

        const dataSource = new DataSource({
            type: 'postgres',
            host,
            port,
            username,
            password,
            database: dbName,
            synchronize: false,
            logging: true,
        });

        await dataSource.initialize();
        const queryRunner = dataSource.createQueryRunner();

        console.log('Dropping feed database tables...');

        // First drop all join tables and tables with foreign keys
        await queryRunner.query('DROP TABLE IF EXISTS user_react_post CASCADE');
        await queryRunner.query('DROP TABLE IF EXISTS user_react_story CASCADE');
        await queryRunner.query('DROP TABLE IF EXISTS group_applicant CASCADE');
        await queryRunner.query('DROP TABLE IF EXISTS user_share_post CASCADE');

        // Rest of your drop queries...
        // Drop tables with relationships to news_feed
        await queryRunner.query('DROP TABLE IF EXISTS comment CASCADE');
        await queryRunner.query('DROP TABLE IF EXISTS post_attachment CASCADE');
        await queryRunner.query('DROP TABLE IF EXISTS post CASCADE');
        await queryRunner.query('DROP TABLE IF EXISTS story CASCADE');
        await queryRunner.query('DROP TABLE IF EXISTS live_stream_history CASCADE');
        await queryRunner.query('DROP TABLE IF EXISTS reaction CASCADE');
        await queryRunner.query('DROP TABLE IF EXISTS reel CASCADE');
        await queryRunner.query('DROP TABLE IF EXISTS advertisement CASCADE');
        await queryRunner.query('DROP TABLE IF EXISTS hash_tag CASCADE');
        await queryRunner.query('DROP TABLE IF EXISTS news_feed CASCADE');
        await queryRunner.query('DROP TABLE IF EXISTS page CASCADE');
        await queryRunner.query('DROP TABLE IF EXISTS group_rule CASCADE');
        await queryRunner.query('DROP TABLE IF EXISTS "group" CASCADE');

        // Drop many-to-many join tables
        await queryRunner.query('DROP TABLE IF EXISTS post_topics CASCADE');

        // Drop reference tables
        await queryRunner.query('DROP TABLE IF EXISTS user_references CASCADE');
        await queryRunner.query('DROP TABLE IF EXISTS community_reference CASCADE');

        // Drop many-to-many join tables
        await queryRunner.query('DROP TABLE IF EXISTS group_members_user_references CASCADE');
        await queryRunner.query('DROP TABLE IF EXISTS page_followers_user_references CASCADE');
        await queryRunner.query('DROP TABLE IF EXISTS user_references_followed_pages_page CASCADE');
        await queryRunner.query('DROP TABLE IF EXISTS user_references_memeber_in_groups_group CASCADE');

        // Drop any enum types
        await queryRunner.query('DROP TYPE IF EXISTS post_visibility_enum CASCADE');
        await queryRunner.query('DROP TYPE IF EXISTS group_visibility_enum CASCADE');
        await queryRunner.query('DROP TYPE IF EXISTS page_visibility_enum CASCADE');
        await queryRunner.query('DROP TYPE IF EXISTS news_feed_visibility_enum CASCADE');
        await queryRunner.query('DROP TYPE IF EXISTS page_category_enum CASCADE');
        await queryRunner.query('DROP TYPE IF EXISTS post_attachment_attachmenttype_enum CASCADE');
        await queryRunner.query('DROP TYPE IF EXISTS story_attachmenttype_enum CASCADE');
        await queryRunner.query('DROP TYPE IF EXISTS user_react_post_enum CASCADE');
        await queryRunner.query('DROP TYPE IF EXISTS user_react_story_enum CASCADE');

        console.log(`Feed database ${dbName} tables dropped successfully.`);

        await dataSource.destroy();
    } catch (error) {
        console.error('Error dropping feed database tables:', error);
        throw error;
    }
};

if (require.main === module) {
    dropDatabase()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Failed to drop feed database:', error);
            process.exit(1);
        });
}

export {dropDatabase};
