import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoverModule } from '../discover/discover.module';
import { User } from '../users/user.entity';
import { MatchesController } from './matches.controller';
import { Match } from './match.entity';
import { MatchesService } from './matches.service';

@Module({
  imports: [TypeOrmModule.forFeature([Match, User]), DiscoverModule],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
