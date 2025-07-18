import { Column, Entity, PrimaryColumn, TableUnique, Unique } from 'typeorm';

@Entity()
export class Settings {
  @PrimaryColumn({ unique: true })
  id: string;

  @Column()
  value: string;
}
