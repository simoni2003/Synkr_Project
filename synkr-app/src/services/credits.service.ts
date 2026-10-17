import type { CreditSummary, CreditTransaction, Paged } from '../types/api';
import { api } from './api';

export const creditsService = {
  balance: () => api.get<CreditSummary>('/credits/balance').then((r) => r.data),
  transactions: (params: { limit?: number; offset?: number } = {}) =>
    api.get<Paged<CreditTransaction>>('/credits/transactions', { params }).then((r) => r.data),
};
