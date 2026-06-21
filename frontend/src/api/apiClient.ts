const BASE_URL = 'http://localhost:8080/api';

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
