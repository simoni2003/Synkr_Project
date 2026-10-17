import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 80 })
  name: string;

  @Index()
  @Column({ length: 60 })
  category: string;
}
