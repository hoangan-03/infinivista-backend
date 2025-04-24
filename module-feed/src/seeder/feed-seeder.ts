import {AppDataSource} from '@/datasource/data-source';

import {seedFeedDatabase} from './feed.seed';

const runSeed = async () => {
    try {
        await AppDataSource.initialize();
        console.log('Connected to module-feed database');

        try {
            await seedFeedDatabase(AppDataSource);
            console.log('Seeds feed-module planted successfully');
        } catch (seedError) {
            console.error('Error during seeding feed-module process:');
            console.error(seedError);
            process.exit(1);
        }

        await AppDataSource.destroy();
        console.log('Connection closed');
    } catch (error) {
        console.error('Error connecting to database:');
        console.error(error);
        process.exit(1);
    }
};

runSeed();
