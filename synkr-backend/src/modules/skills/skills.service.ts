import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SKILLS_SEED } from './skills.seed';
import { Skill } from './skill.entity';

@Injectable()
export class SkillsService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Skills');

  constructor(@InjectRepository(Skill) private readonly skills: Repository<Skill>) {}

  /** Garante que o catálogo base existe (idempotente: só insere o que falta). */
  async onApplicationBootstrap() {
    const existing = new Set((await this.skills.find({ select: { name: true } })).map((s) => s.name));
    const toInsert: Pick<Skill, 'name' | 'category'>[] = [];
    for (const [category, names] of Object.entries(SKILLS_SEED)) {
      for (const name of names) if (!existing.has(name)) toInsert.push({ name, category });
    }
    if (toInsert.length) {
      await this.skills.insert(toInsert);
      this.logger.log(`Catálogo de competências: ${toInsert.length} novas inseridas.`);
    }
  }

  list() {
    return this.skills.find({ order: { category: 'ASC', name: 'ASC' } });
  }
}
