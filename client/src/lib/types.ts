export type ModerationStatus = 'approved' | 'borderline' | 'rejected';

export interface TrustLevel {
  level: number;
  name: string;
  minScore: number;
  description: string;
  permissions: string[];
}

export interface User {
  id: number;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  reputation: number;
  trustLevel: number;
  trust: TrustLevel;
}

export interface Me {
  user: User | null;
  csrfToken: string;
  unreadCount: number;
  demo: boolean;
}

export type DemoRole = 'founder' | 'member' | 'reviewer';

export interface CommunitySummary {
  id: number;
  name: string;
  slug: string;
  description: string;
  purpose: string;
  template: string;
  memberCount: number;
}

export interface Community extends CommunitySummary {
  createdAt: string;
  role: string | null;
  isMember: boolean;
  topTags: { id: number; name: string; usage: number }[];
}

export interface PostAuthor {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  reputation?: number;
  trustLevel?: number;
  trust?: TrustLevel;
}

export interface PostSummary {
  id: number;
  title: string;
  content: string;
  postType: string;
  status: string;
  isPinned: boolean;
  createdAt: string;
  communityName?: string;
  communitySlug?: string;
  author: PostAuthor;
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: PostAuthor;
}

export interface Reaction {
  type: string;
  count: number;
}

export interface PostDetail {
  post: PostSummary;
  comments: Comment[];
  reactions: Reaction[];
  userReaction: string | null;
  tags: { id: number; name: string }[];
  bookmarked: boolean;
}

export interface Rule {
  id: number;
  ruleNumber: number;
  title: string;
  summary: string;
  purpose: string;
  severity: string;
}

export interface ModerationResult {
  status: ModerationStatus | null;
  score: number;
  explanation: string;
  details?: unknown;
}

export interface CreatePostResult {
  postId: number;
  status: string;
  slug: string;
  moderation: ModerationResult;
}

export interface CoachSuggestion {
  type: 'info' | 'warning' | 'error';
  message: string;
  rule: string;
}

export interface CoachResult {
  status: ModerationStatus | null;
  explanation: string;
  suggestions: CoachSuggestion[];
}

export interface ReputationDimension {
  dimension: string;
  score: number;
}

export interface ProfileResponse {
  user: User & { joinedAt: string };
  posts: PostSummary[];
  dimensions: ReputationDimension[];
}

export interface ConstitutionResponse {
  community: { name: string; slug: string; purpose: string };
  constitution: { version: number; effectiveAt: string } | null;
  rules: Rule[];
}

export type HealthLabel = 'Strong' | 'Stable' | 'Needs attention' | 'At risk';

export interface TrustInsight {
  type: string;
  severity: 'info' | 'warning' | 'serious';
  title: string;
  description: string;
  evidence: string[];
  action: string;
  actionTo: string;
}

export interface NewcomerItem {
  postId: number;
  slug: string;
  title: string;
  author: PostAuthor;
  hoursWaiting: number;
  reason: string;
}

export interface TrustRadar {
  community: { name: string; slug: string };
  healthLabel: HealthLabel;
  insights: TrustInsight[];
  newcomers: NewcomerItem[];
  recommendedActions: string[];
}

export interface TrustReport {
  community: { name: string; slug: string };
  weekOf: string;
  healthLabel: HealthLabel;
  improvements: string[];
  risks: string[];
  recommendedActions: { title: string; why: string }[];
  metrics: { newPosts: number; helpfulAnswers: number; newMembers: number; openCases: number };
}

export interface DecisionReceipt {
  status: string;
  title: string;
  relevantNorm: string;
  reason: string;
  reviewedBy: string;
  nextSteps: string[];
  appealAvailable: boolean;
  expectedTime: string | null;
  createdAt: string;
}

export interface DashboardResponse {
  user: User;
  stats: { total: number; approved: number; pending: number; rejected: number };
  dimensions: ReputationDimension[];
  posts: PostSummary[];
}
