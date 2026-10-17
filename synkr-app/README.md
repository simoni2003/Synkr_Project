# Synkr (frontend mobile)

App React Native (Expo) do Synkr, ligada ao backend NestJS. Nesta fase está ligada à **autenticação e perfil**, à **descoberta e match** e ao **banco de tempo** (Fases 1, 2 e 3 do backend). Não há dados simulados: tudo o que vês vem da API.

## Como correr

1. **Arranca o backend** (ver o README do `synkr-backend`).
2. **Configura o endereço da API.** Copia `.env.example` para `.env` e põe o IP do teu computador na rede Wi-Fi:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.25:3000/api
   ```
   No telemóvel não funciona `localhost`. Emulador Android: `http://10.0.2.2:3000/api`.
3. **Instala e arranca:**
   ```bash
   npm install
   npx expo install --fix
   npx expo start -c
   ```
   Lê o QR code com o Expo Go (telemóvel e computador na mesma rede). Sempre que mudares o `.env`, reinicia com `-c`.

> O código de confirmação de e-mail aparece no **terminal do backend** (ainda não há envio real de e-mail).

## O que funciona

| Fluxo | Endpoint |
|---|---|
| Registo | `POST /auth/register` |
| Confirmar e-mail (e entra logo) | `POST /auth/verify-email`, `POST /auth/resend-code` |
| Login (e e-mail por confirmar) | `POST /auth/login` |
| Recuperar palavra-passe | `POST /auth/forgot-password`, `POST /auth/reset-password` |
| Renovar sessão (automático) | `POST /auth/refresh` |
| Terminar sessão | `POST /auth/logout` |
| Perfil (ver/editar) | `GET/PATCH /users/me` |
| Competências (onboarding e edição) | `GET /skills`, `PUT /users/me/skills` |
| Sugestões de match | `GET /discover/matches` |
| Pesquisa com filtros (texto, categoria, nível) | `GET /discover/search` |
| Perfil de outra pessoa + compatibilidade | `GET /discover/users/:id` |
| Pedir, aceitar, recusar e cancelar troca | `POST /matches`, `POST /matches/:id/accept`, `POST /matches/:id/decline`, `DELETE /matches/:id` |
| Pedidos recebidos/enviados/ligações | `GET /matches?box=`, `GET /matches/summary` |
| Banco de tempo (saldo e movimentos) | `GET /credits/balance`, `GET /credits/transactions` |

As rotas estão centralizadas em `src/services/` (`auth.service.ts`, `users.service.ts`, `skills.service.ts`). O cliente HTTP (`src/services/api.ts`) junta o token a cada pedido e renova-o sozinho quando expira. Os tokens ficam no armazenamento seguro do telemóvel.

## Navegação

A navegação depende do estado da sessão (`src/navigation/RootNavigator.tsx`):

1. **Sem sessão:** Welcome, Login, Registo, Confirmar e-mail, Recuperar palavra-passe.
2. **Sessão iniciada, sem competências:** Onboarding (ensinar, aprender).
3. **App:** separadores Descobrir, Perfil, Início, Mensagens e Agenda, mais Perfil de outra pessoa, Pedidos de troca, Banco de tempo, Editar perfil, Definições e Synkr Pro.

Início, Mensagens e Agenda mostram um ecrã "em breve" até existir o backend correspondente (Fases 4, 5 e 7). Os restantes ecrãs (chat, sessão, sala de aula, emblemas...) voltam a ser ligados fase a fase, já com dados reais.

## Estrutura

```
App.tsx                    AuthProvider + NavigationContainer
src/config.ts              URL da API (EXPO_PUBLIC_API_URL)
src/auth/AuthContext.tsx   estado de sessão e ações (login, registo, perfil...)
src/services/              cliente HTTP e rotas da API
src/types/api.ts           tipos das respostas do backend
src/utils/format.ts        formatação de minutos e datas
src/navigation/            Stack (por estado de sessão) e separadores
src/screens/auth           Welcome, Login, Register, VerifyEmail, ForgotPassword, ResetPassword
src/screens/onboarding     OnboardingTeach, OnboardingLearn
src/screens/tabs           Discover, Profile (os outros separadores usam ComingSoon)
src/screens/stack          UserProfile, MatchRequests, TimeBank, EditProfile, Settings, Premium
src/components/            ui.tsx (componentes base), SkillPicker, UserCardView
```
