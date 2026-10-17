import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CodePurpose } from '../../common/enums';
import { UserSkill } from './user-skill.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 80 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 255 })
  email: string;

  @Index({ unique: true })
  @Column({ length: 40 })
  handle: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  headline: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ default: false })
  emailVerified: boolean;

  /** true depois de escolher pelo menos 1 competência a ensinar e 1 a aprender */
  @Column({ default: false })
  onboardingCompleted: boolean;

  // Código de 6 dígitos (verificação de e-mail ou recuperação de palavra-passe). Guardado só como hash.
  @Column({ type: 'varchar', nullable: true })
  codeHash: string | null;

  @Column({ type: 'enum', enum: CodePurpose, nullable: true })
  codePurpose: CodePurpose | null;

  @Column({ type: 'timestamptz', nullable: true })
  codeExpiresAt: Date | null;

  @Column({ type: 'int', default: 0 })
  codeAttempts: number;

  @Column({ type: 'varchar', nullable: true })
  refreshTokenHash: string | null;

  @OneToMany(() => UserSkill, (us) => us.user)
  skills: UserSkill[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
