import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty({ example: 755898, description: 'Movie ID to rate' })
  @IsInt()
  movieId: number;

  @ApiProperty({ example: 8, description: 'Rating score between 1 and 10' })
  @IsInt()
  @Min(1)
  @Max(10)
  score: number;
}
