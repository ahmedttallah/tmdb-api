import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FavoriteService } from './favorite.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Favorite } from './favorite.entity';
import { User } from '../users/user.entity';
import { Movie } from '../movies/movie.entity';
import { ObjectLiteral, Repository } from 'typeorm';

type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('FavoriteService', () => {
  let service: FavoriteService;
  let favRepo: MockRepository<Favorite>;
  let userRepo: MockRepository<User>;
  let movieRepo: MockRepository<Movie>;

  beforeEach(async () => {
    favRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      find: jest.fn(),
    };
    userRepo = {
      findOneBy: jest.fn(),
    };
    movieRepo = {
      findOneBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoriteService,
        { provide: getRepositoryToken(Favorite), useValue: favRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Movie), useValue: movieRepo },
      ],
    }).compile();

    service = module.get<FavoriteService>(FavoriteService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addFavorite', () => {
    it('should throw if user or movie not found', async () => {
      userRepo.findOneBy!.mockResolvedValue(null);
      movieRepo.findOneBy!.mockResolvedValue(null);

      await expect(service.addFavorite(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return existing favorite if already exists', async () => {
      userRepo.findOneBy!.mockResolvedValue({ id: 1 } as User);
      movieRepo.findOneBy!.mockResolvedValue({ id: 1 } as Movie);
      favRepo.findOne!.mockResolvedValue({ id: 123 });

      const result = await service.addFavorite(1, 1);

      expect(favRepo.findOne).toHaveBeenCalledWith({
        where: { userId: 1, movieId: 1 },
      });
      expect(result).toEqual({ id: 123 });
    });

    it('should create and save a new favorite', async () => {
      userRepo.findOneBy!.mockResolvedValue({ id: 1 } as User);
      movieRepo.findOneBy!.mockResolvedValue({ id: 1 } as Movie);
      favRepo.findOne!.mockResolvedValue(null);

      const newFavorite = { user: { id: 1 }, movie: { id: 1 } };
      favRepo.create!.mockReturnValue(newFavorite);
      favRepo.save!.mockResolvedValue(newFavorite);

      const result = await service.addFavorite(1, 1);

      expect(favRepo.create).toHaveBeenCalledWith({
        user: { id: 1 },
        movie: { id: 1 },
      });
      expect(favRepo.save).toHaveBeenCalledWith(newFavorite);
      expect(result).toEqual(newFavorite);
    });
  });

  describe('removeFavorite', () => {
    it('should throw if favorite not found', async () => {
      favRepo.findOne!.mockResolvedValue(null);
      await expect(service.removeFavorite(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should remove favorite', async () => {
      const fav = { id: 1 };
      favRepo.findOne!.mockResolvedValue(fav);
      favRepo.remove!.mockResolvedValue(undefined);

      const result = await service.removeFavorite(1, 1);

      expect(favRepo.remove).toHaveBeenCalledWith(fav);
      expect(result).toBeUndefined();
    });
  });

  describe('getUserFavorites', () => {
    it('should return favorites', async () => {
      const favs = [{ id: 1, movie: { id: 10 } }];
      favRepo.find!.mockResolvedValue(favs);

      const result = await service.getUserFavorites(1);

      expect(favRepo.find).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
        relations: ['movie'],
      });
      expect(result).toEqual(favs);
    });
  });
});
