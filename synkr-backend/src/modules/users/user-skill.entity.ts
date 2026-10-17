import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { SkillLevel, UserSkillKind } from '../../common/enums';
import { Skill } from '../skills/skill.entity';
import { User } from './user.entity';

/** Competência de um utilizador: a ensinar (TEACH) ou a aprender (LEARN), com nível. */
@Entity('user_skills')
@Unique(['userId', 'skillId', 'kind'])
export class UserSkill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (u) => u.skills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  skillId: string;

  @ManyToOne(() => Skill, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skillId' })
  skill: Skill;

  @Column({ type: 'enum', enum: UserSkillKind })
  kind: UserSkillKind;

  @Column({ type: 'enum', enum: SkillLevel })
  level: SkillLevel;
}
