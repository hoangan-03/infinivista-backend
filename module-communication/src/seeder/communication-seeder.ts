import {AppDataSource} from '@/datasource/data-source';

import {seedCommunicationDatabase} from './communication.seed';

const runSeed = async () => {
    try {
        await AppDataSource.initialize();
        console.log('Connected to module-communication database');

        try {
            await seedCommunicationDatabase(AppDataSource);
            console.log('Seeds communication-module planted successfully');
        } catch (seedError) {
            console.error('Error during seeding communication-module process:');
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
