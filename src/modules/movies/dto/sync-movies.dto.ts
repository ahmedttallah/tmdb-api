import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class SyncMoviesDto {
  @ApiPropertyOptional({
    description: 'Number of pages to sync from TMDB',
    default: 5,
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  pages?: number = 5;
}
