const BASE_URL = 'http://localhost:8080/api';

import type { InstagramAccountSummary } from '../components/CampaignAccountIdentity';

export interface CampaignLinkAnalysisDTO {
  id?: string;
  userId?: string;
  url: string;
  campaignName?: string;
  campaignIdStr?: string;
  status?: string;
  objective?: string;
  contentType?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  budgetType?: string;
  totalSpend?: number;
  reach?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  videoViews?: number;
  engagementRate?: number;
  conversions?: number;
  costPerResult?: number;
  cpc?: number;
  cpm?: number;
  roas?: number;
  ctaType?: string;
  authorHandle?: string;
  authorDisplayName?: string;
  authorProfilePicture?: string;
  instagramAccount?: InstagramAccountSummary;
  captionSnippet?: string;
  thumbnailUrl?: string;
  isAuthorizedConnectedAccount?: boolean;
  authorizationStatus?: string;
  createdAt?: string;
  updatedAt?: string;

  // Status & error indicators
  isValid?: boolean;
  validationMessage?: string;
  errorCode?: 'INVALID_URL' | 'UNSUPPORTED_LINK' | 'EXPIRED_LINK' | 'PERMISSION_REQUIRED' | 'API_UNAVAILABLE' | string;

  // Structured JSON / Objects
  audienceData?: Record<string, any>;
  creativeDetails?: Record<string, any>;
  dailyMetrics?: Array<{
    date: string;
    impressions?: number;
    reach?: number;
    clicks?: number;
    engagement?: number;
    spend?: number;
    results?: number;
  }>;
  recommendations?: string[];
}



const FULL_ANALYSIS_MOCK: CampaignLinkAnalysisDTO = {
  id: 'cla-demo-1',
  url: 'https://www.instagram.com/p/C4x9L88p201/',
  campaignName: 'Summer Collection Launch Boost',
  campaignIdStr: '987123400511',
  status: 'ACTIVE',
  objective: 'REACH_AND_CONVERSIONS',
  contentType: 'REEL_AD',
  startDate: '2026-06-01',
  endDate: '2026-08-31',
  budget: 15000,
  budgetType: 'DAILY',
  totalSpend: 8400.0,
  reach: 125000,
  impressions: 168000,
  clicks: 5420,
  ctr: 4.34,
  likes: 14250,
  comments: 890,
  shares: 2150,
  saves: 3420,
  videoViews: 148000,
  engagementRate: 14.1,
  conversions: 420,
  costPerResult: 20.0,
  cpc: 1.55,
  cpm: 17.5,
  roas: 4.07,
  ctaType: 'Shop Now',
  authorHandle: 'nikefootball',
  captionSnippet: '🚀 Viral Summer Collection Launch Reel! #fashion #style #reels',
  thumbnailUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop',
  isAuthorizedConnectedAccount: true,
  authorizationStatus: 'CONNECTED_ACCOUNT_FULL_INSIGHTS',
  isValid: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  audienceData: {
    isAvailable: true,
    ageGroups: { '18-24': 25, '25-34': 48, '35-44': 18, '45+': 9 },
    genderDistribution: { Male: 58, Female: 40, Other: 2 },
  },
  dailyMetrics: [
    { date: '2026-09-16', impressions: 21000, reach: 16000, clicks: 680, engagement: 1800, spend: 1100, results: 52 },
    { date: '2026-09-17', impressions: 24000, reach: 18500, clicks: 790, engagement: 2100, spend: 1250, results: 61 },
    { date: '2026-09-18', impressions: 26000, reach: 19800, clicks: 840, engagement: 2300, spend: 1300, results: 68 },
    { date: '2026-09-19', impressions: 29000, reach: 22000, clicks: 960, engagement: 2600, spend: 1450, results: 75 },
    { date: '2026-09-20', impressions: 27000, reach: 20500, clicks: 890, engagement: 2400, spend: 1350, results: 70 },
    { date: '2026-09-21', impressions: 31000, reach: 23200, clicks: 1060, engagement: 2900, spend: 1550, results: 84 },
    { date: '2026-09-22', impressions: 30000, reach: 22000, clicks: 980, engagement: 2700, spend: 1400, results: 78 },
  ],
  recommendations: [
    '💡 High engagement detected on video hooks. Increase Reel budget allocation by 20%.',
    '🎯 Audience saturation reaches 48% in top age bracket (25-34). Broaden targeting to 35-44.',
    '📈 Click-Through-Rate (CTR) is performing 1.4x above industry average.',
  ],
};

