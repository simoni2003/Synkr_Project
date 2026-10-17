# Synkr Backend (Fases 0 a 3)

NestJS + TypeORM + PostgreSQL. Inclui:

- **Fase 0 (fundação):** estrutura de módulos, configuração por variáveis de ambiente, ligação ao PostgreSQL, modelo de dados completo (`docs/ERD.md`).
- **Fase 1 (autenticação e perfil):** registo com confirmação de e-mail, login com JWT (access + refresh), recuperação de palavra-passe, perfil e mapeamento de competências.
- **Fase 2 (descoberta e match):** sugestão de perfis compatíveis, pesquisa com filtros e pedidos de troca (pedir, aceitar, recusar, cancelar).
- **Fase 3 (banco de tempo):** livro-razão de créditos, saldo, movimentos e as funções que as Fases 5 e 6 vão usar (`assertCanAfford`, `settleSession`).

## Como correr

1. **PostgreSQL.** Usa o teu PostgreSQL local (cria uma base `synkr`) ou, com Docker: `docker compose up -d`.
2. **Variáveis de ambiente:** copia `.env.example` para `.env` e ajusta (utilizador/palavra-passe da base e os dois segredos JWT).
3. **Instalar e arrancar:**
   ```bash
   npm install
   npm run start:dev
   ```
4. Abre **http://localhost:3000/docs** (Swagger) para testar os endpoints. Teste rápido: `GET http://localhost:3000/api/health`.

Ao arrancar, o TypeORM cria as tabelas (`DB_SYNCHRONIZE=true`) e o catálogo de competências é carregado automaticamente.

> **Códigos de e-mail em desenvolvimento:** ainda não há envio real. O código de 6 dígitos aparece no **terminal do backend** (linha `[Mail] [DEV] Código de verificação...`).

## Endpoints (prefixo `/api`)

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/register` | não | `{ name, email, password }`. Cria conta e envia código |
| POST | `/auth/verify-email` | não | `{ email, code }`. Devolve `{ user, accessToken, refreshToken }` |
| POST | `/auth/resend-code` | não | `{ email }` |
| POST | `/auth/login` | não | `{ email, password }`. 401 credenciais erradas; 403 `EMAIL_NOT_VERIFIED` |
| POST | `/auth/refresh` | não | `{ refreshToken }`. Novos tokens (rotação) |
| POST | `/auth/logout` | sim | Invalida o refresh token |
| POST | `/auth/forgot-password` | não | `{ email }`. Envia código de recuperação |
| POST | `/auth/reset-password` | não | `{ email, code, newPassword }` |
| GET | `/users/me` | sim | Perfil completo com `teach` e `learn` |
| PATCH | `/users/me` | sim | `{ name?, headline?, city?, bio? }` |
| PUT | `/users/me/skills` | sim | `{ teach: [{skillId, level}], learn: [{skillId, level}] }`, mínimo 1 em cada |
| GET | `/users/:id` | sim | Perfil público de outro utilizador |
| GET | `/skills` | sim | Catálogo `[{ id, name, category }]` |
| GET | `/discover/matches` | sim | Perfis compatíveis, melhor pontuação primeiro. `?mutualOnly=true&limit=&offset=` |
| GET | `/discover/search` | sim | Quem ensina: `?q=&category=&skillId=&level=&limit=&offset=` |
| GET | `/discover/users/:id` | sim | Perfil de outra pessoa + compatibilidade + estado do pedido |
| POST | `/matches` | sim | `{ userId }`. Pede uma troca (só com competências compatíveis) |
| GET | `/matches` | sim | `?box=incoming\|outgoing\|accepted` |
| GET | `/matches/summary` | sim | `{ incoming, outgoing, accepted }` |
| POST | `/matches/:id/accept` | sim | Aceita um pedido recebido |
| POST | `/matches/:id/decline` | sim | Recusa um pedido recebido |
| DELETE | `/matches/:id` | sim | Cancela um pedido enviado e pendente |
| GET | `/credits/balance` | sim | `{ balanceMinutes, taughtMinutes, learnedMinutes }` |
| GET | `/credits/transactions` | sim | Movimentos: `?limit=&offset=` |
| GET | `/health` | não | Estado do servidor |

Níveis: ensinar = `INTERMEDIATE` ou `ADVANCED`; aprender = `BEGINNER` ou `INTERMEDIATE`.

## Como funciona o match (Fase 2)

Para cada pessoa, compara-se o que **tu ensinas / queres aprender** com o que **ela ensina / quer aprender**:

- **MUTUAL (troca direta):** tu aprendes o que ela ensina e ela aprende o que tu ensinas.
- **TEACHES_YOU:** ela ensina algo que queres aprender (pagas com créditos).
- **LEARNS_FROM_YOU:** ela quer aprender algo que tu ensinas (ganhas créditos).

Pontuação: 100 se for mútua, +10 por competência em comum, +3 por cada uma que ela ensina a nível avançado. As sugestões vêm por ordem de pontuação e não incluem quem já está ligado ou recusou.

**Pedidos de troca:** `POST /matches` cria um pedido pendente. A outra pessoa aceita ou recusa. Se ela já tinha pedido, o pedido de volta liga as duas logo. Só pessoas ligadas (ACCEPTED) vão poder conversar no chat (Fase 4).

## Banco de tempo (Fase 3)

- **Livro-razão:** o saldo é a soma de `time_credits.minutes` (60 min = 1 crédito). Quem ensina ganha, quem aprende gasta.
- **Crédito inicial:** ao confirmar o e-mail, cada pessoa recebe `CREDIT_SIGNUP_BONUS_MINUTES` (por omissão 60 = 1 hora), uma só vez. Sem isto ninguém conseguiria pedir a primeira aula. Põe `0` no `.env` para desativar. Ao arrancar, as contas já confirmadas que ainda não o têm também recebem.
- **Para as próximas fases:** `CreditsService.assertCanAfford()` (ao propor uma aula, Fase 5) e `CreditsService.settleSession()` (ao terminar a sessão, Fase 6; é idempotente e aceita uma transação).

## Segurança já incluída

- Palavras-passe com bcrypt (12 rounds); códigos e refresh tokens guardados só como hash.
- Códigos de 6 dígitos com validade de 15 min e máximo de 5 tentativas.
- Limite de pedidos (rate limiting): 100/min global e 10/min nas rotas de autenticação.
- Respostas genéricas em `forgot-password` e `resend-code` (não revelam se o e-mail existe).
- Validação estrita de todos os dados de entrada (campos desconhecidos são rejeitados).

## Estrutura

```
src/
  main.ts, app.module.ts
  config/            validação do .env
  common/            enums, decorator @CurrentUser
  modules/
    auth/            registo, login, JWT, recuperação
    users/           perfil e competências do utilizador (+ entidades User, UserSkill)
    skills/          catálogo de competências (com seed)
    mail/            envio de e-mail (por agora, escreve no terminal)
    discover/        sugestões de match e pesquisa com filtros
    matches/         pedidos de troca
    credits/         banco de tempo
    sessions/ messages/ reviews/ badges/   só entidades (fases seguintes)
```

## Próximas fases

4 Mensagens (Socket.io), 5 Agendamento, 6 Sala virtual (WebRTC), 7 Feed, 8 Reputação, 9 Polimento (testes, migrações, revisão de segurança).
