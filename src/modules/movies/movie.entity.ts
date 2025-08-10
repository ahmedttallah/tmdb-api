import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Rating } from '../rating/rating.entity';
import { Favorite } from '../favorite/favorite.entity';

@Entity('movies')
export class Movie {
  @Column({ type: 'boolean', default: false })
  adult: boolean;

  @Column({ nullable: true })
  backdrop_path: string;

  @Column('int', { array: true })
  genre_ids: number[];

  @PrimaryColumn({ type: 'int', unique: true })
  id: number;

  @Column()
  original_language: string;

  @Column()
  original_title: string;

  @Column('text')
  overview: string;

  @Column({ type: 'float' })
  popularity: number;

  @Column({ nullable: true })
  poster_path: string;

  @Column()
  release_date: string;

  @Column()
  title: string;

  @Column({ type: 'boolean', default: false })
  video: boolean;

  @Column({ type: 'float', default: 0 })
  vote_average: number;

  @Column({ default: 0 })
  vote_count: number;

  @OneToMany(() => Rating, (rating) => rating.movie)
  ratings: Rating[];

  @OneToMany(() => Favorite, (favorite) => favorite.movie)
  favorites: Favorite[];
}
