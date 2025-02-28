// import { AppDataSource } from '@/datasource/data-source';
// import { seedUsers } from '@/seeder/user.seed';

// const runSeed = async () => {
//   try {
//     await AppDataSource.initialize();
//     console.log('Connected to database');

//     const userCount = process.argv[2] ? parseInt(process.argv[2]) : 120;
//     await seedUsers(AppDataSource, userCount);
//     console.log('Seeds planted successfully');

//     await AppDataSource.destroy();
//     console.log('Connection closed');
//   } catch (error) {
//     console.error('Error during seeding:', error);
//     process.exit(1);
//   }
// };

// runSeed();