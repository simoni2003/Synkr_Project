import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { validateEnv } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { CreditsModule } from './modules/credits/credits.module';
import { DiscoverModule } from './modules/discover/discover.module';
import { MatchesModule } from './modules/matches/matches.module';
import { MailModule } from './modules/mail/mail.module';
import { SkillsModule } from './modules/skills/skills.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        type: 'postgres' as const,
        host: c.get<string>('DB_HOST'),
        port: Number(c.get('DB_PORT')),
        username: c.get<string>('DB_USER'),
        password: c.get<string>('DB_PASSWORD'),
        database: c.get<string>('DB_NAME'),
        // Carrega TODAS as entidades do modelo de dados (Fase 0), mesmo as de módulos ainda não implementados.
        entities: [join(__dirname, '**', '*.entity.{ts,js}')],
        synchronize: c.get('DB_SYNCHRONIZE') === 'true',
        logging: c.get('DB_LOGGING') === 'true',
        uuidExtension: 'pgcrypto' as const,
      }),
    }),
    MailModule,
    UsersModule,
    SkillsModule,
    CreditsModule,
    DiscoverModule,
    MatchesModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
