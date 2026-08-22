const BASE_URL = 'http://localhost:8080/api';

// ===== Analytics Types =====

export interface MediaItem {
  id: string;
  shortcode: string | null;
  mediaType: string;
  mediaProductType: string;
  caption: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  permalink: string | null;
  timestamp: string | null;
  duration: number | null;
  likeCount: number | null;
  commentsCount: number | null;
  reach: number | null;
  impressions: number | null;
  saved: number | null;
  videoViews: number | null;
  shares: number | null;
  profileVisits: number | null;
  follows: number | null;
  clicks: number | null;
  plays: number | null;
  totalInteractions: number | null;
  videoViewTotalTime: number | null;
  avgWatchTime: number | null;
  engagementRate: number | null;
}

export interface DailySnapshot {
  date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  engagementRate: number;
}

export interface DashboardSummary {
  totalPosts: number;
  totalReels: number;
  totalVideos: number;
  totalImages: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  totalReach: number;
  totalImpressions: number;
  averageEngagementRate: number;
  bestPerformingReel: MediaItem | null;
  bestPerformingPost: MediaItem | null;
  fastestGrowingContent: MediaItem | null;
  mostSharedContent: MediaItem | null;
  mostSavedContent: MediaItem | null;
  dailySnapshots: DailySnapshot[];
  lastSyncedAt: string;
}

export interface MediaPage {
  content: MediaItem[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

/** Subset of a spreadsheet row that the export endpoints accept. */
export interface ExportableRow {
  profileUrl: string;
  username: string;
  followersCount: number | null;
  followingCount: number | null;
  totalPosts: number | null;
  postUrl: string;
  likesCount: number | null;
  commentsCount: number | null;
  viewsCount: number | null;
  reach: number | null;
}

export interface InstagramAccount {
  id: string;
  accountName: string;
  igUserId: string;
  appId: string;
  appSecret: string;
  accessToken: string;
  isActive: boolean;
  tokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const toExportPayload = (rows: ExportableRow[]) =>
  rows.map((r) => ({
    profileUrl: r.profileUrl,
    username: r.username,
    followersCount: r.followersCount,
    followingCount: r.followingCount,
    totalPosts: r.totalPosts,
    postUrl: r.postUrl,
    likesCount: r.likesCount,
    commentsCount: r.commentsCount,
    viewsCount: r.viewsCount,
    reach: r.reach,
  }));

const jsonOrThrow = async (response: Response, fallback: string) => {
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your session has expired. Please log in again.');
    }
    const data = await response.json().catch(() => ({} as any));
    throw new Error(data.error || data.message || fallback);
  }
  return response.json();
};

export const login = async (email: string, password: string) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({} as any));
    throw new Error(data.message || data.error || 'Login failed');
  }
  return response.json();
};

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role?: string;
  accountName?: string;
  igUserId?: string;
  appId?: string;
  appSecret?: string;
  accessToken?: string;
}

export const register = async (payload: RegisterPayload) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({} as any));
    throw new Error(data.message || data.error || 'Registration failed');
  }
  return response.json();
};

export const fetchPostMetrics = async (
  postUrl: string,
  profileId: string,
  token: string,
  accountId?: string
) => {
  const response = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ postUrl, profileId, accountId: accountId || null }),
  });
  return jsonOrThrow(response, 'Failed to fetch metrics');
};

export const fetchProfileByUrl = async (profileUrl: string, token: string, accountId?: string) => {
  const response = await fetch(`${BASE_URL}/profiles/fetch-by-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ profileUrl, accountId: accountId || null }),
  });
  return jsonOrThrow(response, 'Failed to fetch profile data');
};

export const fetchPostMetricsByUrl = async (postUrl: string, token: string, accountId?: string) => {
  const response = await fetch(`${BASE_URL}/posts/fetch-metrics-by-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ postUrl, accountId: accountId || null }),
  });
  return jsonOrThrow(response, 'Failed to fetch post metrics');
};

