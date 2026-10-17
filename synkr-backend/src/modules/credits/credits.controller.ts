import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/current-user.decorator';
import { PageQueryDto } from '../../common/page-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreditsService } from './credits.service';

@ApiTags('credits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('credits')
export class CreditsController {
  constructor(private readonly credits: CreditsService) {}

  /** { balanceMinutes, taughtMinutes, learnedMinutes } (60 minutos = 1 crédito) */
  @Get('balance')
  balance(@CurrentUser() user: AuthUser) {
    return this.credits.summary(user.userId);
  }

  /** Movimentos do banco de tempo, do mais recente para o mais antigo. */
  @Get('transactions')
  transactions(@CurrentUser() user: AuthUser, @Query() page: PageQueryDto) {
    return this.credits.transactions(user.userId, page.limit, page.offset);
  }
}
