import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser } from '../../common/current-user.decorator';
import { AuthService } from './auth.service';
import { EmailDto, LoginDto, RefreshDto, RegisterDto, ResetPasswordDto, VerifyEmailDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// Limite mais apertado nas rotas sensíveis: 10 pedidos por minuto por IP
const strict = Throttle({ default: { limit: 10, ttl: 60_000 } });

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Cria a conta (não confirmada) e envia código de 6 dígitos por e-mail. */
  @strict @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  /** Confirma o e-mail e devolve { user, accessToken, refreshToken }. */
  @strict @HttpCode(HttpStatus.OK) @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto);
  }

  @strict @HttpCode(HttpStatus.OK) @Post('resend-code')
  resendCode(@Body() dto: EmailDto) {
    return this.auth.resendCode(dto.email);
  }

  /** 401 = credenciais erradas. 403 com code EMAIL_NOT_VERIFIED = e-mail por confirmar. */
  @strict @HttpCode(HttpStatus.OK) @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @strict @HttpCode(HttpStatus.OK) @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard) @HttpCode(HttpStatus.OK) @Post('logout')
  logout(@CurrentUser() user: AuthUser) {
    return this.auth.logout(user.userId);
  }

  @strict @HttpCode(HttpStatus.OK) @Post('forgot-password')
  forgotPassword(@Body() dto: EmailDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @strict @HttpCode(HttpStatus.OK) @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }
}
