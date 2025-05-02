import {v4 as uuidv4} from 'uuid';

import {User} from '@/entities/local/user.entity';

export const createMockUser = (override = {}): Partial<User> => {
    const randomId = uuidv4();
    const user: Partial<User> = {
        id: uuidv4(),
        username: `testuser_${Math.floor(Math.random() * 1000)}`,
        email: `test${Math.floor(Math.random() * 1000)}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        profileImageUrl: 'https://example.com/avatar.png',
        biography: 'This is a test user biography',
        userEvent: ['Test Event 1', 'Test Event 2'],
        status: {
            isOnline: true,
            isSuspended: false,
            isDeleted: false,
            id: uuidv4(),
            user_id: randomId,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: {} as User, // Add the required user property
        },
        ...override,
    };
    return user;
};

export const createMockUsers = (count: number): Partial<User>[] => {
    return Array(count)
        .fill(null)
        .map((_, index) => createMockUser({username: `testuser_${index}`}));
};
