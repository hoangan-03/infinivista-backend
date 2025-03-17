import * as dotenv from 'dotenv';
import {Client} from 'pg';

dotenv.config();

const createDatabase = async () => {
    const client = new Client({
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        host: process.env.POSTGRES_HOST,
        port: Number(process.env.POSTGRES_PORT),
        database: 'postgres',
    });

    try {
        await client.connect();

        const {rows} = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [process.env.POSTGRES_DB]);

        if (rows.length === 0) {
            console.log(`Creating database ${process.env.POSTGRES_DB}...`);
            await client.query(`CREATE DATABASE "${process.env.POSTGRES_DB}"`);
            console.log('Database created successfully');
        } else {
            console.log(`Database ${process.env.POSTGRES_DB} already exists`);
        }
    } catch (error) {
        console.error('Error creating database:', error);
    } finally {
        await client.end();
    }
};

createDatabase();

export {createDatabase};
