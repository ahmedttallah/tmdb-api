import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Favorite } from './favorite.entity';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Movie } from '../movies/movie.entity';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(Favorite) private favRepo: Repository<Favorite>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Movie) private movieRepo: Repository<Movie>,
  ) {}

  async addFavorite(userId: number, movieId: number) {
    const user = await this.userRepo.findOneBy({ id: userId });
    const movie = await this.movieRepo.findOneBy({ id: movieId });
    if (!user || !movie) throw new NotFoundException('User or Movie not found');

    const exists = await this.favRepo.findOne({
      where: { userId: user.id, movieId: movie.id },
    });
    if (exists) return exists;

    const favorite = this.favRepo.create({ user, movie });
    return this.favRepo.save(favorite);
  }

  async removeFavorite(userId: number, movieId: number) {
    const favorite = await this.favRepo.findOne({
      where: { user: { id: userId }, movie: { id: movieId } },
    });
    if (!favorite) throw new NotFoundException('Favorite not found');

    return this.favRepo.remove(favorite);
  }

  async getUserFavorites(userId: number) {
    return this.favRepo.find({
      where: { user: { id: userId } },
      relations: ['movie'],
    });
  }
}
