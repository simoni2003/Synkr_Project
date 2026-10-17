import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { MatchStatus, UserSkillKind } from '../../common/enums';
import { Paged } from '../../common/page-query.dto';
import { Match } from '../matches/match.entity';
import { UserSkill } from '../users/user-skill.entity';
import { User } from '../users/user.entity';
import type { SkillView } from '../users/users.service';
import { SearchQueryDto, SuggestionsQueryDto } from './dto/discover.dto';

export type CompatType = 'MUTUAL' | 'TEACHES_YOU' | 'LEARNS_FROM_YOU' | 'NONE';

export interface Compatibility {
  type: CompatType;
  /** competências que esta pessoa ensina e tu queres aprender */
  youCanLearn: SkillView[];
  /** competências que tu ensinas e esta pessoa quer aprender */
  theyCanLearn: SkillView[];
  score: number;
}

export interface Relation {
  matchId: string;
  status: MatchStatus;
  /** OUTGOING = o pedido foi feito por ti; INCOMING = foi feito por essa pessoa */
  direction: 'OUTGOING' | 'INCOMING';
}

export interface UserCard {
  id: string;
  name: string;
  handle: string;
  headline: string | null;
  city: string | null;
  bio: string | null;
  teach: SkillView[];
  learn: SkillView[];
  compatibility: Compatibility;
  relation: Relation | null;
}

interface SkillSets {
  teach: SkillView[];
  learn: SkillView[];
}

/**
 * Algoritmo de compatibilidade (troca direta 1-para-1).
 *  - MUTUAL: eu aprendo o que o outro ensina E o outro aprende o que eu ensino (a troca ideal)
 *  - TEACHES_YOU: o outro ensina algo que quero aprender (usa créditos do banco de tempo)
 *  - LEARNS_FROM_YOU: o outro quer aprender algo que eu ensino (ganho créditos)
 * Pontuação: 100 se mútua + 10 por competência em comum + 3 por cada uma que o outro ensina a nível avançado.
 */
export function computeCompatibility(me: SkillSets, other: SkillSets): Compatibility {
  const myLearn = new Set(me.learn.map((s) => s.skillId));
  const theirLearn = new Set(other.learn.map((s) => s.skillId));
  const youCanLearn = other.teach.filter((s) => myLearn.has(s.skillId));
  const theyCanLearn = me.teach.filter((s) => theirLearn.has(s.skillId));

  const type: CompatType =
    youCanLearn.length && theyCanLearn.length ? 'MUTUAL'
    : youCanLearn.length ? 'TEACHES_YOU'
    : theyCanLearn.length ? 'LEARNS_FROM_YOU'
    : 'NONE';

  const score =
    type === 'NONE'
      ? 0
      : (type === 'MUTUAL' ? 100 : 0) +
        10 * (youCanLearn.length + theyCanLearn.length) +
        3 * youCanLearn.filter((s) => s.level === 'ADVANCED').length;

  return { type, youCanLearn, theyCanLearn, score };
}

