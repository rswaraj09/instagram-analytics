import type { InstagramAccountSummary } from '../components/CampaignAccountIdentity';
export type { InstagramAccountSummary };

const BASE_URL = 'http://localhost:8080/api';

export interface Campaign {
  id: string;
  userId?: string;
  name: string;
  objective: string;
  brand?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  budget: number;
  totalSpend: number;
  revenue: number;
  status: 'DRAFT' | 'ACTIVE' | 'SCHEDULED' | 'COMPLETED' | 'PAUSED' | 'FAILED';
  createdAt?: string;
  updatedAt?: string;
  instagramAccount?: InstagramAccountSummary;
  instagramAccounts?: InstagramAccountSummary[];
  totalReach?: number;
  totalImpressions?: number;
  totalEngagements?: number;
  engagementRate?: number;
  totalLikes?: number;
  totalComments?: number;
  totalShares?: number;
  totalSaves?: number;
  totalVideoViews?: number;
  totalProfileVisits?: number;
  totalFollowerGrowth?: number;
  totalLinkClicks?: number;
  totalConversions?: number;
  conversionRate?: number;
  cpe?: number;
  cpc?: number;
  cpm?: number;
  roas?: number;
  ctr?: number;
  contentCount?: number;
  influencerCount?: number;
  contents?: CampaignContent[];
}

export interface CampaignContent {
  id?: string;
  campaignId?: string;
  mediaId?: string;
  mediaType: 'POST' | 'REEL' | 'CAROUSEL' | 'STORY';
  caption?: string;
  permalink?: string;
  thumbnailUrl?: string;
  publishedAt?: string;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
  linkClicks: number;
  conversions: number;
  engagementRate?: number;
  ctr?: number;
}

export interface CampaignInfluencer {
  id?: string;
  campaignId?: string;
  influencerName: string;
  handle?: string;
  followers: number;
  reach: number;
  engagements: number;
  contentCount: number;
  cost: number;
  conversions: number;
  notes?: string;
  engagementRate?: number;
  cpe?: number;
  roi?: number;
  rank?: number;
}

export interface CampaignGoal {
  id?: string;
  campaignId?: string;
  metricType: string;
  targetValue: number;
  currentValue: number;
  progressPercentage?: number;
  isOnTrack?: boolean;
}

export interface CampaignMetric {
  date: string;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  videoViews: number;
  profileVisits: number;
  followerGrowth: number;
  linkClicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  engagementRate: number;
}

export interface CampaignAudience {
  ageGroups: Record<string, number>;
  genderDistribution: Record<string, number>;
  topCountries: Record<string, number>;
  topCities: Record<string, number>;
  interests: string[];
  followerReach: number;
  nonFollowerReach: number;
}

export interface CampaignAIInsights {
  whatPerformedWell: string[];
  whatPerformedPoorly: string[];
  bestPerformingContent: string;
  bestPerformingInfluencer: string;
  audienceInsights: string;
  engagementTrends: string;
  campaignWeaknesses: string[];
  recommendedImprovements: string[];
  suggestedStrategy: string;
  overallScore: number;
}

export interface CampaignDetail {
  campaign: Campaign;
  contents: CampaignContent[];
  influencers: CampaignInfluencer[];
  goals: CampaignGoal[];
  metrics: CampaignMetric[];
  audience: CampaignAudience;
  aiInsights: CampaignAIInsights;
}