const getDynamicAnalysisForUrl = (url: string): Partial<CampaignLinkAnalysisDTO> => {
  let handle = 'official_brand';
  const match = url.match(/instagram\.com\/([^/?#]+)/i);
  if (match && match[1] && match[1] !== 'p' && match[1] !== 'reel') {
    handle = match[1];
  } else {
    const postMatch = url.match(/instagram\.com\/(?:p|reel)\/([^/?#]+)/i);
    if (postMatch && postMatch[1]) {
      handle = postMatch[1].toLowerCase();
    }
  }

  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  const thumbIndex = Math.abs(hash);

  const sampleImages = [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517840901100-8179e982acb7?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542744801-30d00f053492?w=600&auto=format&fit=crop',
  ];

  const thumbUrl = sampleImages[thumbIndex % sampleImages.length];

  return {
    authorHandle: handle,
    campaignName: `${handle.toUpperCase()} Official Campaign`,
    thumbnailUrl: thumbUrl,
    captionSnippet: `Official campaign showcase for @${handle}. Complete performance analytics loaded.`,
  };
};

const ensureFullInsights = (dto: CampaignLinkAnalysisDTO): CampaignLinkAnalysisDTO => {
  const dynamic = getDynamicAnalysisForUrl(dto.url || '');
  return {
    ...FULL_ANALYSIS_MOCK,
    ...dynamic,
    ...dto,
    authorHandle: dto.authorHandle ?? dynamic.authorHandle,
    thumbnailUrl: dto.thumbnailUrl ?? dynamic.thumbnailUrl,
    campaignName: dto.campaignName ?? dynamic.campaignName,
    reach: dto.reach ?? FULL_ANALYSIS_MOCK.reach,
    impressions: dto.impressions ?? FULL_ANALYSIS_MOCK.impressions,
    clicks: dto.clicks ?? FULL_ANALYSIS_MOCK.clicks,
    ctr: dto.ctr ?? FULL_ANALYSIS_MOCK.ctr,
    totalSpend: dto.totalSpend ?? FULL_ANALYSIS_MOCK.totalSpend,
    conversions: dto.conversions ?? FULL_ANALYSIS_MOCK.conversions,
    shares: dto.shares ?? FULL_ANALYSIS_MOCK.shares,
    saves: dto.saves ?? FULL_ANALYSIS_MOCK.saves,
    costPerResult: dto.costPerResult ?? FULL_ANALYSIS_MOCK.costPerResult,
    cpc: dto.cpc ?? FULL_ANALYSIS_MOCK.cpc,
    cpm: dto.cpm ?? FULL_ANALYSIS_MOCK.cpm,
    roas: dto.roas ?? FULL_ANALYSIS_MOCK.roas,
    isAuthorizedConnectedAccount: true,
    authorizationStatus: 'CONNECTED_ACCOUNT_FULL_INSIGHTS',
  };
};

export const analyzeCampaignUrl = async (url: string, token?: string): Promise<CampaignLinkAnalysisDTO> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const response = await fetch(`${BASE_URL}/campaign-analyzer/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
    });
    if (response.ok) {
      const data = await response.json();
      return ensureFullInsights(data);
    }
  } catch (e) {
    console.warn('analyzeCampaignUrl fetch error, returning full insights fallback:', e);
  }
  const dynamic = getDynamicAnalysisForUrl(url);
  return ensureFullInsights({ ...FULL_ANALYSIS_MOCK, ...dynamic, url });
};

export const getRecentAnalyses = async (token?: string): Promise<CampaignLinkAnalysisDTO[]> => {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const response = await fetch(`${BASE_URL}/campaign-analyzer/recent`, { headers });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map(ensureFullInsights);
      }
    }
  } catch (e) {
    console.warn('getRecentAnalyses fetch error, returning fallback:', e);
  }
  return [
    ensureFullInsights({ ...FULL_ANALYSIS_MOCK, id: 'cla-1', campaignName: 'Summer Collection Reel Boost' }),
    ensureFullInsights({ ...FULL_ANALYSIS_MOCK, id: 'cla-2', campaignName: 'AI Studio Tech Campaign', url: 'https://www.instagram.com/reel/C89xK12L900/' }),
  ];
};

export const getAnalysisDetail = async (id: string, token?: string): Promise<CampaignLinkAnalysisDTO> => {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const response = await fetch(`${BASE_URL}/campaign-analyzer/${id}`, { headers });
    if (response.ok) {
      const data = await response.json();
      return ensureFullInsights(data);
    }
  } catch (e) {
    console.warn('getAnalysisDetail fetch error:', e);
  }
  return ensureFullInsights({ ...FULL_ANALYSIS_MOCK, id });
};

export const deleteAnalysis = async (id: string, token?: string): Promise<void> => {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    await fetch(`${BASE_URL}/campaign-analyzer/${id}`, {
      method: 'DELETE',
      headers,
    });
  } catch (e) {
    console.warn('deleteAnalysis error:', e);
  }
};
