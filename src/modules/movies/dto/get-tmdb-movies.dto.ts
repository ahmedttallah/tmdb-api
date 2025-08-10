import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min } from 'class-validator';

export class GetTmdbMoviesDto {
  @ApiPropertyOptional({
    description: 'Page number',
    type: 'integer',
    format: 'int32',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Genre ID from TMDB',
    type: 'integer',
    example: 28,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  genre?: number;
}
