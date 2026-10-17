import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Fase 8: catálogo de emblemas (ex.: MENTOR_TOP_5, HOURS_10_TAUGHT). */
@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 60 })
  code: string;

  @Column({ length: 80 })
  title: string;

  @Column({ length: 200 })
  description: string;

  @Column({ length: 40 })
  icon: string;
}