export const fetchProfiles = async (token: string) => {
  const response = await fetch(`${BASE_URL}/profiles`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return jsonOrThrow(response, 'Failed to fetch profiles');
};

export const createProfile = async (
  username: string,
  profileUrl: string,
  category: string,
  graphApiToken: string,
  token: string,
  accountId?: string
) => {
  const response = await fetch(`${BASE_URL}/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      username,
      profileUrl,
      category,
      graphApiToken: graphApiToken || null,
      accountId: accountId || null,
    }),
  });
  return jsonOrThrow(response, 'Failed to create profile');
};

export const exportToExcel = async (rows: ExportableRow[], token: string): Promise<Blob> => {
  const response = await fetch(`${BASE_URL}/export/excel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(toExportPayload(rows)),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Your session has expired. Please log in again.');
    if (response.status === 403) throw new Error('You do not have permission to export data.');
    throw new Error('Export to Excel failed. Please try again.');
  }
  return response.blob();
};

export const exportToPdf = async (rows: ExportableRow[], token: string): Promise<Blob> => {
  const response = await fetch(`${BASE_URL}/export/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(toExportPayload(rows)),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Your session has expired. Please log in again.');
    if (response.status === 403) throw new Error('You do not have permission to export data.');
    throw new Error('Export to PDF failed. Please try again.');
  }
  return response.blob();
};

export const deleteProfile = async (id: string, token: string) => {
  const response = await fetch(`${BASE_URL}/profiles/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return jsonOrThrow(response, 'Failed to delete profile');
};

// ===== Instagram Accounts (Issue 9) =====

export const getAccounts = async (token: string): Promise<InstagramAccount[]> => {
  const response = await fetch(`${BASE_URL}/accounts`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return jsonOrThrow(response, 'Failed to load accounts');
};

export interface AccountPayload {
  accountName: string;
  igUserId?: string;
  appId?: string;
  appSecret?: string;
  accessToken?: string;
  isActive?: boolean;
  tokenExpiresAt?: string | null;
}

export const createAccount = async (payload: AccountPayload, token: string) => {
  const response = await fetch(`${BASE_URL}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(response, 'Failed to create account');
};

export const updateAccount = async (id: string, payload: AccountPayload, token: string) => {
  const response = await fetch(`${BASE_URL}/accounts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(response, 'Failed to update account');
};

export const deleteAccount = async (id: string, token: string) => {
  const response = await fetch(`${BASE_URL}/accounts/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Your session has expired. Please log in again.');
    const data = await response.json().catch(() => ({} as any));
    throw new Error(data.error || data.message || 'Failed to delete account');
  }
  return true;
};

export const testCredentials = async (id: string, token: string) => {
  const response = await fetch(`${BASE_URL}/accounts/${id}/test`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return jsonOrThrow(response, 'Failed to test credentials');
};

// ===== Spreadsheet Row Persistence =====

export interface SpreadsheetRowPayload {
  id: string;
  rowOrder: number;
  profileUrl: string;
  username: string;
  followersCount: number | null;
  followingCount: number | null;
  totalPosts: number | null;
  postUrl: string;
  likesCount: number | null;
  commentsCount: number | null;
  viewsCount: number | null;
  reach: number | null;
}

export const loadSpreadsheetRows = async (token: string): Promise<SpreadsheetRowPayload[]> => {
  const response = await fetch(`${BASE_URL}/spreadsheet/rows`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return jsonOrThrow(response, 'Failed to load spreadsheet data');
};

export const saveSpreadsheetRows = async (rows: SpreadsheetRowPayload[], token: string): Promise<SpreadsheetRowPayload[]> => {
  const response = await fetch(`${BASE_URL}/spreadsheet/rows`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(rows),
  });
  return jsonOrThrow(response, 'Failed to save spreadsheet data');
};

export const deleteSpreadsheetRow = async (id: string, token: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/spreadsheet/rows/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Your session has expired. Please log in again.');
    throw new Error('Failed to delete row');
  }
};

export const deleteAllSpreadsheetRows = async (token: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/spreadsheet/rows`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Your session has expired. Please log in again.');
    throw new Error('Failed to delete all rows');
  }
};

// ===== New Analytics Dashboard APIs =====

export interface MediaQueryParams {
  accountId?: string;
  limit?: number;
  type?: string;
  search?: string;
  sortBy?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}

export const getAllMedia = async (token: string, params: MediaQueryParams = {}): Promise<MediaPage> => {
  const qs = new URLSearchParams();
  if (params.accountId) qs.set('accountId', params.accountId);
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.type) qs.set('type', params.type);
  if (params.search) qs.set('search', params.search);
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
  if (params.dateTo) qs.set('dateTo', params.dateTo);
  if (params.page !== undefined) qs.set('page', String(params.page));
  if (params.size) qs.set('size', String(params.size));
  const response = await fetch(`${BASE_URL}/analytics/media?${qs.toString()}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return jsonOrThrow(response, 'Failed to fetch media');
};

export const getDashboardSummary = async (token: string, accountId?: string): Promise<DashboardSummary> => {
  const qs = accountId ? `?accountId=${accountId}&limit=200` : '?limit=200';
  const response = await fetch(`${BASE_URL}/analytics/summary${qs}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return jsonOrThrow(response, 'Failed to fetch dashboard summary');
};

export const compareMedia = async (token: string, ids: string[], accountId?: string): Promise<MediaItem[]> => {
  const qs = accountId ? `?accountId=${accountId}` : '';
  const response = await fetch(`${BASE_URL}/analytics/compare${qs}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ ids }),
  });
  return jsonOrThrow(response, 'Failed to compare media');
};

export const exportAnalyticsCsv = async (token: string, accountId?: string): Promise<Blob> => {
  const qs = accountId ? `?accountId=${accountId}&limit=500` : '?limit=500';
  const response = await fetch(`${BASE_URL}/analytics/export/csv${qs}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Your session has expired.');
    throw new Error('CSV export failed');
  }
  return response.blob();
};

