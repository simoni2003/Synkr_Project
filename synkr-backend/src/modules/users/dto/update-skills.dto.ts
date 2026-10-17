import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsUUID, ValidateNested } from 'class-validator';
import { SkillLevel } from '../../../common/enums';

export class SkillSelectionDto {
  @ApiProperty() @IsUUID()
  skillId: string;

  @ApiProperty({ enum: SkillLevel }) @IsEnum(SkillLevel)
  level: SkillLevel;
}

export class UpdateSkillsDto {
  @ApiProperty({ type: [SkillSelectionDto], description: 'Mínimo 1. Níveis: INTERMEDIATE ou ADVANCED' })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => SkillSelectionDto)
  teach: SkillSelectionDto[];

  @ApiProperty({ type: [SkillSelectionDto], description: 'Mínimo 1. Níveis: BEGINNER ou INTERMEDIATE' })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => SkillSelectionDto)
  learn: SkillSelectionDto[];
}
