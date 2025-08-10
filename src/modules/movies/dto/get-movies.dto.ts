import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { GenreName } from 'src/shared/constants/genre-list';

export class GetMoviesDto {
  @ApiPropertyOptional({ description: 'Search by title or original title' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by genre IDs (numbers) or comma separated string',
    example: '53,16',
  })
  @IsOptional()
  genreId?: string;

  @ApiPropertyOptional({
    enum: GenreName,
    isArray: true,
    description: 'Filter by genre names',
  })
  @IsEnum(GenreName, { each: true })
  @IsOptional()
  genreName?: GenreName | GenreName[];

  @ApiPropertyOptional({
    description: 'Filter by language code',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Filter by release year', example: 2025 })
  @IsOptional()
  @Type(() => Number)
  releaseYear?: number;

  @ApiPropertyOptional({ description: 'Minimum vote average' })
  @IsOptional()
  @Type(() => Number)
  minVoteAverage?: number;

  @ApiPropertyOptional({ description: 'Maximum vote average' })
  @IsOptional()
  @Type(() => Number)
  maxVoteAverage?: number;

  @ApiPropertyOptional({ description: 'Minimum popularity' })
  @IsOptional()
  @Type(() => Number)
  minPopularity?: number;

  @ApiPropertyOptional({ description: 'Maximum popularity' })
  @IsOptional()
  @Type(() => Number)
  maxPopularity?: number;

  @ApiPropertyOptional({ description: 'Adult movies filter (true/false)' })
  @IsOptional()
  @Type(() => Boolean)
  adult?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit: number = 10;
}
