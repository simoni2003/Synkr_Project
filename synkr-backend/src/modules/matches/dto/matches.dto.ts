import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class CreateMatchDto {
  @ApiProperty({ description: 'Utilizador a quem queres pedir uma troca' }) @IsUUID()
  userId: string;
}

export class ListMatchesQueryDto {
  @ApiPropertyOptional({ enum: ['incoming', 'outgoing', 'accepted'], default: 'accepted' })
  @IsOptional() @IsIn(['incoming', 'outgoing', 'accepted'])
  box: 'incoming' | 'outgoing' | 'accepted' = 'accepted';
}