export interface CampaignComparison {
  campaigns: Campaign[];
  bestPerformingCampaignId: string;
  bestPerformingCampaignName: string;
  comparisonSummary: string;
}

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

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'c-demo-1',
    name: 'Summer Fashion Festival 2026',
    objective: 'Brand Awareness & Reel Engagement',
    brand: 'Urban Style Studio',
    category: 'Fashion',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    budget: 15000,
    totalSpend: 8400,
    revenue: 34200,
    status: 'ACTIVE',
    instagramAccount: {
      id: 'acc-urban-style',
      username: 'urban_style_studio',
      displayName: 'Urban Style Studio',
      profilePictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      profileUrl: 'https://www.instagram.com/urban_style_studio',
    },
    totalReach: 320000,
    totalImpressions: 480000,
    totalEngagements: 45200,
    engagementRate: 14.1,
    totalLikes: 34000,
    totalComments: 2800,
    totalShares: 4100,
    totalSaves: 4300,
    totalVideoViews: 280000,
    totalProfileVisits: 3200,
    totalFollowerGrowth: 1450,
    totalLinkClicks: 2100,
    totalConversions: 420,
    conversionRate: 20.0,
    cpe: 0.18,
    cpc: 4.0,
    cpm: 17.5,
    roas: 4.07,
    ctr: 4.37,
    contentCount: 8,
    influencerCount: 4,
    contents: [
      {
        id: 'c1-1',
        mediaId: 'reel_fashion_1',
        mediaType: 'REEL',
        caption: '🔥 Summer Fashion Reel launch! Discover the trends for 2026.',
        permalink: 'https://www.instagram.com/reel/C1_urban_fashion',
        thumbnailUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
        publishedAt: '2026-06-05T10:00:00Z',
        reach: 180000,
        impressions: 260000,
        likes: 22000,
        comments: 1800,
        shares: 2400,
        saves: 2900,
        views: 190000,
        linkClicks: 1400,
        conversions: 280,
      },
      {
        id: 'c1-2',
        mediaId: 'post_fashion_2',
        mediaType: 'POST',
        caption: 'Urban Streetwear collection highlight 📸 Swipe left for details.',
        permalink: 'https://www.instagram.com/p/C2_urban_street',
        thumbnailUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
        publishedAt: '2026-06-12T14:30:00Z',
        reach: 140000,
        impressions: 220000,
        likes: 12000,
        comments: 1000,
        shares: 1700,
        saves: 1400,
        views: 0,
        linkClicks: 700,
        conversions: 140,
      }
    ]
  },
  {
    id: 'c-demo-2',
    name: 'AI Tech Launch Campaign',
    objective: 'Product Demos & Link Conversions',
    brand: 'Tech Trends',
    category: 'Technology',
    startDate: '2026-05-15',
    endDate: '2026-07-15',
    budget: 25000,
    totalSpend: 19800,
    revenue: 89000,
    status: 'ACTIVE',
    instagramAccount: {
      id: 'acc-tech-trends',
      username: 'tech_trends_official',
      displayName: 'Tech Trends Global',
      profilePictureUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      profileUrl: 'https://www.instagram.com/tech_trends_official',
    },
    totalReach: 640000,
    totalImpressions: 890000,
    totalEngagements: 98400,
    engagementRate: 15.3,
    totalLikes: 72000,
    totalComments: 6400,
    totalShares: 9800,
    totalSaves: 10200,
    totalVideoViews: 580000,
    totalProfileVisits: 7400,
    totalFollowerGrowth: 3200,
    totalLinkClicks: 5600,
    totalConversions: 1120,
    conversionRate: 20.0,
    cpe: 0.20,
    cpc: 3.53,
    cpm: 22.25,
    roas: 4.49,
    ctr: 5.71,
    contentCount: 14,
    influencerCount: 6,
    contents: [
      {
        id: 'c2-1',
        mediaId: 'reel_tech_1',
        mediaType: 'REEL',
        caption: '🤖 Next-Gen AI Demo: Unleashing autonomous productivity features.',
        permalink: 'https://www.instagram.com/reel/C3_tech_ai_demo',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
        publishedAt: '2026-05-20T11:00:00Z',
        reach: 420000,
        impressions: 590000,
        likes: 48000,
        comments: 4200,
        shares: 6800,
        saves: 7100,
        views: 410000,
        linkClicks: 3900,
        conversions: 780,
      },
      {
        id: 'c2-2',
        mediaId: 'post_tech_2',
        mediaType: 'POST',
        caption: 'Top 5 AI integrations for modern creators in 2026 🚀',
        permalink: 'https://www.instagram.com/p/C4_tech_tips',
        thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
        publishedAt: '2026-05-28T16:00:00Z',
        reach: 220000,
        impressions: 300000,
        likes: 24000,
        comments: 2200,
        shares: 3000,
        saves: 3100,
        views: 0,
        linkClicks: 1700,
        conversions: 340,
      }
    ]
  }
];

export const getCampaigns = async (token: string): Promise<Campaign[]> => {
  try {
    const response = await fetch(`${BASE_URL}/campaigns`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.warn('getCampaigns fetch error, using fallback:', e);
  }
  return MOCK_CAMPAIGNS;
};

export const getCampaignDetail = async (id: string, token: string): Promise<CampaignDetail> => {
  const response = await fetch(`${BASE_URL}/campaigns/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return jsonOrThrow(response, 'Failed to fetch campaign details');
};

export const createCampaign = async (payload: Partial<Campaign>, token: string): Promise<Campaign> => {
  const response = await fetch(`${BASE_URL}/campaigns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(response, 'Failed to create campaign');
};

export const updateCampaign = async (id: string, payload: Partial<Campaign>, token: string): Promise<Campaign> => {
  const response = await fetch(`${BASE_URL}/campaigns/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(response, 'Failed to update campaign');
};

export const deleteCampaign = async (id: string, token: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/campaigns/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to delete campaign');
  }
};

export const addCampaignContent = async (campaignId: string, payload: Partial<CampaignContent>, token: string): Promise<CampaignContent> => {
  const response = await fetch(`${BASE_URL}/campaigns/${campaignId}/content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(response, 'Failed to add content to campaign');
};

export const deleteCampaignContent = async (campaignId: string, contentId: string, token: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/campaigns/${campaignId}/content/${contentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to delete content');
};

export const addCampaignInfluencer = async (campaignId: string, payload: Partial<CampaignInfluencer>, token: string): Promise<CampaignInfluencer> => {
  const response = await fetch(`${BASE_URL}/campaigns/${campaignId}/influencers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(response, 'Failed to add influencer to campaign');
};

export const deleteCampaignInfluencer = async (campaignId: string, influencerId: string, token: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/campaigns/${campaignId}/influencers/${influencerId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to delete influencer');
};

export const addCampaignGoal = async (campaignId: string, payload: Partial<CampaignGoal>, token: string): Promise<CampaignGoal> => {
  const response = await fetch(`${BASE_URL}/campaigns/${campaignId}/goals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(response, 'Failed to add campaign goal');
};

export const deleteCampaignGoal = async (campaignId: string, goalId: string, token: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/campaigns/${campaignId}/goals/${goalId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to delete goal');
};

export const compareCampaigns = async (campaignIds: string[], token: string): Promise<CampaignComparison> => {
  const response = await fetch(`${BASE_URL}/campaigns/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ campaignIds }),
  });
  return jsonOrThrow(response, 'Failed to compare campaigns');
};

export const getCampaignMetricsOverTime = async (campaignId: string, token: string, period = 'daily', startDate?: string, endDate?: string): Promise<CampaignMetric[]> => {
  const qs = new URLSearchParams({ period });
  if (startDate) qs.set('startDate', startDate);
  if (endDate) qs.set('endDate', endDate);
  const response = await fetch(`${BASE_URL}/campaigns/${campaignId}/metrics?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return jsonOrThrow(response, 'Failed to fetch campaign metrics');
};
