import {Test, TestingModule} from '@nestjs/testing';
import {getRepositoryToken} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {SecurityAnswer} from '@/entities/local/security-answer.entity';
import {Setting} from '@/entities/local/setting.entity';
import {User} from '@/entities/local/user.entity';

import {UserService} from './user.service';
import {UserEventsService} from './user-events.service';

describe('UserService', () => {
    let userService: UserService;
    let userRepository: Repository<User>;

    const mockUserRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn(),
        })),
        merge: jest.fn(),
    };

    const mockSettingRepository = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockSecurityAnswerRepository = {
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockUserEventsService = {
        publishUserCreated: jest.fn(),
        publishUserUpdated: jest.fn(),
        publishUserDeleted: jest.fn(),
        triggerUserSync: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository,
                },
                {
                    provide: getRepositoryToken(Setting),
                    useValue: mockSettingRepository,
                },
                {
                    provide: getRepositoryToken(SecurityAnswer),
                    useValue: mockSecurityAnswerRepository,
                },
                {
                    provide: UserEventsService,
                    useValue: mockUserEventsService,
                },
            ],
        }).compile();

        userService = module.get<UserService>(UserService);
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));

        // Reset mock calls between tests
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(userService).toBeDefined();
    });

    describe('getUserWithFullProfile', () => {
        it('should return a user with full profile data', async () => {
            const userId = 'test-user-id';
            const mockUser = {id: userId, username: 'testuser'};

            const queryBuilder = userRepository.createQueryBuilder();
            (queryBuilder.getOne as jest.Mock).mockResolvedValue(mockUser);

            const result = await userService.getUserWithFullProfile(userId);

            expect(result).toEqual(mockUser);
            expect(queryBuilder.where).toHaveBeenCalledWith('user.id = :id', {id: userId});
        });

        it('should throw NotFoundException if user not found', async () => {
            const userId = 'non-existent-id';

            const queryBuilder = userRepository.createQueryBuilder();
            (queryBuilder.getOne as jest.Mock).mockResolvedValue(null);

            await expect(userService.getUserWithFullProfile(userId)).rejects.toThrow();
        });
    });

    describe('updateBiography', () => {
        it('should update user biography', async () => {
            const userId = 'test-user-id';
            const newBio = 'This is my new biography';
            const mockUser = {id: userId, username: 'testuser', biography: 'Old bio'};
            const updatedUser = {...mockUser, biography: newBio};

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockUserRepository.save.mockResolvedValue(updatedUser);

            const result = await userService.updateBiography(userId, newBio);

            expect(result.biography).toBe(newBio);
            expect(mockUserRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    biography: newBio,
                })
            );
        });
    });

    describe('addUserEvent', () => {
        it('should add events to user.userEvent array', async () => {
            const userId = 'test-user-id';
            const existingEvents = ['Event 1', 'Event 2'];
            const newEvents = ['New Event 1', 'New Event 2'];
            const mockUser = {id: userId, username: 'testuser', userEvent: existingEvents};

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockUserRepository.save.mockImplementation((user) => Promise.resolve(user));

            const result = await userService.addUserEvent(userId, newEvents);

            expect(result.userEvent).toEqual([...existingEvents, ...newEvents]);
            expect(mockUserRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    userEvent: [...existingEvents, ...newEvents],
                })
            );
        });

        it('should initialize userEvent array if it does not exist', async () => {
            const userId = 'test-user-id';
            const newEvents = ['New Event 1', 'New Event 2'];
            const mockUser = {id: userId, username: 'testuser'};

            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockUserRepository.save.mockImplementation((user) => Promise.resolve(user));

            const result = await userService.addUserEvent(userId, newEvents);

            expect(result.userEvent).toEqual(newEvents);
        });
    });
});
