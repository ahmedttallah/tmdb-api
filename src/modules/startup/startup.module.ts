import { Module } from '@nestjs/common';
import { StartupService } from './startup.service';
import { MoviesModule } from '../movies/movies.module';

@Module({
  imports: [MoviesModule],
  providers: [StartupService],
})
export class StartupModule {}
