import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchQueryDto, SuggestionsQueryDto } from './dto/discover.dto';
import { DiscoverService } from './discover.service';

@ApiTags('discover')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('discover')
export class DiscoverController {
  constructor(private readonly discover: DiscoverService) {}

  /** Perfis compatíveis contigo, melhor pontuação primeiro: { items: UserCard[], total } */
  @Get('matches')
  matches(@CurrentUser() user: AuthUser, @Query() q: SuggestionsQueryDto) {
    return this.discover.suggestions(user.userId, q);
  }

  /** Pesquisa de quem ensina: ?q=&category=&skillId=&level=&limit=&offset= */
  @Get('search')
  search(@CurrentUser() user: AuthUser, @Query() q: SearchQueryDto) {
    return this.discover.search(user.userId, q);
  }

  /** Perfil de outra pessoa, com compatibilidade e estado do pedido de troca. */
  @Get('users/:id')
  user(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.discover.card(user.userId, id);
  }
}
