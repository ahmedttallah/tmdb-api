import {
  Controller,
  UseGuards,
  Req,
  Post,
  Delete,
  Get,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FavoriteService } from './favorite.service';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../shared/interfaces/auth-user.interface';

@ApiTags('Favorites')
@Controller('favorites')
export class FavoriteController {
  constructor(private favService: FavoriteService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':movieId')
  @ApiOperation({ summary: 'Add a movie to favorites' })
  async addFavorite(
    @Req() req: AuthenticatedRequest,
    @Param('movieId') movieId: number,
  ) {
    return this.favService.addFavorite(req.user.id, movieId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':movieId')
  @ApiOperation({ summary: 'Remove a movie from favorites' })
  async removeFavorite(
    @Req() req: AuthenticatedRequest,
    @Param('movieId') movieId: number,
  ) {
    return this.favService.removeFavorite(req.user.id, movieId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Get current user favorites' })
  async getFavorites(@Req() req: AuthenticatedRequest) {
    return this.favService.getUserFavorites(req.user.id);
  }
}
