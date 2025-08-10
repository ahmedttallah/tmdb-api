import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { MoviesService } from '../movies/movies.service';

@Injectable()
export class StartupService implements OnApplicationBootstrap {
  constructor(private readonly moviesService: MoviesService) {}

  async onApplicationBootstrap() {
    console.log('Running startup movie sync...');
    try {
      await this.moviesService.syncPopularMoviesFromTMDB(5);
      console.log('Startup movie sync done.');
    } catch (err) {
      console.error('Startup movie sync failed:', err);
    }
  }
}
