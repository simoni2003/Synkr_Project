import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMatchDto, ListMatchesQueryDto } from './dto/matches.dto';
import { MatchesService } from './matches.service';

@ApiTags('matches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('matches')
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  /** Pede uma troca a alguém compatível. Se essa pessoa já tinha pedido, fica logo ligado. */
  @Post()
  request(@CurrentUser() user: AuthUser, @Body() dto: CreateMatchDto) {
    return this.matches.request(user.userId, dto.userId);
  }

  /** ?box=incoming (recebidos) | outgoing (enviados) | accepted (ligações, por omissão) */
  @Get()
  list(@CurrentUser() user: AuthUser, @Query() q: ListMatchesQueryDto) {
    return this.matches.list(user.userId, q.box);
  }

  /** Contagens para os indicadores da app: { incoming, outgoing, accepted } */
  @Get('summary')
  summary(@CurrentUser() user: AuthUser) {
    return this.matches.summary(user.userId);
  }

  @HttpCode(HttpStatus.OK) @Post(':id/accept')
  accept(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.matches.accept(user.userId, id);
  }

  @HttpCode(HttpStatus.OK) @Post(':id/decline')
  decline(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.matches.decline(user.userId, id);
  }

  @Delete(':id')
  cancel(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.matches.cancel(user.userId, id);
  }
}
