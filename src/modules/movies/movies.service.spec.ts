/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { MoviesService } from './movies.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Movie } from './movie.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MoviesService', () => {
  let service: MoviesService;
  let movieRepo: {
    save: jest.Mock;
    create: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  beforeEach(async () => {
    movieRepo = {
      save: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: getRepositoryToken(Movie),
          useValue: movieRepo,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'TMDB_API_BASE_URL':
                  return 'https://api.themoviedb.org/3';
                case 'TMDB_API_TOKEN':
                  return 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwNTVmMzU0NDhmMGFhZTE0OGEyMmQyYWJjYTk0Mjc1ZCIsIm5iZiI6MTc1NDQ4MjI1MS41Niwic3ViIjoiNjg5MzQ2NGIxMWE5ZWY0ZmI3N2QwMzRmIiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9.7Nb0A7kKaoa20v0iUD436Cd_qLzXtFFWb9Pwa54ycAQ';
                case 'TMDB_API_KEY':
                  return '055f35448f0aae148a22d2abca94275d';
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncPopularMoviesFromTMDB', () => {
    it('should throw error if credentials missing', async () => {
      jest.spyOn(service['configService'], 'get').mockReturnValueOnce(null);
      await expect(service.syncPopularMoviesFromTMDB()).rejects.toThrow(
        'Failed to sync TMDB movies',
      );
    });

    it('should sync movies from TMDB and save unique movies', async () => {
      const mockMoviesPage1 = {
        data: {
          results: [
            {
              id: 1,
              title: 'Movie 1',
              genre_ids: [1],
              adult: false,
              backdrop_path: '',
              original_language: 'en',
              original_title: 'Movie 1',
              overview: '',
              popularity: 10,
              poster_path: '',
              release_date: '2020-01-01',
              video: false,
              vote_average: 7,
              vote_count: 100,
            },
          ],
        },
      };
      const mockMoviesPage2 = {
        data: {
          results: [
            {
              id: 2,
              title: 'Movie 2',
              genre_ids: [2],
              adult: false,
              backdrop_path: '',
              original_language: 'en',
              original_title: 'Movie 2',
              overview: '',
              popularity: 20,
              poster_path: '',
              release_date: '2021-01-01',
              video: false,
              vote_average: 8,
              vote_count: 200,
            },
            {
              id: 1,
              title: 'Movie 1',
              genre_ids: [1],
              adult: false,
              backdrop_path: '',
              original_language: 'en',
              original_title: 'Movie 1',
              overview: '',
              popularity: 10,
              poster_path: '',
              release_date: '2020-01-01',
              video: false,
              vote_average: 7,
              vote_count: 100,
            },
          ],
        },
      };

      mockedAxios.get.mockImplementation((url, config) => {
        const page = (config as { params: { page: number } }).params.page;
        if (page === 1) return Promise.resolve(mockMoviesPage1);
        if (page === 2) return Promise.resolve(mockMoviesPage2);
        return Promise.resolve({ data: { results: [] } });
      });

      movieRepo.create.mockImplementation((movie) => movie as Movie);
      movieRepo.save.mockResolvedValue(true);

      const result = await service.syncPopularMoviesFromTMDB(2);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(movieRepo.create).toHaveBeenCalledTimes(2);
      expect(movieRepo.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ message: '2 unique movies synced from TMDB.' });
    });

    it('should return message if no movies found', async () => {
      mockedAxios.get.mockResolvedValue({ data: { results: [] } });
      const result = await service.syncPopularMoviesFromTMDB(1);
      expect(result).toEqual({ message: 'No movies found from TMDB.' });
    });
  });

  describe('getMovies', () => {
    let qbMock: any;

    beforeEach(() => {
      qbMock = {
        andWhere: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        cache: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn(),
      };

      movieRepo.createQueryBuilder.mockReturnValue(qbMock);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      qbMock.getRawAndEntities.mockResolvedValue({
        entities: [{ id: 1, title: 'Movie 1' }],
        raw: [{ averageRating: '7.5' }],
      });

      movieRepo.createQueryBuilder
        .mockReturnValueOnce(qbMock)
        .mockReturnValueOnce({
          andWhere: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(2),
        });
    });

    it('should return paginated movie list with average ratings', async () => {
      const query = { page: 1, limit: 2, search: 'movie' };

      const result = await service.getMovies(query as any);

      expect(movieRepo.createQueryBuilder).toHaveBeenCalled();
      expect(qbMock.andWhere).toHaveBeenCalled();
      expect(qbMock.leftJoin).toHaveBeenCalledWith('movie.ratings', 'rating');
      expect(qbMock.select).toHaveBeenCalledWith('movie');
      expect(qbMock.addSelect).toHaveBeenCalledWith(
        'AVG(rating.score)',
        'averageRating',
      );
      expect(qbMock.orderBy).toHaveBeenCalledWith('movie.popularity', 'DESC');
      expect(result.results.length).toBe(1);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
    });
  });
});
