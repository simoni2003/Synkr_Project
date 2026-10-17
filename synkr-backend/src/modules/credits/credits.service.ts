import { BadRequestException, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CreditReason } from '../../common/enums';
import { Paged } from '../../common/page-query.dto';
import { TimeCredit } from './time-credit.entity';

export interface CreditSummary {
  /** saldo atual em minutos (60 = 1 crédito = 1 hora) */
  balanceMinutes: number;
  /** total de minutos ensinados (ganhos) */
  taughtMinutes: number;
  /** total de minutos aprendidos (gastos) */
  learnedMinutes: number;
}

export interface CreditTransaction {
  id: string;
  minutes: number;
  reason: CreditReason;
  createdAt: Date;
  session: { id: string; skillName: string; withUser: { id: string; name: string } } | null;
}

/**
 * Banco de tempo. O saldo é sempre a soma do livro-razão (`time_credits`), nunca um contador.
 * Os métodos `assertCanAfford` e `settleSession` são usados pelas Fases 5 (agendamento) e 6 (sala virtual).
 */
@Injectable()
export class CreditsService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Credits');

  constructor(
    @InjectRepository(TimeCredit) private readonly credits: Repository<TimeCredit>,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  /** Minutos de crédito inicial. Resolve o "ovo e galinha": sem saldo ninguém consegue pedir a primeira aula. */
  get signupBonusMinutes(): number {
    const n = Number(this.config.get('CREDIT_SIGNUP_BONUS_MINUTES') ?? 60);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }

  /** Dá o bónus inicial a contas já confirmadas que ainda não o têm (útil para contas criadas antes da Fase 3). */
  async onApplicationBootstrap() {
    if (!this.signupBonusMinutes) return;
    try {
      const rows: { id: string }[] = await this.dataSource.query(
        `SELECT u.id FROM users u
         WHERE u."emailVerified" = true
           AND NOT EXISTS (SELECT 1 FROM time_credits t WHERE t."userId" = u.id AND t."reason" = 'SIGNUP_BONUS')`,
      );
      if (!rows.length) return;
      await this.credits
        .createQueryBuilder()
        .insert()
        .into(TimeCredit)
        .values(rows.map((r) => ({ userId: r.id, minutes: this.signupBonusMinutes, reason: CreditReason.SIGNUP_BONUS })))
        .orIgnore()
        .execute();
      this.logger.log(`Bónus inicial atribuído a ${rows.length} conta(s) existente(s).`);
    } catch (e) {
      this.logger.warn(`Não foi possível atribuir o bónus às contas existentes: ${(e as Error).message}`);
    }
  }

  async grantSignupBonus(userId: string) {
    if (!this.signupBonusMinutes) return;
    await this.credits
      .createQueryBuilder()
      .insert()
      .into(TimeCredit)
      .values({ userId, minutes: this.signupBonusMinutes, reason: CreditReason.SIGNUP_BONUS })
      .orIgnore() // índice único: só 1 bónus por utilizador
      .execute();
  }

  async summary(userId: string, manager?: EntityManager): Promise<CreditSummary> {
    const repo = manager ? manager.getRepository(TimeCredit) : this.credits;
    const r = await repo
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.minutes), 0)', 'balance')
      .addSelect('COALESCE(SUM(CASE WHEN c.reason = :taught THEN c.minutes ELSE 0 END), 0)', 'taught')
      .addSelect('COALESCE(SUM(CASE WHEN c.reason = :learned THEN -c.minutes ELSE 0 END), 0)', 'learned')
      .where('c.userId = :userId', { userId })
      .setParameters({ taught: CreditReason.SESSION_TAUGHT, learned: CreditReason.SESSION_LEARNED })
      .getRawOne();
    return {
      balanceMinutes: Number(r?.balance ?? 0),
      taughtMinutes: Number(r?.taught ?? 0),
      learnedMinutes: Number(r?.learned ?? 0),
    };
  }

  async getBalance(userId: string, manager?: EntityManager): Promise<number> {
    return (await this.summary(userId, manager)).balanceMinutes;
  }

  /** Para pedir uma aula: lança erro se o saldo não chegar. (Fase 5) */
  async assertCanAfford(userId: string, minutes: number, manager?: EntityManager) {
    const balance = await this.getBalance(userId, manager);
    if (balance < minutes) {
      throw new BadRequestException(
        `Saldo insuficiente: tens ${balance} min e a aula custa ${minutes} min. Ensina para ganhar créditos.`,
      );
    }
  }

  /**
   * Liquida uma sessão concluída: quem ensinou ganha `durationMinutes`, quem aprendeu gasta o mesmo.
   * Idempotente (chamar duas vezes não duplica) e aceita um EntityManager para correr dentro da
   * transação da Fase 6. (Fase 6)
   */
  async settleSession(
    session: { id: string; teacherId: string; learnerId: string; durationMinutes: number },
    manager?: EntityManager,
  ) {
    const repo = manager ? manager.getRepository(TimeCredit) : this.credits;
    await repo
      .createQueryBuilder()
      .insert()
      .into(TimeCredit)
      .values([
        { userId: session.teacherId, sessionId: session.id, minutes: session.durationMinutes, reason: CreditReason.SESSION_TAUGHT },
        { userId: session.learnerId, sessionId: session.id, minutes: -session.durationMinutes, reason: CreditReason.SESSION_LEARNED },
      ])
      .orIgnore()
      .execute();
  }

  async transactions(userId: string, limit: number, offset: number): Promise<Paged<CreditTransaction>> {
    const [rows, total] = await this.credits.findAndCount({
      where: { userId },
      relations: { session: { skill: true, teacher: true, learner: true } },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: limit,
      skip: offset,
    });
    const items = rows.map((r) => {
      const s = r.session;
      const other = s ? (s.teacherId === userId ? s.learner : s.teacher) : null;
      return {
        id: r.id,
        minutes: r.minutes,
        reason: r.reason,
        createdAt: r.createdAt,
        session: s && other ? { id: s.id, skillName: s.skill.name, withUser: { id: other.id, name: other.name } } : null,
      };
    });
    return { items, total };
  }
}
