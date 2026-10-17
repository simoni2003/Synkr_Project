import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { SkillLevel } from '../../../common/enums';
import { PageQueryDto } from '../../../common/page-query.dto';

export class SuggestionsQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: 'true = só trocas diretas (os dois ensinam o que o outro quer)' })
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean()
  mutualOnly: boolean = false;
}

export class SearchQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: 'Texto: nome da competência, nome ou apresentação da pessoa' })
  @IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString() @MaxLength(60)
  q?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60)
  category?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  skillId?: string;

  @ApiPropertyOptional({ enum: SkillLevel, description: 'Nível com que a pessoa ensina' })
  @IsOptional() @IsEnum(SkillLevel)
  level?: SkillLevel;
}
