import React, { useState } from 'react';
import type { Campaign, CampaignContent } from '../api/campaignApi';
import { CampaignAccountIdentity } from './CampaignAccountIdentity';

interface CampaignMediaViewerProps {
  campaign: Campaign;
  contents?: CampaignContent[];
  variant?: 'card' | 'hero' | 'compact';
  dark?: boolean;
  className?: string;
  showAccountIdentityBelow?: boolean;
}

export const CampaignMediaViewer: React.FC<CampaignMediaViewerProps> = ({
  campaign,
  contents: explicitContents,
  variant = 'card',
  dark = true,
  className = '',
  showAccountIdentityBelow = true,
}) => {
  // Determine media list
  const contentsList: CampaignContent[] = React.useMemo(() => {
    if (explicitContents && explicitContents.length > 0) return explicitContents;
    if (campaign.contents && campaign.contents.length > 0) return campaign.contents;
    
    // Fallback single media item derived from campaign properties
    const brandName = campaign.brand || campaign.name || 'Campaign';
    const seed = Math.abs(brandName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
    
    const fallbackMediaPool = [
      { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80', type: 'REEL' as const },
      { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80', type: 'POST' as const },
      { url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80', type: 'REEL' as const },
      { url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80', type: 'POST' as const },
      { url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80', type: 'REEL' as const },
      { url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80', type: 'POST' as const },
    ];
    
    const chosen = fallbackMediaPool[seed % fallbackMediaPool.length];
    const accountHandle = campaign.instagramAccount?.username || brandName.toLowerCase().replace(/\s+/g, '_');
    
    return [
      {
        id: `fallback-${campaign.id}`,
        mediaId: `post_${seed}`,
        mediaType: chosen.type,
        caption: `Official campaign post for ${campaign.name}`,
        permalink: `https://www.instagram.com/${accountHandle}/`,
        thumbnailUrl: chosen.url,
        reach: campaign.totalReach || 0,
        impressions: campaign.totalImpressions || 0,
        likes: campaign.totalLikes || 0,
        comments: campaign.totalComments || 0,
        shares: campaign.totalShares || 0,
        saves: campaign.totalSaves || 0,
        views: campaign.totalVideoViews || 0,
        linkClicks: campaign.totalLinkClicks || 0,
        conversions: campaign.totalConversions || 0,
      },
    ];
  }, [campaign, explicitContents]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const activeContent = contentsList[activeIdx] || contentsList[0];
  const postUrl = activeContent.permalink || campaign.instagramAccount?.profileUrl || 'https://www.instagram.com/';
  const mediaType = activeContent.mediaType || (campaign.totalVideoViews && campaign.totalVideoViews > 0 ? 'REEL' : 'POST');
  const mediaSrc = activeContent.thumbnailUrl;

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageLoaded(false);
    setImageError(false);
    setActiveIdx((prev) => (prev + 1) % contentsList.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageLoaded(false);
    setImageError(false);
    setActiveIdx((prev) => (prev - 1 + contentsList.length) % contentsList.length);
  };

  // Badges styling
  const getTypeBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case 'REEL':
        return {
          label: '🎬 REEL',
          bg: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-500/30',
        };
      case 'CAROUSEL':
        return {
          label: '🎠 CAROUSEL',
          bg: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30',
        };
      case 'STORY':
        return {
          label: '📱 STORY',
          bg: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30',
        };
      default:
        return {
          label: '📷 POST',
          bg: 'bg-slate-900/90 text-slate-100 border border-slate-700/80 backdrop-blur-md',
        };
    }
  };

  const badgeInfo = getTypeBadge(mediaType);

  const aspectClass =
    variant === 'hero' ? 'aspect-[16/9]' : variant === 'compact' ? 'aspect-square' : 'aspect-[4/3]';

  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      {/* Media Box */}
      <div className={`relative overflow-hidden rounded-2xl group border ${dark ? 'border-slate-800 bg-slate-950' : 'border-gray-200 bg-gray-50'} shadow-md`}>
        <a
          href={postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`block relative w-full ${aspectClass} overflow-hidden cursor-pointer`}
          title={`Click to open ${activeContent.caption || campaign.name} on Instagram`}
        >
          {/* Skeleton loading spinner */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Media Image */}
          {!imageError && mediaSrc ? (
            <img
              src={mediaSrc}
              alt={activeContent.caption || campaign.name}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            /* Fallback Card if media fails to load or missing */
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center">
              <span className="text-3xl mb-2">📸</span>
              <p className="text-xs font-bold text-white line-clamp-2">{activeContent.caption || campaign.name}</p>
              <span className="mt-3 px-3 py-1 rounded-full text-[10px] font-bold bg-fuchsia-600/30 border border-fuchsia-500/40 text-fuchsia-300">
                View Instagram Post ↗
              </span>
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide backdrop-blur-md ${badgeInfo.bg}`}>
              {badgeInfo.label}
            </span>
          </div>

          {/* Multi-post count indicator */}
          {contentsList.length > 1 && (
            <div className="absolute top-3 right-3 z-10 bg-slate-950/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-700/60">
              {activeIdx + 1} / {contentsList.length}
            </div>
          )}

          {/* Hover Overlay with Instagram Permalink Prompt */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            {activeContent.caption && (
              <p className="text-xs text-slate-200 line-clamp-2 mb-2 font-medium">
                "{activeContent.caption}"
              </p>
            )}
            <div className="flex items-center gap-1.5 text-xs font-bold text-fuchsia-400">
              <span>View Post on Instagram</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </div>
        </a>

        {/* Carousel Prev / Next Controls if multiple posts exist */}
        {contentsList.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              title="Previous Instagram post"
            >
              ‹
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              title="Next Instagram post"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Account Identity Attribution Below Campaign Media Image */}
      {showAccountIdentityBelow && (
        <div className={`pt-1 border-t ${dark ? 'border-slate-800/80' : 'border-gray-100'}`}>
          <CampaignAccountIdentity
            account={campaign.instagramAccount}
            username={campaign.brand?.toLowerCase().replace(/\s+/g, '_')}
            displayName={campaign.brand || campaign.name}
            variant="card"
            dark={dark}
          />
        </div>
      )}
    </div>
  );
};

export default CampaignMediaViewer;
