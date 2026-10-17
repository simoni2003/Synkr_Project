import type { Paged, SkillLevel, UserCard } from '../types/api';
import { api } from './api';

export const discoverService = {
  /** Perfis compatíveis contigo, melhor pontuação primeiro */
  suggestions: (params: { mutualOnly?: boolean; limit?: number; offset?: number } = {}) =>
    api.get<Paged<UserCard>>('/discover/matches', { params }).then((r) => r.data),

  /** Pesquisa de quem ensina, com filtros */
  search: (params: { q?: string; category?: string; skillId?: string; level?: SkillLevel; limit?: number; offset?: number } = {}) =>
    api.get<Paged<UserCard>>('/discover/search', { params }).then((r) => r.data),

  /** Perfil de outra pessoa com compatibilidade e estado do pedido */
  user: (id: string) => api.get<UserCard>(`/discover/users/${id}`).then((r) => r.data),
};
