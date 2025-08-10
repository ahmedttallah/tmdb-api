import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Rating } from './rating.entity';
import { Movie } from '../movies/movie.entity';
import { User } from '../users/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating) private ratingRepo: Repository<Rating>,
    @InjectRepository(Movie) private movieRepo: Repository<Movie>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async rateMovie(userId: number, movieId: number, score: number) {
    if (score < 1 || score > 10)
      throw new BadRequestException('Score must be between 1 and 10');

    const user = await this.userRepo.findOneBy({ id: userId });
    const movie = await this.movieRepo.findOneBy({ id: movieId });
    if (!user || !movie) throw new NotFoundException('User or Movie not found');

    let rating = await this.ratingRepo.findOne({
      where: { userId: user.id, movieId: movie.id },
    });
    if (rating) {
      rating.score = score;
    } else {
      rating = this.ratingRepo.create({ user, movie, score });
    }
    return this.ratingRepo.save(rating);
  }

  async updateRating(userId: number, ratingId: number, score: number) {
    if (score < 1 || score > 10)
      throw new BadRequestException('Score must be between 1 and 10');

    const rating = await this.ratingRepo.findOne({
      where: { id: ratingId },
      relations: ['user', 'movie'],
    });
    if (!rating) throw new NotFoundException('Rating not found');

    if (rating.user.id !== userId)
      throw new ForbiddenException('You cannot update this rating');

    rating.score = score;
    return this.ratingRepo.save(rating);
  }

  async deleteRating(userId: number, ratingId: number) {
    const rating = await this.ratingRepo.findOne({
      where: { id: ratingId },
      relations: ['user'],
    });
    if (!rating) throw new NotFoundException('Rating not found');

    if (rating.user.id !== userId)
      throw new ForbiddenException('You cannot delete this rating');

    await this.ratingRepo.remove(rating);
    return { message: 'Rating deleted successfully' };
  }

  async getUserRating(userId: number, movieId: number) {
    const rating = await this.ratingRepo.findOne({
      where: {
        user: { id: userId },
        movie: { id: movieId },
      },
      relations: ['user', 'movie'],
    });

    if (!rating) return null;

    return {
      id: rating.id,
      movieId: rating.movie.id,
      userId: rating.user.id,
      score: rating.score,
    };
  }

  async getMovieAverageRating(movieId: number): Promise<number | null> {
    const result = await this.ratingRepo
      .createQueryBuilder('rating')
      .select('AVG(rating.score)', 'avg')
      .where('rating.movieId = :movieId', { movieId })
      .getRawOne<{ avg: string | null }>();

    return result?.avg ? parseFloat(result.avg) : null;
  }
}
