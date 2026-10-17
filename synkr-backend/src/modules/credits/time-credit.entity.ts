import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { CreditReason } from '../../common/enums';
import { Session } from '../sessions/session.entity';
import { User } from '../users/user.entity';

/**
 * Fase 3: livro-razão do banco de tempo. O saldo de um utilizador é a soma de `minutes`.
 * 60 minutos = 1 crédito. Positivo = ganhou (ensinou), negativo = gastou (aprendeu).
 */
@Entity('time_credits')
// Uma sessão só pode ser liquidada uma vez por utilizador/motivo (liquidação idempotente)
@Unique(['sessionId', 'userId', 'reason'])
// Cada utilizador recebe o bónus de boas-vindas no máximo uma vez
@Index('uq_time_credits_signup_bonus', ['userId'], { unique: true, where: `"reason" = 'SIGNUP_BONUS'` })
export class TimeCredit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  sessionId: string | null;

  @ManyToOne(() => Session, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sessionId' })
  session: Session | null;

  @Column({ type: 'int' })
  minutes: number;

  @Column({ type: 'enum', enum: CreditReason })
  reason: CreditReason;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
