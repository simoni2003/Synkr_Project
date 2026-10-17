# Modelo de dados (ERD)

Todas as entidades abaixo existem no código desde a Fase 0 (as tabelas são criadas ao arrancar com `DB_SYNCHRONIZE=true`).
Os módulos (controllers/serviços) de cada uma entram na fase indicada.

```mermaid
erDiagram
  users ||--o{ user_skills : tem
  skills ||--o{ user_skills : "é escolhida em"
  users ||--o{ matches : "userA / userB"
  users ||--o{ sessions : "teacher / learner"
  skills ||--o{ sessions : "é ensinada em"
  users ||--o{ time_credits : "ganha/gasta"
  sessions ||--o{ time_credits : gera
  users ||--o{ messages : "sender / receiver"
  sessions ||--o{ reviews : recebe
  users ||--o{ reviews : "author / target"
  users ||--o{ user_badges : conquista
  badges ||--o{ user_badges : atribuído

  users {
    uuid id PK
    string name
    string email UK
    string handle UK
    string passwordHash
    string headline
    string city
    text bio
    bool emailVerified
    bool onboardingCompleted
    string codeHash
    enum codePurpose
    timestamptz codeExpiresAt
    int codeAttempts
    string refreshTokenHash
  }
  skills {
    uuid id PK
    string name UK
    string category
  }
  user_skills {
    uuid id PK
    uuid userId FK
    uuid skillId FK
    enum kind "TEACH | LEARN"
    enum level "BEGINNER | INTERMEDIATE | ADVANCED"
  }
  matches {
    uuid id PK
    uuid userAId FK
    uuid userBId FK
    enum status
  }
  sessions {
    uuid id PK
    uuid teacherId FK
    uuid learnerId FK
    uuid skillId FK
    timestamptz scheduledAt
    int durationMinutes
    enum status
    timestamptz startedAt
    timestamptz endedAt
  }
  time_credits {
    uuid id PK
    uuid userId FK
    uuid sessionId FK
    int minutes "60 = 1 crédito"
    enum reason
  }
  messages {
    uuid id PK
    uuid senderId FK
    uuid receiverId FK
    text content
    timestamptz readAt
  }
  reviews {
    uuid id PK
    uuid sessionId FK
    uuid authorId FK
    uuid targetId FK
    smallint rating "1 a 5"
    text comment
  }
  badges {
    uuid id PK
    string code UK
    string title
    string description
    string icon
  }
  user_badges {
    uuid id PK
    uuid userId FK
    uuid badgeId FK
  }
```

## Decisões

- **Créditos como livro-razão** (`time_credits`): o saldo é a soma de `minutes`, em vez de um contador no utilizador. É auditável e evita saldos inconsistentes. 1 hora ensinada = +60 para quem ensina e -60 para quem aprende.
- **Competências com tipo** (`user_skills.kind`): uma só tabela guarda o que o utilizador ensina e o que quer aprender. Níveis válidos: ensinar = INTERMEDIATE/ADVANCED; aprender = BEGINNER/INTERMEDIATE.
- **Códigos de e-mail** (verificação e recuperação) ficam no próprio utilizador, só como hash, com validade de 15 min e máximo de 5 tentativas.
- **Refresh token**: guarda-se o hash do último emitido (uma sessão ativa por utilizador no MVP). Se quiseres várias sessões em simultâneo (telemóvel + tablet), passa para uma tabela `refresh_tokens`.

## Notas das Fases 2 e 3

- **`matches`:** `userAId` é quem pede, `userBId` quem recebe. Estados: `SUGGESTED` (pedido pendente), `ACCEPTED` (ligados), `DECLINED`.
- **`time_credits`:** índice único `(sessionId, userId, reason)` torna a liquidação de sessões idempotente. Índice único parcial garante um só bónus de boas-vindas (`SIGNUP_BONUS`) por utilizador.