@Injectable()
export class DiscoverService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserSkill) private readonly userSkills: Repository<UserSkill>,
    @InjectRepository(Match) private readonly matches: Repository<Match>,
  ) {}

  // ---------- Sugestões (match) ----------

  async suggestions(meId: string, q: SuggestionsQueryDto): Promise<Paged<UserCard>> {
    const mine = (await this.skillsOf([meId])).get(meId)!;
    if (!mine.teach.length || !mine.learn.length) return { items: [], total: 0 };

    // 1) candidatos: quem ensina algo que quero aprender OU quer aprender algo que ensino
    const rows: { userId: string }[] = await this.userSkills
      .createQueryBuilder('us')
      .innerJoin('us.user', 'u')
      .select('us.userId', 'userId')
      .distinct(true)
      .where('u.emailVerified = true AND u.onboardingCompleted = true')
      .andWhere('us.userId != :me', { me: meId })
      .andWhere(
        new Brackets((b) =>
          b
            .where('us.kind = :teach AND us.skillId IN (:...myLearn)')
            .orWhere('us.kind = :learn AND us.skillId IN (:...myTeach)'),
        ),
      )
      .setParameters({
        teach: UserSkillKind.TEACH,
        learn: UserSkillKind.LEARN,
        myLearn: mine.learn.map((s) => s.skillId),
        myTeach: mine.teach.map((s) => s.skillId),
      })
      .getRawMany();
    if (!rows.length) return { items: [], total: 0 };

    // 2) cartões completos, sem quem já está ligado ou recusou
    const users = await this.users.find({ where: { id: In(rows.map((r) => r.userId)) } });
    let cards = await this.buildCards(meId, users);
    cards = cards.filter(
      (c) =>
        c.compatibility.type !== 'NONE' &&
        c.relation?.status !== MatchStatus.ACCEPTED &&
        c.relation?.status !== MatchStatus.DECLINED &&
        (!q.mutualOnly || c.compatibility.type === 'MUTUAL'),
    );

    // 3) melhor pontuação primeiro
    cards.sort((a, b) => b.compatibility.score - a.compatibility.score || a.name.localeCompare(b.name));
    return { items: cards.slice(q.offset, q.offset + q.limit), total: cards.length };
  }

  // ---------- Pesquisa com filtros (quem ensina...) ----------

  async search(meId: string, q: SearchQueryDto): Promise<Paged<UserCard>> {
    const total = Number(
      (await this.teacherQuery(meId, q).select('COUNT(DISTINCT us.userId)', 'c').getRawOne())?.c ?? 0,
    );
    if (!total) return { items: [], total: 0 };

    const rows: { userId: string }[] = await this.teacherQuery(meId, q)
      .select('us.userId', 'userId')
      .addSelect('u.name', 'name')
      .distinct(true)
      .orderBy('u.name', 'ASC')
      .addOrderBy('us.userId', 'ASC')
      .offset(q.offset)
      .limit(q.limit)
      .getRawMany();

    const ids = rows.map((r) => r.userId);
    const users = await this.users.find({ where: { id: In(ids) } });
    const order = new Map(ids.map((id, i) => [id, i]));
    users.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
    return { items: await this.buildCards(meId, users), total };
  }

  private teacherQuery(meId: string, q: SearchQueryDto) {
    const qb = this.userSkills
      .createQueryBuilder('us')
      .innerJoin('us.user', 'u')
      .innerJoin('us.skill', 's')
      .where('us.kind = :kind', { kind: UserSkillKind.TEACH })
      .andWhere('u.emailVerified = true AND u.onboardingCompleted = true')
      .andWhere('us.userId != :me', { me: meId });
    if (q.skillId) qb.andWhere('us.skillId = :skillId', { skillId: q.skillId });
    if (q.category) qb.andWhere('s.category = :category', { category: q.category });
    if (q.level) qb.andWhere('us.level = :level', { level: q.level });
    if (q.q) {
      const like = `%${q.q.replace(/[\\%_]/g, '\\$&')}%`;
      qb.andWhere(
        new Brackets((b) =>
          b.where('s.name ILIKE :like').orWhere('u.name ILIKE :like').orWhere('u.headline ILIKE :like'),
        ),
      ).setParameter('like', like);
    }
    return qb;
  }

  // ---------- Perfil de outra pessoa (com compatibilidade e estado do pedido) ----------

  async card(meId: string, targetId: string): Promise<UserCard> {
    const user = await this.users.findOne({ where: { id: targetId, emailVerified: true, onboardingCompleted: true } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    return (await this.buildCards(meId, [user]))[0];
  }

  // ---------- Partilhados ----------

  async buildCards(meId: string, users: User[]): Promise<UserCard[]> {
    if (!users.length) return [];
    const ids = users.map((u) => u.id);
    const [skills, relations] = await Promise.all([this.skillsOf([meId, ...ids]), this.relationsOf(meId, ids)]);
    const mine = skills.get(meId)!;
    return users.map((u) => {
      const s = skills.get(u.id)!;
      return {
        id: u.id,
        name: u.name,
        handle: u.handle,
        headline: u.headline,
        city: u.city,
        bio: u.bio,
        teach: s.teach,
        learn: s.learn,
        compatibility: computeCompatibility(mine, s),
        relation: relations.get(u.id) ?? null,
      };
    });
  }

  async skillsOf(ids: string[]): Promise<Map<string, SkillSets>> {
    const map = new Map<string, SkillSets>(ids.map((id) => [id, { teach: [], learn: [] }] as [string, SkillSets]));
    if (!ids.length) return map;
    const rows = await this.userSkills.find({ where: { userId: In(ids) }, relations: { skill: true } });
    for (const r of rows) {
      const view: SkillView = { skillId: r.skillId, name: r.skill.name, category: r.skill.category, level: r.level };
      map.get(r.userId)![r.kind === UserSkillKind.TEACH ? 'teach' : 'learn'].push(view);
    }
    for (const v of map.values()) {
      v.teach.sort((a, b) => a.name.localeCompare(b.name));
      v.learn.sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }

  async relationsOf(meId: string, otherIds: string[]): Promise<Map<string, Relation>> {
    const map = new Map<string, Relation>();
    if (!otherIds.length) return map;
    const rows = await this.matches.find({
      where: [
        { userAId: meId, userBId: In(otherIds) },
        { userBId: meId, userAId: In(otherIds) },
      ],
    });
    for (const r of rows) {
      const outgoing = r.userAId === meId;
      map.set(outgoing ? r.userBId : r.userAId, {
        matchId: r.id,
        status: r.status,
        direction: outgoing ? 'OUTGOING' : 'INCOMING',
      });
    }
    return map;
  }
}
