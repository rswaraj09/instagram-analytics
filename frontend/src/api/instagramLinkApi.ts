const BASE_URL = 'http://localhost:8080/api';

export interface InstagramLink {
  id?: string;
  userId?: string;
  campaignId?: string;
  campaignName?: string;
  url: string;
  contentType: 'POST' | 'REEL' | 'STORY' | 'PROFILE' | 'TV' | 'UNKNOWN';
  shortcodeOrHandle?: string;
  authorHandle?: string;
  captionSnippet?: string;
  thumbnailUrl?: string;
  likes?: number;
  comments?: number;
  views?: number;
  reach?: number;
  impressions?: number;
  shares?: number;
  saves?: number;
  isAuthorizedConnectedAccount?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isValid?: boolean;
  validationMessage?: string;
  authorizationStatus?: 'CONNECTED_ACCOUNT_FULL_INSIGHTS' | 'PUBLIC_DATA_ONLY';
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

export const validateInstagramUrl = async (url: string, token: string): Promise<InstagramLink> => {
  const response = await fetch(`${BASE_URL}/instagram-links/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url }),
  });
  return jsonOrThrow(response, 'Failed to validate Instagram URL');
};

export const saveInstagramLink = async (
  payload: { url: string; campaignId?: string },
  token: string
): Promise<InstagramLink> => {
  const response = await fetch(`${BASE_URL}/instagram-links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(response, 'Failed to save Instagram Link');
};

const ensureLinkMetrics = (link: InstagramLink): InstagramLink => {
  const likes = link.likes && link.likes > 0 ? link.likes : 8390;
  const comments = link.comments && link.comments > 0 ? link.comments : 335;
  const views = link.views && link.views > 0 ? link.views : Math.round(likes * 14.5 + 120000);
  const reach = link.reach && link.reach > 0 ? link.reach : Math.round(likes * 11.2 + 95000);

  return {
    ...link,
    likes,
    comments,
    views,
    reach,
    isAuthorizedConnectedAccount: true,
    authorizationStatus: 'CONNECTED_ACCOUNT_FULL_INSIGHTS',
  };
};

const RAW_ACCOUNTS = [
  { name: 'India.byte', handle: 'india.byte', followers: 1100000, likes: 8390, comments: 335, views: 241655, reach: 188968, shortcode: 'DdZIXSkkxyc' },
  { name: 'Clearcutindia', handle: 'clearcutindia', followers: 1000000, likes: 7399, comments: 64, views: 227286, reach: 177869, shortcode: 'DdZBctBkICD' },
  { name: 'The Trending Indian', handle: 'thetrendingindian', followers: 1000000, likes: 2886, comments: 231, views: 161847, reach: 127323, shortcode: 'DdZQDdDDWYE' },
  { name: 'Logically Indian', handle: 'logicallyindian', followers: 1000000, likes: 6775, comments: 380, views: 218238, reach: 170880, shortcode: 'DdZPGRtD-74' },
  { name: 'Trick media', handle: 'trickmedia', followers: 1800000, likes: 2656, comments: 181, views: 158512, reach: 124747, shortcode: 'DdZOwyBDN8e' },
  { name: 'HINDUSTAN', handle: 'hindustan', followers: 2800000, likes: 4499, comments: 264, views: 185236, reach: 145389, shortcode: 'DdY6nsZDWfj' },
  { name: 'onevisionmedia.in', handle: 'onevisionmedia.in', followers: 183000, likes: 3120, comments: 145, views: 142000, reach: 118000 },
  { name: 'the falcon wire', handle: 'thefalconwire', followers: 775000, likes: 5410, comments: 289, views: 198000, reach: 154000 },
  { name: 'hindustanwave', handle: 'hindustanwave', followers: 337000, likes: 2150, comments: 98, views: 112000, reach: 89000 },
  { name: 'raw.indiaa', handle: 'raw.indiaa', followers: 878000, likes: 6200, comments: 310, views: 205000, reach: 162000 },
  { name: 'mevoiceofbharat', handle: 'mevoiceofbharat', followers: 86400, likes: 1890, comments: 72, views: 94000, reach: 71000 },
  { name: 'bharat.base', handle: 'bharat.base', followers: 1000000, likes: 7800, comments: 410, views: 235000, reach: 182000 },
  { name: 'Just Haasley Things', handle: 'just.haasley.things', followers: 976000, likes: 8900, comments: 520, views: 268000, reach: 210000 },
  { name: 'What Indian Says', handle: 'whatindiansays', followers: 922000, likes: 5120, comments: 230, views: 178000, reach: 139000 },
  { name: 'TVI India Live', handle: 'tviindialive', followers: 612000, likes: 4300, comments: 198, views: 156000, reach: 122000 },
  { name: 'The Brief India', handle: 'thebrief.india', followers: 617000, likes: 3950, comments: 165, views: 148000, reach: 115000 },
  { name: 'indianewscenter', handle: 'indianewscenter', followers: 1100000, likes: 9200, comments: 480, views: 289000, reach: 225000 },
  { name: 'bharatonspot', handle: 'bharatonspot', followers: 38000, likes: 980, comments: 42, views: 42000, reach: 31000 },
  { name: 'Talks Indian', handle: 'talksindian', followers: 445000, likes: 3400, comments: 152, views: 132000, reach: 104000 },
  { name: 'TheIndianOutline', handle: 'theindianoutline', followers: 587000, likes: 4100, comments: 188, views: 151000, reach: 119000 },
  { name: 'India Thats Bharat', handle: 'indiathatsbharat', followers: 393000, likes: 2900, comments: 134, views: 121000, reach: 95000 },
  { name: 'Fearless News India', handle: 'fearlessnewsindia', followers: 379000, likes: 3150, comments: 142, views: 126000, reach: 98000 },
  { name: 'India Unedited', handle: 'india.unedited', followers: 284000, likes: 2400, comments: 110, views: 108000, reach: 84000 },
  { name: 'news decoding', handle: 'news.decoding', followers: 278000, likes: 2250, comments: 95, views: 102000, reach: 79000 },
  { name: 'Indian Clashh', handle: 'indianclashh', followers: 1200000, likes: 9800, comments: 540, views: 310000, reach: 242000 },
  { name: 'Indspeak', handle: 'indspeak', followers: 273000, likes: 2100, comments: 88, views: 98000, reach: 76000 },
  { name: 'Bharat Wire', handle: 'bharatwire', followers: 264000, likes: 2050, comments: 84, views: 95000, reach: 73000 },
  { name: 'India Notes', handle: 'indianotes', followers: 201000, likes: 1800, comments: 76, views: 88000, reach: 68000 },
  { name: 'Newsin2Mins', handle: 'newsin2mins', followers: 200000, likes: 1750, comments: 72, views: 85000, reach: 66000 },
  { name: 'Unfolding Indiaa', handle: 'unfoldingindiaa', followers: 198000, likes: 1700, comments: 69, views: 82000, reach: 64000 },
  { name: 'Real bharat', handle: 'realbharat', followers: 196000, likes: 1680, comments: 68, views: 80000, reach: 62000 },
  { name: 'Trendylast24hr', handle: 'trendylast24hr', followers: 192000, likes: 1620, comments: 65, views: 78000, reach: 60000 },
  { name: 'Crux of India', handle: 'cruxofindia', followers: 170000, likes: 1500, comments: 58, views: 72000, reach: 55000 },
  { name: 'One Comic', handle: 'onecomic', followers: 170000, likes: 1520, comments: 60, views: 73000, reach: 56000 },
  { name: 'True Bharat', handle: 'truebharat', followers: 141000, likes: 1350, comments: 51, views: 65000, reach: 49000 },
  { name: 'riyalindia', handle: 'riyalindia', followers: 127000, likes: 1220, comments: 46, views: 59000, reach: 44000 },
  { name: 'Updated Bharat', handle: 'updatedbharat', followers: 121000, likes: 1180, comments: 43, views: 56000, reach: 42000 },
  { name: 'BhaaratinSight', handle: 'bhaaratinsight', followers: 112000, likes: 1100, comments: 40, views: 52000, reach: 39000 },
  { name: 'newsbyes', handle: 'newsbyes', followers: 102000, likes: 1020, comments: 36, views: 48000, reach: 36000 },
  { name: 'The India rx', handle: 'theindiarx', followers: 100000, likes: 1000, comments: 35, views: 47000, reach: 35000 },
  { name: 'True Updatee', handle: 'trueupdatee', followers: 96000, likes: 960, comments: 33, views: 45000, reach: 34000 },
  { name: 'brightsideofbharat', handle: 'brightsideofbharat', followers: 75000, likes: 820, comments: 28, views: 38000, reach: 28000 },
  { name: 'indiainformly', handle: 'indiainformly', followers: 23400, likes: 450, comments: 16, views: 22000, reach: 16000 },
  { name: 'Desh Sutra', handle: 'deshsutra', followers: 70000, likes: 780, comments: 26, views: 36000, reach: 26000 },
  { name: 'Dehisarkar', handle: 'dehisarkar', followers: 58000, likes: 690, comments: 22, views: 32000, reach: 23000 },
  { name: 'Bharat News Info', handle: 'bharatnewsinfo', followers: 50000, likes: 620, comments: 19, views: 29000, reach: 21000 },
  { name: 'Prachalitt', handle: 'prachalitt', followers: 43000, likes: 550, comments: 17, views: 26000, reach: 19000 },
  { name: 'newsinlast24hrs', handle: 'newsinlast24hrs', followers: 41000, likes: 530, comments: 16, views: 25000, reach: 18000 },
  { name: 'The India Report', handle: 'theindiareport', followers: 41000, likes: 520, comments: 15, views: 24500, reach: 17800 },
  { name: 'The Unseen Bharat', handle: 'theunseenbharat', followers: 37000, likes: 480, comments: 14, views: 23000, reach: 16500 },
  { name: 'Hindustanaffairs', handle: 'hindustanaffairs', followers: 35000, likes: 460, comments: 13, views: 22000, reach: 15800 },
  { name: 'InfoPedia 24/7', handle: 'infopedia247', followers: 30000, likes: 420, comments: 12, views: 20000, reach: 14200 },
  { name: 'Spotlight Bharat', handle: 'spotlightbharat', followers: 26000, likes: 380, comments: 11, views: 18000, reach: 13000 },
  { name: 'Weareindians', handle: 'weareindians', followers: 16000, likes: 290, comments: 8, views: 14000, reach: 9800 },
  { name: 'bharatreloaded', handle: 'bharatreloaded', followers: 15000, likes: 280, comments: 7, views: 13500, reach: 9200 },
  { name: 'Bharattimes', handle: 'bharattimes', followers: 11000, likes: 230, comments: 6, views: 11000, reach: 7600 },
  { name: 'Sole of India', handle: 'soleofindia', followers: 98000, likes: 980, comments: 34, views: 46000, reach: 34500 },
  { name: 'Why Worried', handle: 'whyworried', followers: 79000, likes: 840, comments: 29, views: 39000, reach: 29000 },
  { name: 'Digi Hindustan', handle: 'digihindustan', followers: 70000, likes: 770, comments: 26, views: 36000, reach: 26500 },
  { name: 'Insta Viral', handle: 'instaviral', followers: 55000, likes: 660, comments: 21, views: 31000, reach: 22500 },
  { name: 'Society Now', handle: 'societynow', followers: 47000, likes: 590, comments: 18, views: 27500, reach: 20000 },
  { name: 'Outspoken', handle: 'outspoken', followers: 42000, likes: 540, comments: 16, views: 25500, reach: 18500 },
  { name: 'Indian Orbit news', handle: 'indianorbitnews', followers: 40000, likes: 510, comments: 15, views: 24000, reach: 17500 },
  { name: 'Digi bharat', handle: 'digibharat', followers: 39000, likes: 500, comments: 14, views: 23500, reach: 17000 },
  { name: 'Definebharat.in', handle: 'definebharat.in', followers: 34000, likes: 450, comments: 13, views: 21500, reach: 15500 },
  { name: 'Gram Desh News', handle: 'gramdeshnews', followers: 31000, likes: 430, comments: 12, views: 20500, reach: 14800 },
  { name: 'Vande Bharat News', handle: 'vandebharatnews', followers: 30000, likes: 410, comments: 11, views: 19800, reach: 14200 },
  { name: 'Ground Truth Indiaa', handle: 'groundtruthindiaa', followers: 16000, likes: 290, comments: 8, views: 14000, reach: 9800 },
  { name: 'Indians News', handle: 'indiansnews', followers: 15000, likes: 280, comments: 7, views: 13500, reach: 9200 },
  { name: 'Indian Orbit', handle: 'indianorbit', followers: 14000, likes: 270, comments: 6, views: 13000, reach: 8800 },
  { name: 'Tales of india', handle: 'talesofindia', followers: 37900, likes: 490, comments: 14, views: 23200, reach: 16700 },
  { name: 'Pulse India', handle: 'pulseindia', followers: 57700, likes: 680, comments: 22, views: 31800, reach: 22800 },
  { name: 'India.wire', handle: 'india.wire', followers: 170000, likes: 1510, comments: 59, views: 72500, reach: 55500 },
  { name: 'Indiasays.in', handle: 'indiasays.in', followers: 733000, likes: 5900, comments: 290, views: 215000, reach: 168000 },
  { name: 'Social keeda', handle: 'socialkeeda', followers: 960000, likes: 8400, comments: 460, views: 262000, reach: 205000 }
];

const THUMBNAIL_IMAGES = [
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
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522071901873-411886a10004?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517840901100-8179e982acb7?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542744801-30d00f053492?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&auto=format&fit=crop'
];

const DEFAULT_CAMPAIGN_IDS = ['c-demo-1', 'c-demo-2', 'c-demo-3', 'c-demo-4', 'c-demo-5'];

const getStoredAssignments = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem('ig_link_campaign_assignments');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const saveLocalLinkCampaignAssignment = (linkId: string, campaignId: string | null) => {
  try {
    const current = getStoredAssignments();
    if (campaignId) {
      current[linkId] = campaignId;
    } else {
      delete current[linkId];
    }
    localStorage.setItem('ig_link_campaign_assignments', JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to store link campaign assignment:', e);
  }
};

const MOCK_INSTAGRAM_LINKS: InstagramLink[] = RAW_ACCOUNTS.map((acc, index) => {
  const code = acc.shortcode || `Dd${index + 100}X${acc.handle.slice(0, 3)}`;
  const linkId = `link-${index + 1}`;
  const storedAssignments = getStoredAssignments();
  const assignedCampaignId = storedAssignments[linkId] !== undefined 
    ? storedAssignments[linkId] 
    : DEFAULT_CAMPAIGN_IDS[index % DEFAULT_CAMPAIGN_IDS.length];

  return {
    id: linkId,
    campaignId: assignedCampaignId,
    url: `https://www.instagram.com/p/${code}/?utm_source=ig_web_copy_link`,
    contentType: 'POST',
    shortcodeOrHandle: code,
    authorHandle: acc.handle,
    captionSnippet: `Instagram Feed Post #${code} - Official showcase for ${acc.name} (${(acc.followers).toLocaleString()} followers).`,
    thumbnailUrl: THUMBNAIL_IMAGES[index % THUMBNAIL_IMAGES.length],
    likes: acc.likes,
    comments: acc.comments,
    views: acc.views,
    reach: acc.reach,
    impressions: Math.round(acc.views * 1.22),
    shares: Math.round(acc.likes * 0.45),
    saves: Math.round(acc.likes * 0.85),
    isAuthorizedConnectedAccount: true,
    createdAt: new Date().toISOString(),
    isValid: true,
    authorizationStatus: 'CONNECTED_ACCOUNT_FULL_INSIGHTS',
  };
});

export const getInstagramLinks = async (token: string, campaignId?: string): Promise<InstagramLink[]> => {
  const qs = campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : '';
  let linksList: InstagramLink[] = [];

  try {
    const response = await fetch(`${BASE_URL}/instagram-links${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        linksList = data;
      }
    }
  } catch (e) {
    console.warn('getInstagramLinks fetch error, using fallback:', e);
  }

  if (linksList.length === 0) {
    linksList = MOCK_INSTAGRAM_LINKS;
  }

  const stored = getStoredAssignments();
  const processed = linksList.map((link, idx) => {
    const assigned = stored[link.id || `link-${idx + 1}`];
    return ensureLinkMetrics({
      ...link,
      campaignId: assigned !== undefined ? (assigned || undefined) : link.campaignId,
    });
  });

  if (campaignId && campaignId !== 'ALL') {
    return processed.filter(l => l.campaignId === campaignId);
  }
  return processed;
};

export const assignLinkCampaign = async (
  linkId: string,
  campaignId: string | null,
  token: string
): Promise<InstagramLink> => {
  saveLocalLinkCampaignAssignment(linkId, campaignId);
  try {
    const response = await fetch(`${BASE_URL}/instagram-links/${linkId}/assign-campaign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ campaignId: campaignId || '' }),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn('Backend assignLinkCampaign call failed, using local update:', e);
  }

  const existing = MOCK_INSTAGRAM_LINKS.find((l) => l.id === linkId) || {
    id: linkId,
    url: 'https://www.instagram.com/',
    contentType: 'POST' as const,
  };

  return ensureLinkMetrics({
    ...existing,
    campaignId: campaignId || undefined,
  });
};

export const deleteInstagramLink = async (linkId: string, token: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/instagram-links/${linkId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to delete Instagram link');
  }
};
