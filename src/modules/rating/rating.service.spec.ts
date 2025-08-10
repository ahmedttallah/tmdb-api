/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { ObjectLiteral, Repository } from 'typeorm';
import { RatingService } from './rating.service';
import { Rating } from './rating.entity';
import { Movie } from '../movies/movie.entity';
import { User } from '../users/user.entity';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepo = <T extends ObjectLiteral>(): Partial<Repository<T>> => ({
  findOneBy: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('RatingService', () => {
  let service: RatingService;
  let ratingRepo: MockRepository<Rating>;
  let movieRepo: MockRepository<Movie>;
  let userRepo: MockRepository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingService,
        { provide: 'RatingRepository', useValue: createMockRepo() },
        { provide: 'MovieRepository', useValue: createMockRepo() },
        { provide: 'UserRepository', useValue: createMockRepo() },
      ],
    })
      // Use getRepositoryToken to match your actual injection token names:
      .overrideProvider('RatingRepository')
      .useValue(createMockRepo())
      .overrideProvider('MovieRepository')
      .useValue(createMockRepo())
      .overrideProvider('UserRepository')
      .useValue(createMockRepo())
      .compile();

    ratingRepo = module.get<MockRepository<Rating>>('RatingRepository');
    movieRepo = module.get<MockRepository<Movie>>('MovieRepository');
    userRepo = module.get<MockRepository<User>>('UserRepository');

    service = new RatingService(
      ratingRepo as any,
      movieRepo as any,
      userRepo as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('rateMovie', () => {
    it('throws if score < 1 or > 10', async () => {
      await expect(service.rateMovie(1, 1, 0)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.rateMovie(1, 1, 11)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws if user or movie not found', async () => {
      userRepo.findOneBy!.mockResolvedValue(null);
      movieRepo.findOneBy!.mockResolvedValue({ id: 1 });

      await expect(service.rateMovie(1, 1, 5)).rejects.toThrow(
        NotFoundException,
      );

      userRepo.findOneBy!.mockResolvedValue({ id: 1 });
      movieRepo.findOneBy!.mockResolvedValue(null);

      await expect(service.rateMovie(1, 1, 5)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates existing rating if found', async () => {
      userRepo.findOneBy!.mockResolvedValue({ id: 1 });
      movieRepo.findOneBy!.mockResolvedValue({ id: 2 });
      const existingRating = { id: 10, userId: 1, movieId: 2, score: 4 };
      ratingRepo.findOne!.mockResolvedValue(existingRating);
      ratingRepo.save!.mockResolvedValue({ ...existingRating, score: 8 });

      const result = await service.rateMovie(1, 2, 8);

      expect(ratingRepo.save).toHaveBeenCalledWith({
        ...existingRating,
        score: 8,
      });
      expect(result.score).toBe(8);
    });

    it('creates new rating if none exists', async () => {
      userRepo.findOneBy!.mockResolvedValue({ id: 1 });
      movieRepo.findOneBy!.mockResolvedValue({ id: 2 });
      ratingRepo.findOne!.mockResolvedValue(null);
      const createdRating = { id: 10, score: 5 };
      ratingRepo.create!.mockReturnValue(createdRating);
      ratingRepo.save!.mockResolvedValue(createdRating);

      const result = await service.rateMovie(1, 2, 5);

      expect(ratingRepo.create).toHaveBeenCalledWith({
        user: { id: 1 },
        movie: { id: 2 },
        score: 5,
      });
      expect(ratingRepo.save).toHaveBeenCalledWith(createdRating);
      expect(result).toBe(createdRating);
    });
  });

  describe('updateRating', () => {
    it('throws if score invalid', async () => {
      await expect(service.updateRating(1, 1, 0)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateRating(1, 1, 11)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws if rating not found', async () => {
      ratingRepo.findOne!.mockResolvedValue(null);
      await expect(service.updateRating(1, 1, 5)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws if user is not owner', async () => {
      ratingRepo.findOne!.mockResolvedValue({
        id: 1,
        user: { id: 2 },
        movie: { id: 3 },
        score: 4,
      });
      await expect(service.updateRating(1, 1, 5)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('updates and saves rating if valid', async () => {
      const rating = {
        id: 1,
        user: { id: 1 },
        movie: { id: 2 },
        score: 4,
      };
      ratingRepo.findOne!.mockResolvedValue(rating);
      ratingRepo.save!.mockResolvedValue({ ...rating, score: 7 });

      const result = await service.updateRating(1, 1, 7);

      expect(ratingRepo.save).toHaveBeenCalledWith({ ...rating, score: 7 });
      expect(result.score).toBe(7);
    });
  });

  describe('deleteRating', () => {
    it('throws if rating not found', async () => {
      ratingRepo.findOne!.mockResolvedValue(null);
      await expect(service.deleteRating(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws if user is not owner', async () => {
      ratingRepo.findOne!.mockResolvedValue({
        id: 1,
        user: { id: 2 },
      });
      await expect(service.deleteRating(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('removes rating if owner', async () => {
      const rating = { id: 1, user: { id: 1 } };
      ratingRepo.findOne!.mockResolvedValue(rating);
      ratingRepo.remove!.mockResolvedValue(undefined);

      const result = await service.deleteRating(1, 1);

      expect(ratingRepo.remove).toHaveBeenCalledWith(rating);
      expect(result).toEqual({ message: 'Rating deleted successfully' });
    });
  });

  describe('getUserRating', () => {
    it('returns null if rating not found', async () => {
      ratingRepo.findOne!.mockResolvedValue(null);
      const result = await service.getUserRating(1, 2);
      expect(result).toBeNull();
    });

    it('returns rating data if found', async () => {
      const rating = {
        id: 10,
        score: 8,
        user: { id: 1 },
        movie: { id: 2 },
      };
      ratingRepo.findOne!.mockResolvedValue(rating);

      const result = await service.getUserRating(1, 2);

      expect(result).toEqual({
        id: 10,
        userId: 1,
        movieId: 2,
        score: 8,
      });
    });
  });

  describe('getMovieAverageRating', () => {
    it('returns average rating as number', async () => {
      const avgStr = '7.5';
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg: avgStr }),
      };

      ratingRepo.createQueryBuilder!.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getMovieAverageRating(1);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'AVG(rating.score)',
        'avg',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'rating.movieId = :movieId',
        { movieId: 1 },
      );
      expect(result).toBe(parseFloat(avgStr));
    });

    it('returns null if no average', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg: null }),
      };
      ratingRepo.createQueryBuilder!.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getMovieAverageRating(1);
      expect(result).toBeNull();
    });
  });
});
