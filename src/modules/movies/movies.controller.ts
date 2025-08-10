import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { SyncMoviesDto } from './dto/sync-movies.dto';
import { GetMoviesDto } from './dto/get-movies.dto';

@ApiTags('Movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post('sync')
  @ApiOperation({ summary: 'Sync popular movies from TMDB' })
  @ApiResponse({ status: 201, description: 'Movies synced successfully.' })
  async syncPopularMovies(@Body() dto: SyncMoviesDto) {
    return this.moviesService.syncPopularMoviesFromTMDB(dto.pages);
  }

  @Get()
  @ApiOperation({ summary: 'List movies with search, filter, and pagination' })
  @ApiResponse({ status: 200, description: 'List of movies' })
  getMovies(@Query() query: GetMoviesDto) {
    return this.moviesService.getMovies(query);
  }
}
