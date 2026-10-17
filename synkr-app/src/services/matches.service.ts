import type { MatchBox, MatchSummary, MatchView, MessageResponse } from '../types/api';
import { api } from './api';

export const matchesService = {
  request: (userId: string) => api.post('/matches', { userId }).then((r) => r.data),
  list: (box: MatchBox) => api.get<MatchView[]>('/matches', { params: { box } }).then((r) => r.data),
  summary: () => api.get<MatchSummary>('/matches/summary').then((r) => r.data),
  accept: (id: string) => api.post(`/matches/${id}/accept`).then((r) => r.data),
  decline: (id: string) => api.post(`/matches/${id}/decline`).then((r) => r.data),
  cancel: (id: string) => api.delete<MessageResponse>(`/matches/${id}`).then((r) => r.data),
};
