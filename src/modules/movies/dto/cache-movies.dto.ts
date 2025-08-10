import { Movie } from '../movie.entity';

export type MoviesCache = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  results: Movie[];
};
