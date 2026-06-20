import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, setCsrfToken } from './api';
import type {
  Community,
  CommunitySummary,
  ConstitutionResponse,
  CreatePostResult,
  DashboardResponse,
  Me,
  ModerationResult,
  PostDetail,
  PostSummary,
  ProfileResponse,
  Rule,
  User,
} from './types';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const me = await api.get<Me>('/auth/me');
      setCsrfToken(me.csrfToken);
      return me;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { login: string; password: string }) => api.post<{ user: User }>('/auth/login', vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { username: string; email: string; password: string; displayName?: string }) =>
      api.post<{ user: User }>('/auth/register', vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useDemoLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (role: import('./types').DemoRole) => api.post<{ user: User }>('/auth/demo', { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useCommunities() {
  return useQuery({
    queryKey: ['communities'],
    queryFn: () => api.get<{ communities: CommunitySummary[] }>('/communities').then((r) => r.communities),
  });
}

export function useCommunity(slug: string) {
  return useQuery({
    queryKey: ['community', slug],
    queryFn: () => api.get<{ community: Community }>(`/communities/${slug}`).then((r) => r.community),
    enabled: !!slug,
  });
}

export function useCommunityPosts(slug: string) {
  return useQuery({
    queryKey: ['community', slug, 'posts'],
    queryFn: () => api.get<{ posts: PostSummary[] }>(`/communities/${slug}/posts`).then((r) => r.posts),
    enabled: !!slug,
  });
}

export function useFeed() {
  return useQuery({
    queryKey: ['feed'],
    queryFn: () => api.get<{ posts: PostSummary[] }>('/feed').then((r) => r.posts),
  });
}

export function useCommunityRules(slug: string) {
  return useQuery({
    queryKey: ['community', slug, 'rules'],
    queryFn: () => api.get<{ rules: Rule[] }>(`/communities/${slug}/rules`).then((r) => r.rules),
    enabled: !!slug,
  });
}

export function useToggleMembership(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (join: boolean) =>
      api.post<{ community: Community }>(`/communities/${slug}/${join ? 'join' : 'leave'}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', slug] });
      qc.invalidateQueries({ queryKey: ['communities'] });
    },
  });
}

export function usePost(slug: string, id: string) {
  return useQuery({
    queryKey: ['post', slug, id],
    queryFn: () => api.get<PostDetail>(`/communities/${slug}/posts/${id}`),
    enabled: !!slug && !!id,
  });
}

export function useReact(slug: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reactionType: string) => api.post(`/communities/${slug}/posts/${id}/react`, { reactionType }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post', slug, id] }),
  });
}

export function useBookmark(slug: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/communities/${slug}/posts/${id}/bookmark`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post', slug, id] }),
  });
}

export function useAddComment(slug: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      api.post<{ id: number; status: string }>(`/communities/${slug}/posts/${id}/comment`, { content }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post', slug, id] }),
  });
}

export function useCreatePost(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { title?: string; content: string; postType?: string; tags?: string }) =>
      api.post<CreatePostResult>(`/communities/${slug}/posts`, vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', slug, 'posts'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => api.get<ProfileResponse>(`/users/${username}`),
    enabled: !!username,
  });
}

export function useConstitution(slug: string) {
  return useQuery({
    queryKey: ['community', slug, 'constitution'],
    queryFn: () => api.get<ConstitutionResponse>(`/communities/${slug}/constitution`),
    enabled: !!slug,
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardResponse>('/me/dashboard'),
  });
}

export function useTrustRadar() {
  return useQuery({
    queryKey: ['trust-radar'],
    queryFn: () => api.get<import('./types').TrustRadar>('/trust-radar'),
  });
}

export function useTrustReport() {
  return useQuery({
    queryKey: ['trust-report'],
    queryFn: () => api.get<import('./types').TrustReport>('/trust-report'),
  });
}

export function useReceipt(slug: string, id: string) {
  return useQuery({
    queryKey: ['receipt', slug, id],
    queryFn: () =>
      api
        .get<{ receipt: import('./types').DecisionReceipt }>(`/communities/${slug}/posts/${id}/receipt`)
        .then((r) => r.receipt),
    enabled: !!slug && !!id,
  });
}

export async function previewModeration(content: string, communitySlug?: string) {
  return api.post<ModerationResult>('/moderation/preview', { content, communitySlug });
}

export async function previewCoach(content: string, communitySlug?: string) {
  return api.post<import('./types').CoachResult>('/coach', { content, communitySlug });
}
