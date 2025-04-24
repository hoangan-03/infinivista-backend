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

    const dataSource = new DataSource({
        type: 'postgres',
        host,
        port,
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DB'),
        synchronize: false,
        logging: true,
    });

    try {
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
                console.log(`Database ${dbName} already exists or error`);
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
        await queryRunner.query('DROP TYPE IF EXISTS profile_privacy_enum CASCADE');
        await queryRunner.query('DROP TYPE IF EXISTS password_reset_enum CASCADE');
        await queryRunner.query('DROP TYPE IF EXISTS friend_status_enum CASCADE');

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
            console.error('Failed to drop user database:', error);
            process.exit(1);
        });
}

export {dropDatabase};
