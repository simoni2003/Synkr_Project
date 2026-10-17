import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { SkillLevel, UserSkillKind } from '../../common/enums';
import { Skill } from '../skills/skill.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSkillsDto } from './dto/update-skills.dto';
import { UserSkill } from './user-skill.entity';
import { User } from './user.entity';

export interface SkillView {
  skillId: string;
  name: string;
  category: string;
  level: SkillLevel;
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  headline: string | null;
  city: string | null;
  bio: string | null;
  onboardingCompleted: boolean;
  teach: SkillView[];
  learn: SkillView[];
  createdAt: Date;
  /** só no perfil do próprio utilizador */
  email?: string;
  emailVerified?: boolean;
}

const TEACH_LEVELS = [SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED];
const LEARN_LEVELS = [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE];

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserSkill) private readonly userSkills: Repository<UserSkill>,
    @InjectRepository(Skill) private readonly skills: Repository<Skill>,
    private readonly dataSource: DataSource,
  ) {}

  findById(id: string) {
    return this.users.findOne({ where: { id } });
  }

  findByEmail(email: string) {
    return this.users.findOne({ where: { email } });
  }

  async create(data: { name: string; email: string; passwordHash: string }) {
    const handle = await this.generateHandle(data.name);
    return this.users.save(this.users.create({ ...data, handle }));
  }

  update(id: string, patch: QueryDeepPartialEntity<User>) {
    return this.users.update(id, patch);
  }

  async getProfile(id: string, self = true): Promise<UserProfile> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    return this.buildProfile(user, self);
  }

  async buildProfile(user: User, self: boolean): Promise<UserProfile> {
    const rows = await this.userSkills.find({ where: { userId: user.id }, relations: { skill: true } });
    const view = (kind: UserSkillKind): SkillView[] =>
      rows
        .filter((r) => r.kind === kind)
        .map((r) => ({ skillId: r.skillId, name: r.skill.name, category: r.skill.category, level: r.level }));

    return {
      id: user.id,
      name: user.name,
      handle: user.handle,
      headline: user.headline,
      city: user.city,
      bio: user.bio,
      onboardingCompleted: user.onboardingCompleted,
      teach: view(UserSkillKind.TEACH),
      learn: view(UserSkillKind.LEARN),
      createdAt: user.createdAt,
      ...(self ? { email: user.email, emailVerified: user.emailVerified } : {}),
    };
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const patch: QueryDeepPartialEntity<User> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.headline !== undefined) patch.headline = dto.headline || null;
    if (dto.city !== undefined) patch.city = dto.city || null;
    if (dto.bio !== undefined) patch.bio = dto.bio || null;
    if (Object.keys(patch).length) await this.users.update(id, patch);
    return this.getProfile(id);
  }

  /** Substitui as competências do utilizador. Exige >= 1 a ensinar e >= 1 a aprender. */
  async setSkills(userId: string, dto: UpdateSkillsDto) {
    const teachIds = dto.teach.map((s) => s.skillId);
    const learnIds = dto.learn.map((s) => s.skillId);
    if (new Set(teachIds).size !== teachIds.length || new Set(learnIds).size !== learnIds.length) {
      throw new BadRequestException('Competência repetida na mesma lista');
    }
    if (teachIds.some((id) => learnIds.includes(id))) {
      throw new BadRequestException('Não podes ensinar e aprender a mesma competência');
    }
    if (dto.teach.some((s) => !TEACH_LEVELS.includes(s.level))) {
      throw new BadRequestException('Para ensinar, o nível tem de ser INTERMEDIATE ou ADVANCED');
    }
    if (dto.learn.some((s) => !LEARN_LEVELS.includes(s.level))) {
      throw new BadRequestException('Para aprender, o nível tem de ser BEGINNER ou INTERMEDIATE');
    }

    const allIds = [...teachIds, ...learnIds];
    const found = await this.skills.count({ where: { id: In(allIds) } });
    if (found !== allIds.length) throw new BadRequestException('Alguma competência não existe no catálogo');

    await this.dataSource.transaction(async (m) => {
      await m.delete(UserSkill, { userId });
      await m.insert(UserSkill, [
        ...dto.teach.map((s) => ({ userId, skillId: s.skillId, level: s.level, kind: UserSkillKind.TEACH })),
        ...dto.learn.map((s) => ({ userId, skillId: s.skillId, level: s.level, kind: UserSkillKind.LEARN })),
      ]);
      await m.update(User, { id: userId }, { onboardingCompleted: true });
    });
    return this.getProfile(userId);
  }

  private async generateHandle(name: string): Promise<string> {
    const base =
      name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20) || 'user';
    for (let i = 0; i < 10; i++) {
      const handle = `@${base}${Math.floor(1000 + Math.random() * 9000)}`;
      if ((await this.users.count({ where: { handle } })) === 0) return handle;
    }
    throw new ConflictException('Não foi possível gerar um identificador. Tenta novamente.');
  }
}
