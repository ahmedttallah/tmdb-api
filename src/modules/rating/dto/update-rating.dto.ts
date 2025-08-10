import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max } from 'class-validator';

export class UpdateRatingDto {
  @ApiProperty({ example: 7, description: 'New rating score between 1 and 10' })
  @IsInt()
  @Min(1)
  @Max(10)
  score: number;
}
