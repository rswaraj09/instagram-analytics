import React, { useState } from 'react';

export interface InstagramAccountSummary {
  id?: string;
  username?: string;
  displayName?: string;
  profilePictureUrl?: string;
  profilePicture?: string;
  igUserId?: string;
  profileUrl?: string;
}

interface CampaignAccountIdentityProps {
  account?: InstagramAccountSummary | null;
  // Fallbacks if account object is not directly provided
  username?: string;
  displayName?: string;
  profilePictureUrl?: string;
  // Styling & variant options
  variant?: 'card' | 'badge' | 'header' | 'compact';
  className?: string;
  dark?: boolean;
}

export const CampaignAccountIdentity: React.FC<CampaignAccountIdentityProps> = ({
  account,
  username: rawUsername,
  displayName: rawDisplayName,
  profilePictureUrl: rawPicture,
  variant = 'card',
  className = '',
  dark = false,
}) => {
  const [imgError, setImgError] = useState(false);

  // Extract resolved values with safe fallbacks
  const username = account?.username || rawUsername || 'instagram_brand';
  const displayName = account?.displayName || rawDisplayName || username.replace(/_/g, ' ');
  const pictureUrl = account?.profilePictureUrl || account?.profilePicture || rawPicture || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=150';
  
  const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
  const profileUrl = account?.profileUrl || `https://www.instagram.com/${cleanUsername}`;

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (profileUrl) {
      window.open(profileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Compact badge view
  if (variant === 'badge' || variant === 'compact') {
    return (
      <div 
        onClick={handleProfileClick}
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all hover:opacity-80 ${
          dark 
            ? 'bg-slate-800/90 text-slate-200 border border-slate-700/60' 
            : 'bg-indigo-50/90 text-indigo-950 border border-indigo-100'
        } ${className}`}
        title={`View @${cleanUsername} on Instagram`}
      >
        <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1px]">
          <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
            {!imgError ? (
              <img
                src={pictureUrl}
                alt={displayName}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[10px] font-bold text-rose-600">IG</span>
            )}
          </div>
        </div>
        <span className="font-semibold text-[11px] tracking-tight truncate">@{cleanUsername}</span>
      </div>
    );
  }

  // Large Hero / Header variant
  if (variant === 'header') {
    return (
      <div className={`flex items-center gap-3.5 ${className}`}>
        <div 
          onClick={handleProfileClick}
          className="relative w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-md cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
          title={`Open @${cleanUsername} profile`}
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
            {!imgError ? (
              <img
                src={pictureUrl}
                alt={displayName}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-black text-rose-600">IG</span>
            )}
          </div>
        </div>
        <div className="min-w-0">
          <div 
            onClick={handleProfileClick}
            className="flex items-center gap-1.5 cursor-pointer group"
          >
            <span className={`text-xs font-bold tracking-wide uppercase ${dark ? 'text-rose-400' : 'text-indigo-600'}`}>
              @{cleanUsername}
            </span>
            <span className="text-[10px] opacity-70 group-hover:translate-x-0.5 transition-transform">↗</span>
          </div>
          <h4 className={`text-base font-extrabold truncate ${dark ? 'text-white' : 'text-gray-900'}`}>
            {displayName}
          </h4>
        </div>
      </div>
    );
  }

  // Default Standard Card variant
  return (
    <div 
      onClick={handleProfileClick}
      className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 border ${
        dark 
          ? 'bg-slate-950/60 border-slate-800/80 text-white' 
          : 'bg-indigo-50/60 border-indigo-100/80 text-gray-900'
      } ${className}`}
      title={`Open Instagram Account @${cleanUsername}`}
    >
      <div className="relative w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex-shrink-0 shadow-sm">
        <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
          {!imgError ? (
            <img
              src={pictureUrl}
              alt={displayName}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-rose-600">IG</span>
          )}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className={`text-xs font-bold truncate ${dark ? 'text-rose-400' : 'text-indigo-600'}`}>
            @{cleanUsername}
          </span>
        </div>
        <p className={`text-xs font-semibold truncate ${dark ? 'text-slate-300' : 'text-gray-700'}`}>
          {displayName}
        </p>
      </div>
    </div>
  );
};
