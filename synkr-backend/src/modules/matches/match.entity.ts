import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { MatchStatus } from '../../common/enums';
import { User } from '../users/user.entity';

/** Fase 2: par de utilizadores compatíveis (A aprende o que B ensina e vice-versa). */
@Entity('matches')
@Unique(['userAId', 'userBId'])
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userAId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userAId' })
  userA: User;

  @Column()
  userBId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userBId' })
  userB: User;

  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.SUGGESTED })
  status: MatchStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
