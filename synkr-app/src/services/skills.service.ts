import type { Skill } from '../types/api';
import { api } from './api';

export const skillsService = {
  list: () => api.get<Skill[]>('/skills').then((r) => r.data),
};
