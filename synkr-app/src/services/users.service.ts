import type { SkillSelection, UserProfile } from '../types/api';
import { api } from './api';

export const usersService = {
  me: () => api.get<UserProfile>('/users/me').then((r) => r.data),

  updateMe: (body: { name?: string; headline?: string; city?: string; bio?: string }) =>
    api.patch<UserProfile>('/users/me', body).then((r) => r.data),

  setSkills: (body: { teach: SkillSelection[]; learn: SkillSelection[] }) =>
    api.put<UserProfile>('/users/me/skills', body).then((r) => r.data),

  byId: (id: string) => api.get<UserProfile>(`/users/${id}`).then((r) => r.data),
};
