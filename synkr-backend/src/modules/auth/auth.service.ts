import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomInt, randomUUID, timingSafeEqual } from 'crypto';
import { CodePurpose } from '../../common/enums';
import { CreditsService } from '../credits/credits.service';
import { MailService } from '../mail/mail.service';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, ResetPasswordDto, VerifyEmailDto } from './dto/auth.dto';

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const BCRYPT_ROUNDS = 12;
// Hash fictício para gastar o mesmo tempo quando o e-mail não existe (evita enumeração por tempo de resposta).
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');
const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
const hashCode = (email: string, code: string) => sha256(`${email}:${code}`);

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly credits: CreditsService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const existing = await this.users.findByEmail(dto.email);

    let user: User;
    if (existing) {
      if (existing.emailVerified) throw new ConflictException('Já existe uma conta com este e-mail');
      // Conta nunca confirmada: permite recomeçar o registo com novos dados.
      await this.users.update(existing.id, { name: dto.name, passwordHash });
      user = { ...existing, name: dto.name };
    } else {
      user = await this.users.create({ name: dto.name, email: dto.email, passwordHash });
    }

    await this.sendCode(user, CodePurpose.VERIFY_EMAIL);
    return { message: 'Enviámos um código de 6 dígitos para o teu e-mail', email: user.email };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new BadRequestException('Código inválido ou expirado');
    await this.consumeCode(user, CodePurpose.VERIFY_EMAIL, dto.code);
    await this.users.update(user.id, { emailVerified: true });
    await this.credits.grantSignupBonus(user.id); // idempotente
    return this.session(user.id);
  }

  async resendCode(email: string) {
    const user = await this.users.findByEmail(email);
    if (user && !user.emailVerified) await this.sendCode(user, CodePurpose.VERIFY_EMAIL);
    return { message: 'Se existir uma conta por confirmar, enviámos um novo código' };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    const ok = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw new UnauthorizedException('E-mail ou palavra-passe incorretos');

    if (!user.emailVerified) {
      await this.sendCode(user, CodePurpose.VERIFY_EMAIL);
      throw new ForbiddenException({
        statusCode: 403,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Confirma o teu e-mail. Enviámos-te um novo código.',
      });
    }
    return this.session(user.id);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, { secret: this.config.getOrThrow('JWT_REFRESH_SECRET') });
    } catch {
      throw new UnauthorizedException('Sessão expirada');
    }
    const user = await this.users.findById(payload.sub);
    if (!user?.refreshTokenHash || !safeEqual(user.refreshTokenHash, sha256(refreshToken))) {
      throw new UnauthorizedException('Sessão expirada');
    }
    return this.session(user.id);
  }

  async logout(userId: string) {
    await this.users.update(userId, { refreshTokenHash: null });
    return { message: 'Sessão terminada' };
  }

  async forgotPassword(email: string) {
    const user = await this.users.findByEmail(email);
    if (user?.emailVerified) await this.sendCode(user, CodePurpose.RESET_PASSWORD);
    return { message: 'Se existir uma conta com este e-mail, enviámos um código de recuperação' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new BadRequestException('Código inválido ou expirado');
    await this.consumeCode(user, CodePurpose.RESET_PASSWORD, dto.code);
    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    // Termina todas as sessões ativas
    await this.users.update(user.id, { passwordHash, refreshTokenHash: null });
    return { message: 'Palavra-passe atualizada. Já podes iniciar sessão.' };
  }

  // ---------- internos ----------

  private async sendCode(user: User, purpose: CodePurpose) {
    const code = randomInt(100000, 1000000).toString();
    await this.users.update(user.id, {
      codeHash: hashCode(user.email, code),
      codePurpose: purpose,
      codeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
      codeAttempts: 0,
    });
    if (purpose === CodePurpose.VERIFY_EMAIL) await this.mail.sendVerificationCode(user.email, user.name, code);
    else await this.mail.sendPasswordResetCode(user.email, user.name, code);
  }

  private async consumeCode(user: User, purpose: CodePurpose, code: string) {
    const invalid = new BadRequestException('Código inválido ou expirado');
    if (!user.codeHash || user.codePurpose !== purpose || !user.codeExpiresAt || user.codeExpiresAt < new Date()) {
      throw invalid;
    }
    if (user.codeAttempts >= MAX_CODE_ATTEMPTS) {
      throw new BadRequestException('Demasiadas tentativas. Pede um novo código.');
    }
    if (!safeEqual(user.codeHash, hashCode(user.email, code))) {
      await this.users.update(user.id, { codeAttempts: user.codeAttempts + 1 });
      throw invalid;
    }
    await this.users.update(user.id, { codeHash: null, codePurpose: null, codeExpiresAt: null, codeAttempts: 0 });
  }

  /** Emite tokens, guarda o hash do refresh token e devolve { user, accessToken, refreshToken }. */
  private async session(userId: string) {
    const accessOpts: JwtSignOptions = {
      secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn: (this.config.get('JWT_ACCESS_TTL') ?? '15m') as JwtSignOptions['expiresIn'],
    };
    const refreshOpts: JwtSignOptions = {
      secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn: (this.config.get('JWT_REFRESH_TTL') ?? '7d') as JwtSignOptions['expiresIn'],
    };
    const accessToken = await this.jwt.signAsync({ sub: userId }, accessOpts);
    const refreshToken = await this.jwt.signAsync({ sub: userId, jti: randomUUID() }, refreshOpts);
    await this.users.update(userId, { refreshTokenHash: sha256(refreshToken) });
    const user = await this.users.getProfile(userId);
    return { user, accessToken, refreshToken };
  }
}
