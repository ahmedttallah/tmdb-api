import axios from 'axios';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Movie } from './movie.entity';
import { ConfigService } from '@nestjs/config';
import { TmdbMovieDto } from './dto/tmdb-movie.dto';
import { GetMoviesDto } from './dto/get-movies.dto';
import { GenreName, genreNameToIdMap } from 'src/shared/constants/genre-list';

@Injectable()
export class MoviesService {
  private readonly tmdbBaseUrl: string;
  private readonly tmdbAccessToken: string;
  private readonly tmdbApiKey: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Movie) private movieRepo: Repository<Movie>,
  ) {
    this.tmdbBaseUrl = this.configService.get<string>('TMDB_API_BASE_URL')!;
    this.tmdbAccessToken = this.configService.get<string>('TMDB_API_TOKEN')!;
    this.tmdbApiKey = this.configService.get<string>('TMDB_API_KEY')!;
  }

  async syncPopularMoviesFromTMDB(pageLimit = 5): Promise<{ message: string }> {
    if (!this.tmdbApiKey || !this.tmdbAccessToken || !this.tmdbBaseUrl) {
      throw new Error('TMDB API credentials are not configured properly.');
    }

    try {
      const fetchPage = (page: number) =>
        axios.get<{ results: TmdbMovieDto[] }>(
          `${this.tmdbBaseUrl}/movie/popular`,
          {
            params: {
              api_key: this.tmdbApiKey,
              language: 'en-US',
              page,
            },
            headers: {
              Authorization: `Bearer ${this.tmdbAccessToken}`,
            },
          },
        );

      const responses = await Promise.all(
        Array.from({ length: pageLimit }, (_, i) => fetchPage(i + 1)),
      );

      const allMovies = responses.flatMap((res) => res.data?.results || []);

      if (allMovies.length === 0) {
        return { message: 'No movies found from TMDB.' };
      }

      const uniqueMoviesMap = new Map<number, TmdbMovieDto>();
      for (const movie of allMovies) {
        if (!uniqueMoviesMap.has(movie.id)) {
          uniqueMoviesMap.set(movie.id, movie);
        }
      }

      const uniqueMovies = Array.from(uniqueMoviesMap.values());

      const movieEntities = this.transformToMovieEntities(uniqueMovies);
      await this.movieRepo.save(movieEntities);

      return {
        message: `${movieEntities.length} unique movies synced from TMDB.`,
      };
    } catch (error) {
      console.error('TMDB Sync Error:', error);
      throw new Error('Failed to sync TMDB movies');
    }
  }

  private transformToMovieEntities(movies: TmdbMovieDto[]): Movie[] {
    return movies.map((movie) =>
      this.movieRepo.create({
        id: movie.id,
        title: movie.title,
        adult: movie.adult,
        backdrop_path: movie.backdrop_path,
        genre_ids: movie.genre_ids,
        original_language: movie.original_language,
        original_title: movie.original_title,
        overview: movie.overview,
        popularity: movie.popularity,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        video: movie.video,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
      }),
    );
  }

  async getMovies(query: GetMoviesDto) {
    const {
      search,
      genreId,
      genreName,
      language,
      releaseYear,
      minVoteAverage,
      maxVoteAverage,
      minPopularity,
      maxPopularity,
      adult,
      page = 1,
      limit = 10,
    } = query;

    const qb = this.movieRepo.createQueryBuilder('movie');

    if (search) {
      qb.andWhere(
        `(
      LOWER(movie.title) LIKE LOWER(:search) 
      OR LOWER(movie.original_title) LIKE LOWER(:search) 
      OR CAST(movie.id AS TEXT) LIKE :search
    )`,
        { search: `%${search}%` },
      );
    }

    if (genreId || GenreName) {
      const genreIdsFromId = Array.isArray(genreId)
        ? genreId.map(Number)
        : genreId
          ? String(genreId)
              .split(',')
              .map((id) => Number(id))
          : [];

      const genreNamesArray = Array.isArray(genreName)
        ? genreName
        : genreName
          ? [genreName]
          : [];

      const genreIdsFromName = genreNamesArray
        .map((name) => genreNameToIdMap[name])
        .filter(Boolean);

      // Combine both, remove duplicates
      const allGenreIds = Array.from(
        new Set([...genreIdsFromId, ...genreIdsFromName]),
      );

      if (allGenreIds.length > 0) {
        qb.andWhere('movie.genre_ids && ARRAY[:...genreIds]::int[]', {
          genreIds: allGenreIds,
        });
      }
    }

    if (language) {
      qb.andWhere('movie.original_language = :language', { language });
    }

    if (releaseYear) {
      qb.andWhere('EXTRACT(YEAR FROM movie.release_date::date) = :year', {
        year: releaseYear,
      });
    }

    if (minVoteAverage) {
      qb.andWhere('movie.vote_average >= :minVoteAverage', { minVoteAverage });
    }
    if (maxVoteAverage) {
      qb.andWhere('movie.vote_average <= :maxVoteAverage', { maxVoteAverage });
    }

    if (minPopularity) {
      qb.andWhere('movie.popularity >= :minPopularity', { minPopularity });
    }
    if (maxPopularity) {
      qb.andWhere('movie.popularity <= :maxPopularity', { maxPopularity });
    }

    if (adult !== undefined) {
      qb.andWhere('movie.adult = :adult', { adult });
    }

    qb.leftJoin('movie.ratings', 'rating');

    qb.select('movie');
    qb.addSelect('AVG(rating.score)', 'averageRating');
    qb.groupBy('movie.id');

    qb.orderBy('movie.popularity', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    qb.cache(`movies_${JSON.stringify(query)}`, 60_000);

    const result = await qb.getRawAndEntities();

    // get count separately (without pagination)
    const countQb = this.movieRepo.createQueryBuilder('movie');

    // same filters applied on count query (except join, groupBy, orderBy, pagination)
    if (search) {
      countQb.andWhere(
        '(LOWER(movie.title) LIKE LOWER(:search) OR LOWER(movie.original_title) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (genreId) {
      const genreArray = Array.isArray(genreId)
        ? genreId.map(Number)
        : String(genreId).split(',').map(Number);

      countQb.andWhere('movie.genre_ids && ARRAY[:...genreArray]::int[]', {
        genreArray,
      });
    }

    if (language) {
      countQb.andWhere('movie.original_language = :language', { language });
    }

    if (releaseYear) {
      countQb.andWhere('EXTRACT(YEAR FROM movie.release_date::date) = :year', {
        year: releaseYear,
      });
    }

    if (minVoteAverage) {
      countQb.andWhere('movie.vote_average >= :minVoteAverage', {
        minVoteAverage,
      });
    }
    if (maxVoteAverage) {
      countQb.andWhere('movie.vote_average <= :maxVoteAverage', {
        maxVoteAverage,
      });
    }

    if (minPopularity) {
      countQb.andWhere('movie.popularity >= :minPopularity', { minPopularity });
    }
    if (maxPopularity) {
      countQb.andWhere('movie.popularity <= :maxPopularity', { maxPopularity });
    }

    if (adult !== undefined) {
      countQb.andWhere('movie.adult = :adult', { adult });
    }

    const total = await countQb.getCount();

    const movies = result.entities;
    const raw = result.raw as { averageRating: string | null }[];

    const results = movies.map((movie, index) => {
      const avgRatingRaw = raw[index]?.averageRating;
      const avgRating = avgRatingRaw ? parseFloat(avgRatingRaw) : null;
      return {
        ...movie,
        averageRating: avgRating,
      };
    });

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      results,
    };
  }
}
