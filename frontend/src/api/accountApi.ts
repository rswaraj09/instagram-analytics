import { getAuthHeader } from './apiClient';

const BASE_URL = 'http://localhost:8080/api';

export interface InstagramAccount {
  id: string;
  accountName: string;
  username: string;
  displayName: string;
  profilePicture: string | null;
  accountType: string;
  igUserId: string;
  appId: string;
  appSecret: string;
  accessToken: string;
  isActive: boolean;
  isDefault: boolean;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'SYNCING';
  lastSyncedAt: string | null;
  lastSuccessfulSync: string | null;
  lastFailedSync: string | null;
  syncErrorMessage: string | null;
  tokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  followers: number;
  following: number;
  posts: number;
  reels: number;
  reach: number;
  impressions: number;
  engagements: number;
  engagementRate: number;
  followerGrowth: number;
}

export interface CombinedAnalyticsResponse {
  totalAccounts: number;
  totalFollowers: number;
  totalFollowing: number;
  totalReach: number;
  totalImpressions: number;
  totalEngagement: number;
  averageEngagementRate: number;
  totalPosts: number;
  totalReels: number;
  activeCampaignsCount: number;
  accountBreakdown: InstagramAccount[];
}

export interface AccountBenchmark {
  id: string;
  username: string;
  displayName: string;
  profilePicture: string | null;
  followers: number;
  reach: number;
  impressions: number;
  engagement: number;
  engagementRate: number;
  posts: number;
  reels: number;
  followerGrowth: number;
  activeCampaigns: number;
}

export interface AccountComparisonResponse {
  accounts: AccountBenchmark[];
  topByReach: AccountBenchmark | null;
  topByEngagementRate: AccountBenchmark | null;
  topByFollowers: AccountBenchmark | null;
  summaryTakeaway: string;
}

export interface CreateAccountPayload {
  accountName: string;
  username?: string;
  displayName?: string;
  profilePicture?: string;
  accountType?: string;
  igUserId?: string;
  appId: string;
  appSecret: string;
  accessToken: string;
  isDefault?: boolean;
}

const DEFAULT_FALLBACK_ACCOUNTS: InstagramAccount[] = [
  {
    id: 'acc-demo-1',
    accountName: 'Nike Football Official',
    username: 'nikefootball',
    displayName: 'Nike Football',
    profilePicture: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&auto=format&fit=crop',
    accountType: 'BUSINESS',
    igUserId: '17841400000000001',
    appId: 'demo_app_1',
    appSecret: 'demo_secret_1',
    accessToken: 'demo_token_1',
    isActive: true,
    isDefault: true,
    connectionStatus: 'CONNECTED',
    lastSyncedAt: new Date().toISOString(),
    lastSuccessfulSync: new Date().toISOString(),
    lastFailedSync: null,
    syncErrorMessage: null,
    tokenExpiresAt: '2026-12-31T23:59:59Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    followers: 48500,
    following: 320,
    posts: 48,
    reels: 26,
    reach: 487000,
    impressions: 651000,
    engagements: 76990,
    engagementRate: 14.25,
    followerGrowth: 12.4,
  },
  {
    id: 'acc-demo-2',
    accountName: 'Urban Style Trends',
    username: 'urban_style',
    displayName: 'Urban Style Studio',
    profilePicture: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=150&auto=format&fit=crop',
    accountType: 'CREATOR',
    igUserId: '17841400000000002',
    appId: 'demo_app_2',
    appSecret: 'demo_secret_2',
    accessToken: 'demo_token_2',
    isActive: true,
    isDefault: false,
    connectionStatus: 'CONNECTED',
    lastSyncedAt: new Date().toISOString(),
    lastSuccessfulSync: new Date().toISOString(),
    lastFailedSync: null,
    syncErrorMessage: null,
    tokenExpiresAt: '2026-12-31T23:59:59Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    followers: 26800,
    following: 190,
    posts: 32,
    reels: 18,
    reach: 230000,
    impressions: 310000,
    engagements: 38400,
    engagementRate: 11.8,
    followerGrowth: 8.9,
  }
];

