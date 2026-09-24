import React, { useEffect, useState } from 'react';
import { getInstagramLinks } from '../api/instagramLinkApi';
import type { InstagramLink } from '../api/instagramLinkApi';

export const ContentPerformancePage: React.FC = () => {
  const token = localStorage.getItem('token') || '';
  const [links, setLinks] = useState<InstagramLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<'ALL' | 'POST' | 'REEL' | 'STORY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'likes' | 'comments' | 'reach' | 'er' | 'newest'>('likes');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInstagramLinks(token);
      setLinks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load content performance data');
    } finally {
      setLoading(false);
    }
  };

  const filtered = links.filter((item) => {
    const matchesTab = activeTab === 'ALL' || item.contentType === activeTab;
    const matchesSearch =
      (item.captionSnippet && item.captionSnippet.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.authorHandle && item.authorHandle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.url.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'comments') return (b.comments || 0) - (a.comments || 0);
    if (sortBy === 'reach') return (b.reach || 0) - (a.reach || 0);
    if (sortBy === 'er') {
      const erA = a.reach ? (((a.likes || 0) + (a.comments || 0)) / a.reach) * 100 : 0;
      const erB = b.reach ? (((b.likes || 0) + (b.comments || 0)) / b.reach) * 100 : 0;
      return erB - erA;
    }
    if (sortBy === 'newest') return (b.createdAt || '').localeCompare(a.createdAt || '');
    return (b.likes || 0) - (a.likes || 0);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-fuchsia-950/40 to-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Content Performance Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">
            Detailed performance breakdown for posts, Reels, and Stories showing engagement, reach, and authorized metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
            📊 Public & Private Insight Engine
          </span>
        </div>
      </div>

      {/* Filter and Tab Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Media Type Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {(['ALL', 'POST', 'REEL', 'STORY'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab === 'ALL' ? 'All Content' : `${tab}s`}
                <span className="ml-1.5 opacity-75 text-[10px]">
                  ({tab === 'ALL' ? links.length : links.filter((l) => l.contentType === tab).length})
                </span>
              </button>
            ))}
          </div>

          {/* Search and Sort */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-violet-500 focus:outline-none w-48"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-violet-500 focus:outline-none"
            >
              <option value="likes">Most Likes</option>
              <option value="comments">Most Comments</option>
              <option value="reach">Highest Reach</option>
              <option value="er">Highest ER%</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800">
          <div className="inline-block w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">Fetching content performance stats...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      ) : sorted.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80 space-y-3">
          <span className="text-4xl">🖼️</span>
          <h3 className="text-base font-bold text-white">No content items found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || activeTab !== 'ALL'
              ? 'No content matches your selected filters.'
              : 'Add Instagram URLs in the Instagram Links page to analyze content performance.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((item) => {
            const hasAuth = item.isAuthorizedConnectedAccount;
            const er = item.reach && item.reach > 0
              ? (((item.likes || 0) + (item.comments || 0)) / item.reach) * 100
              : 0;

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-violet-600/30 text-violet-300 border border-violet-500/30">
                      {item.contentType}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        hasAuth
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {hasAuth ? '🔒 Connected Account' : '🌐 Public Data Only'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">{item.captionSnippet || 'Instagram Media'}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Likes</span>
                      <span className="text-sm font-bold text-slate-100">{item.likes?.toLocaleString() || 0}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Comments</span>
                      <span className="text-sm font-bold text-slate-100">{item.comments?.toLocaleString() || 0}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Reach</span>
                      <span className="text-sm font-bold">
                        {item.reach != null ? (
                          <span className="text-emerald-400">{item.reach.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-500 italic text-[10px]" title="Private metric requires token">
                            N/A (Auth Needed)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block">Saves</span>
                      <span className="text-sm font-bold">
                        {item.saves != null ? (
                          <span className="text-emerald-400">{item.saves.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-500 italic text-[10px]" title="Private metric requires token">
                            N/A (Auth Needed)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">ER Rate: <strong className="text-violet-400">{er > 0 ? `${er.toFixed(2)}%` : 'N/A'}</strong></span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-violet-400 hover:underline"
                  >
                    Open Instagram ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
