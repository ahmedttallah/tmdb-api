import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Body,
  UseGuards,
  Req,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateRatingDto } from './dto/create-rating.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { RatingService } from './rating.service';
import { AuthenticatedRequest } from '../../shared/interfaces/auth-user.interface';
import { UpdateRatingDto } from './dto/update-rating.dto';

@ApiTags('Ratings')
@Controller('ratings')
export class RatingController {
  constructor(private ratingsService: RatingService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('rate')
  @ApiOperation({ summary: 'Rate a movie or update existing rating' })
  @ApiResponse({
    status: 201,
    description: 'Rating created or updated successfully',
  })
  async rateMovie(
    @Req() req: AuthenticatedRequest,
    @Body() createRatingDto: CreateRatingDto,
  ) {
    const userId = req.user.id;
    return this.ratingsService.rateMovie(
      userId,
      createRatingDto.movieId,
      createRatingDto.score,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Update a rating by its ID' })
  @ApiResponse({
    status: 200,
    description: 'Rating updated successfully',
  })
  async updateRating(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) ratingId: number,
    @Body() updateRatingDto: UpdateRatingDto,
  ) {
    const userId = req.user.id;
    return this.ratingsService.updateRating(
      userId,
      ratingId,
      updateRatingDto.score,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a rating by its ID' })
  @ApiResponse({
    status: 200,
    description: 'Rating deleted successfully',
  })
  async deleteRating(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) ratingId: number,
  ) {
    const userId = req.user.id;
    return this.ratingsService.deleteRating(userId, ratingId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('movie/:movieId/user')
  @ApiOperation({ summary: 'Get logged-in user rating for a specific movie' })
  @ApiResponse({
    status: 200,
    description: 'User rating retrieved successfully',
  })
  async getUserRating(
    @Req() req: AuthenticatedRequest,
    @Param('movieId', ParseIntPipe) movieId: number,
  ) {
    const userId = req.user.id;
    return this.ratingsService.getUserRating(userId, movieId);
  }

  @ApiOperation({ summary: 'Get average rating for a movie' })
  @ApiResponse({
    status: 200,
    description: 'Average rating retrieved successfully',
  })
  @Get('movie/:id/average')
  async getAverage(@Param('id', ParseIntPipe) movieId: number) {
    return {
      averageRating: await this.ratingsService.getMovieAverageRating(movieId),
    };
  }
}
