export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export const levelLabel: Record<SkillLevel, string> = {
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermédio',
  ADVANCED: 'Avançado',
};

export type Skill = { id: string; name: string; category: string };
export type SkillView = { skillId: string; name: string; category: string; level: SkillLevel };
export type SkillSelection = { skillId: string; level: SkillLevel };

export type UserProfile = {
  id: string;
  name: string;
  handle: string;
  headline: string | null;
  city: string | null;
  bio: string | null;
  onboardingCompleted: boolean;
  teach: SkillView[];
  learn: SkillView[];
  createdAt: string;
  email?: string;
  emailVerified?: boolean;
};

export type AuthSession = { user: UserProfile; accessToken: string; refreshToken: string };
export type MessageResponse = { message: string };

// ---------- Fase 2: descoberta e match ----------
export type CompatType = 'MUTUAL' | 'TEACHES_YOU' | 'LEARNS_FROM_YOU' | 'NONE';
export type Compatibility = {
  type: CompatType;
  /** o que esta pessoa ensina e tu queres aprender */
  youCanLearn: SkillView[];
  /** o que tu ensinas e esta pessoa quer aprender */
  theyCanLearn: SkillView[];
  score: number;
};
export type MatchStatus = 'SUGGESTED' | 'ACCEPTED' | 'DECLINED';
export type Relation = { matchId: string; status: MatchStatus; direction: 'OUTGOING' | 'INCOMING' };
export type UserCard = {
  id: string;
  name: string;
  handle: string;
  headline: string | null;
  city: string | null;
  bio: string | null;
  teach: SkillView[];
  learn: SkillView[];
  compatibility: Compatibility;
  relation: Relation | null;
};
export type Paged<T> = { items: T[]; total: number };
export type MatchBox = 'incoming' | 'outgoing' | 'accepted';
export type MatchView = {
  id: string;
  status: MatchStatus;
  direction: 'OUTGOING' | 'INCOMING';
  createdAt: string;
  user: UserCard;
};
export type MatchSummary = { incoming: number; outgoing: number; accepted: number };

// ---------- Fase 3: banco de tempo ----------
export type CreditSummary = { balanceMinutes: number; taughtMinutes: number; learnedMinutes: number };
export type CreditReason = 'SESSION_TAUGHT' | 'SESSION_LEARNED' | 'ADJUSTMENT' | 'SIGNUP_BONUS';
export type CreditTransaction = {
  id: string;
  minutes: number;
  reason: CreditReason;
  createdAt: string;
  session: { id: string; skillName: string; withUser: { id: string; name: string } } | null;
};
