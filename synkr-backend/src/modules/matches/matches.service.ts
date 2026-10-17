import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MatchStatus } from '../../common/enums';
import { DiscoverService, UserCard } from '../discover/discover.service';
import { User } from '../users/user.entity';
import { Match } from './match.entity';

export interface MatchView {
  id: string;
  status: MatchStatus;
  direction: 'OUTGOING' | 'INCOMING';
  createdAt: Date;
  user: UserCard;
}

/**
 * Pedido de troca entre duas pessoas compatíveis.
 * SUGGESTED = pedido pendente (userA pediu, userB ainda não respondeu); ACCEPTED = ligados (podem falar no chat, Fase 4);
 * DECLINED = recusado.
 */
@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match) private readonly matches: Repository<Match>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly discover: DiscoverService,
  ) {}

  async request(meId: string, targetId: string) {
    if (meId === targetId) throw new BadRequestException('Não podes pedir uma troca a ti próprio');
    const card = await this.discover.card(meId, targetId); // 404 se não existir
    if (card.compatibility.type === 'NONE') {
      throw new BadRequestException('Não têm competências compatíveis para trocar');
    }

    const existing = await this.matches.findOne({
      where: [
        { userAId: meId, userBId: targetId },
        { userAId: targetId, userBId: meId },
      ],
    });
    if (existing) {
      const mine = existing.userAId === meId;
      if (existing.status === MatchStatus.ACCEPTED) throw new ConflictException('Já estão ligados');
      if (existing.status === MatchStatus.SUGGESTED) {
        if (mine) throw new ConflictException('Já enviaste um pedido a esta pessoa');
        // a outra pessoa já tinha pedido: pedir de volta equivale a aceitar
        existing.status = MatchStatus.ACCEPTED;
        await this.matches.save(existing);
        return { id: existing.id, status: existing.status, direction: 'INCOMING' as const };
      }
      // DECLINED
      if (mine) throw new ConflictException('Esta pessoa recusou o teu pedido');
      await this.matches.delete(existing.id); // tinhas recusado; agora o pedido parte de ti
    }

    const created = await this.matches.save(
      this.matches.create({ userAId: meId, userBId: targetId, status: MatchStatus.SUGGESTED }),
    );
    return { id: created.id, status: created.status, direction: 'OUTGOING' as const };
  }

  async list(meId: string, box: 'incoming' | 'outgoing' | 'accepted'): Promise<MatchView[]> {
    const where =
      box === 'incoming' ? [{ userBId: meId, status: MatchStatus.SUGGESTED }]
      : box === 'outgoing' ? [{ userAId: meId, status: MatchStatus.SUGGESTED }]
      : [
          { userAId: meId, status: MatchStatus.ACCEPTED },
          { userBId: meId, status: MatchStatus.ACCEPTED },
        ];
    const rows = await this.matches.find({ where, order: { createdAt: 'DESC' } });
    if (!rows.length) return [];

    const otherOf = (r: Match) => (r.userAId === meId ? r.userBId : r.userAId);
    const users = await this.users.find({ where: { id: In(rows.map(otherOf)) } });
    const cards = new Map((await this.discover.buildCards(meId, users)).map((c) => [c.id, c]));

    return rows
      .filter((r) => cards.has(otherOf(r)))
      .map((r) => ({
        id: r.id,
        status: r.status,
        direction: r.userAId === meId ? ('OUTGOING' as const) : ('INCOMING' as const),
        createdAt: r.createdAt,
        user: cards.get(otherOf(r))!,
      }));
  }

  async summary(meId: string) {
    const [incoming, outgoing, accepted] = await Promise.all([
      this.matches.count({ where: { userBId: meId, status: MatchStatus.SUGGESTED } }),
      this.matches.count({ where: { userAId: meId, status: MatchStatus.SUGGESTED } }),
      this.matches.count({ where: [{ userAId: meId, status: MatchStatus.ACCEPTED }, { userBId: meId, status: MatchStatus.ACCEPTED }] }),
    ]);
    return { incoming, outgoing, accepted };
  }

  async accept(meId: string, matchId: string) {
    return this.decide(meId, matchId, MatchStatus.ACCEPTED);
  }

  async decline(meId: string, matchId: string) {
    return this.decide(meId, matchId, MatchStatus.DECLINED);
  }

  /** Cancela um pedido que tu enviaste e ainda está pendente. */
  async cancel(meId: string, matchId: string) {
    const match = await this.matches.findOne({ where: { id: matchId, userAId: meId } });
    if (!match) throw new NotFoundException('Pedido não encontrado');
    if (match.status !== MatchStatus.SUGGESTED) throw new BadRequestException('Só podes cancelar pedidos pendentes');
    await this.matches.delete(match.id);
    return { message: 'Pedido cancelado' };
  }

  private async decide(meId: string, matchId: string, status: MatchStatus) {
    // só quem recebeu o pedido pode responder
    const match = await this.matches.findOne({ where: { id: matchId, userBId: meId } });
    if (!match) throw new NotFoundException('Pedido não encontrado');
    if (match.status !== MatchStatus.SUGGESTED) throw new BadRequestException('Este pedido já foi tratado');
    match.status = status;
    await this.matches.save(match);
    return { id: match.id, status: match.status, direction: 'INCOMING' as const };
  }
}
