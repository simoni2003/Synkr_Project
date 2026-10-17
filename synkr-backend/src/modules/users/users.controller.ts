import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSkillsDto } from './dto/update-skills.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.users.getProfile(user.userId);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.userId, dto);
  }

  /** Mapeamento de competências (obrigatório: >= 1 a ensinar e >= 1 a aprender). */
  @Put('me/skills')
  setSkills(@CurrentUser() user: AuthUser, @Body() dto: UpdateSkillsDto) {
    return this.users.setSkills(user.userId, dto);
  }

  /** Perfil público de outro utilizador (sem e-mail). */
  @Get(':id')
  byId(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.users.getProfile(id, false);
  }
}
