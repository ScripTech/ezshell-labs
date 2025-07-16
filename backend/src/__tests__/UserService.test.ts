import { UserService } from '../services/UserService';
import { closeConnection } from '../db';

describe('UserService', () => {
  let userService: UserService;

  beforeAll(() => {
    userService = new UserService();
  });

  afterAll(async () => {
    await closeConnection();
  });

  describe('getAllUsers', () => {
    test('should return an array of users', async () => {
      const users = await userService.getAllUsers();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThanOrEqual(0);
    }, 30000);

    test('should return users with correct structure', async () => {
      const users = await userService.getAllUsers();

      if (users.length > 0) {
        const user = users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
      }
    });
  });

  describe('getUserById', () => {
    test('should return null for non-existent user', async () => {
      const user = await userService.getUserById('non-existent-id');
      expect(user).toBeNull();
    });

    test('should return user if exists', async () => {
      // First get all users to get a valid ID
      const users = await userService.getAllUsers();

      if (users.length > 0) {
        const validId = users[0].id;
        const user = await userService.getUserById(validId);

        expect(user).not.toBeNull();
        expect(user?.id).toBe(validId);
      }
    });
  });

  describe('getUserByEmail', () => {
    test('should return null for non-existent email', async () => {
      const user = await userService.getUserByEmail('non-existent@test.com');
      expect(user).toBeNull();
    });

    test('should return user if email exists', async () => {
      // First get all users to get a valid email
      const users = await userService.getAllUsers();

      if (users.length > 0) {
        const validEmail = users[0].email;
        if (validEmail) {
          const user = await userService.getUserByEmail(validEmail);

          expect(user).not.toBeNull();
          expect(user?.email).toBe(validEmail);
        }
      }
    });
  });

  describe('createUser', () => {
    test('should create a new user successfully', async () => {
      const newUserData = {
        id: `test-user-${Date.now()}`,
        name: 'Test User',
        email: `test-${Date.now()}@test.com`,
        role: 'user' as const,
      };

      const createdUser = await userService.createUser(newUserData);

      expect(createdUser).toMatchObject(newUserData);

      // Clean up
      await userService.deleteUser(createdUser.id);
    });
  });

  describe('getUsersByRole', () => {
    test('should return users with specified role', async () => {
      const adminUsers = await userService.getUsersByRole('admin');

      expect(Array.isArray(adminUsers)).toBe(true);
      adminUsers.forEach(user => {
        expect(user.role).toBe('admin');
      });
    });
  });
});
