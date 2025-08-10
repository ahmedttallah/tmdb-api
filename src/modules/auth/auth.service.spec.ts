import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
    };

    authService = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
    );
  });

  describe('signup', () => {
    it('should create a new user when email is not taken', async () => {
      usersService.findByEmail!.mockResolvedValue(null);
      usersService.create!.mockResolvedValue({ id: 1, email: 'test@test.com' });

      const createUserDto = {
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User',
      };

      await authService.signup(createUserDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(usersService.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      usersService.findByEmail!.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
      });

      const createUserDto = {
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User',
      };

      await expect(authService.signup(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const user = {
      id: 1,
      email: 'test@test.com',
      password: '$2b$10$7wqXZzqhN2yF6dB7mTf54uw5AZB/.0FFcsxnLR8HtQDe7CpE2fUP2', // hashed 'password123'
      name: 'Test User',
    };

    it('should return access token if credentials are valid', async () => {
      usersService.findByEmail!.mockResolvedValue(user);
      jest.spyOn(bcrypt as any, 'compare').mockResolvedValue(true);

      jwtService.sign!.mockReturnValue('signed-jwt-token');

      const loginDto = { email: 'test@test.com', password: 'password123' };
      const result = await authService.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        name: user.name,
      });
      expect(result).toEqual({ access_token: 'signed-jwt-token' });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail!.mockResolvedValue(null);

      const loginDto = { email: 'wrong@test.com', password: 'password123' };
      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      usersService.findByEmail!.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => false);

      const loginDto = { email: 'test@test.com', password: 'wrongpassword' };
      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