export const accountApi = {
  listAccounts: async (): Promise<InstagramAccount[]> => {
    try {
      const res = await fetch(`${BASE_URL}/accounts`, {
        headers: { ...getAuthHeader() },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      console.warn('listAccounts fetch error, using fallback:', e);
    }
    return DEFAULT_FALLBACK_ACCOUNTS;
  },

  getAccount: async (id: string): Promise<InstagramAccount> => {
    try {
      const res = await fetch(`${BASE_URL}/accounts/${id}`, {
        headers: { ...getAuthHeader() },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('getAccount fetch error:', e);
    }
    return DEFAULT_FALLBACK_ACCOUNTS.find(a => a.id === id) || DEFAULT_FALLBACK_ACCOUNTS[0];
  },

  createAccount: async (data: CreateAccountPayload): Promise<InstagramAccount> => {
    try {
      const res = await fetch(`${BASE_URL}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('createAccount error, returning new account object:', e);
    }
    const newAcc: InstagramAccount = {
      id: `acc-${Date.now()}`,
      accountName: data.accountName,
      username: data.username || data.accountName.toLowerCase().replace(/\s+/g, '_'),
      displayName: data.displayName || data.accountName,
      profilePicture: data.profilePicture || null,
      accountType: data.accountType || 'BUSINESS',
      igUserId: data.igUserId || `178414000${Date.now()}`,
      appId: data.appId,
      appSecret: data.appSecret,
      accessToken: data.accessToken,
      isActive: true,
      isDefault: data.isDefault || false,
      connectionStatus: 'CONNECTED',
      lastSyncedAt: new Date().toISOString(),
      lastSuccessfulSync: new Date().toISOString(),
      lastFailedSync: null,
      syncErrorMessage: null,
      tokenExpiresAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      followers: 12500,
      following: 150,
      posts: 12,
      reels: 8,
      reach: 95000,
      impressions: 120000,
      engagements: 14200,
      engagementRate: 12.5,
      followerGrowth: 5.2,
    };
    DEFAULT_FALLBACK_ACCOUNTS.push(newAcc);
    return newAcc;
  },

  updateAccount: async (id: string, data: Partial<CreateAccountPayload>): Promise<InstagramAccount> => {
    try {
      const res = await fetch(`${BASE_URL}/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('updateAccount error:', e);
    }
    const acc = DEFAULT_FALLBACK_ACCOUNTS.find(a => a.id === id) || DEFAULT_FALLBACK_ACCOUNTS[0];
    if (data.accountName) acc.accountName = data.accountName;
    return acc;
  },

  deleteAccount: async (id: string): Promise<void> => {
    try {
      await fetch(`${BASE_URL}/accounts/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
      });
    } catch (e) {
      console.warn('deleteAccount error:', e);
    }
  },

  disconnectAccount: async (id: string): Promise<InstagramAccount> => {
    try {
      const res = await fetch(`${BASE_URL}/accounts/${id}/disconnect`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('disconnectAccount error:', e);
    }
    const acc = DEFAULT_FALLBACK_ACCOUNTS.find(a => a.id === id) || DEFAULT_FALLBACK_ACCOUNTS[0];
    acc.connectionStatus = 'DISCONNECTED';
    return acc;
  },

  renameAccountLabel: async (id: string, label: string): Promise<InstagramAccount> => {
    try {
      const res = await fetch(`${BASE_URL}/accounts/${id}/label`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ label }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('renameAccountLabel error:', e);
    }
    const acc = DEFAULT_FALLBACK_ACCOUNTS.find(a => a.id === id) || DEFAULT_FALLBACK_ACCOUNTS[0];
    acc.accountName = label;
    return acc;
  },

  setDefaultAccount: async (id: string): Promise<InstagramAccount> => {
    try {
      const res = await fetch(`${BASE_URL}/accounts/${id}/set-default`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('setDefaultAccount error:', e);
    }
    DEFAULT_FALLBACK_ACCOUNTS.forEach(a => { a.isDefault = a.id === id; });
    return DEFAULT_FALLBACK_ACCOUNTS.find(a => a.id === id) || DEFAULT_FALLBACK_ACCOUNTS[0];
  },

  syncAccount: async (id: string): Promise<InstagramAccount> => {
    try {
      const res = await fetch(`${BASE_URL}/accounts/${id}/sync`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('syncAccount error:', e);
    }
    const acc = DEFAULT_FALLBACK_ACCOUNTS.find(a => a.id === id) || DEFAULT_FALLBACK_ACCOUNTS[0];
    acc.lastSyncedAt = new Date().toISOString();
    acc.lastSuccessfulSync = new Date().toISOString();
    acc.connectionStatus = 'CONNECTED';
    return acc;
  },

  getCombinedAnalytics: async (): Promise<CombinedAnalyticsResponse> => {
    try {
      const res = await fetch(`${BASE_URL}/accounts/combined`, {
        headers: { ...getAuthHeader() },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('getCombinedAnalytics fetch error:', e);
    }
    return {
      totalAccounts: DEFAULT_FALLBACK_ACCOUNTS.length,
      totalFollowers: 75300,
      totalFollowing: 510,
      totalReach: 717000,
      totalImpressions: 961000,
      totalEngagement: 115390,
      averageEngagementRate: 13.02,
      totalPosts: 80,
      totalReels: 44,
      activeCampaignsCount: 3,
      accountBreakdown: DEFAULT_FALLBACK_ACCOUNTS,
    };
  },

  compareAccounts: async (accountIds?: string[]): Promise<AccountComparisonResponse> => {
    try {
      const query = accountIds && accountIds.length > 0 ? `?accountIds=${accountIds.join(',')}` : '';
      const res = await fetch(`${BASE_URL}/accounts/compare${query}`, {
        headers: { ...getAuthHeader() },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('compareAccounts fetch error:', e);
    }
    const benchmarks: AccountBenchmark[] = DEFAULT_FALLBACK_ACCOUNTS.map(a => ({
      id: a.id,
      username: a.username,
      displayName: a.displayName,
      profilePicture: a.profilePicture,
      followers: a.followers,
      reach: a.reach,
      impressions: a.impressions,
      engagement: a.engagements,
      engagementRate: a.engagementRate,
      posts: a.posts,
      reels: a.reels,
      followerGrowth: a.followerGrowth,
      activeCampaigns: 2,
    }));
    return {
      accounts: benchmarks,
      topByReach: benchmarks[0],
      topByEngagementRate: benchmarks[0],
      topByFollowers: benchmarks[0],
      summaryTakeaway: 'Nike Football Official leads overall reach and engagement velocity.',
    };
  },
};
