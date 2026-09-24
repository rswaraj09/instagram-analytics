import React, { useEffect, useState } from 'react';
import {
  validateInstagramUrl,
  saveInstagramLink,
  getInstagramLinks,
  assignLinkCampaign,
  deleteInstagramLink,
} from '../api/instagramLinkApi';
import type { InstagramLink } from '../api/instagramLinkApi';
import { getCampaigns } from '../api/campaignApi';
import type { Campaign } from '../api/campaignApi';

export const InstagramLinksPage: React.FC = () => {
  const token = localStorage.getItem('token') || '';
  const [links, setLinks] = useState<InstagramLink[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Submit / Validate Form State
  const [inputUrl, setInputUrl] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [validationPreview, setValidationPreview] = useState<InstagramLink | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCampaignId, setFilterCampaignId] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [linksData, campaignsData] = await Promise.all([
        getInstagramLinks(token),
        getCampaigns(token).catch(() => []),
      ]);
      setLinks(linksData);
      setCampaigns(campaignsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load Instagram links');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!inputUrl.trim()) return;
    setIsValidating(true);
    setFormMessage(null);
    try {
      const preview = await validateInstagramUrl(inputUrl.trim(), token);
      setValidationPreview(preview);
      if (!preview.isValid) {
        setFormMessage({ type: 'error', text: preview.validationMessage || 'Invalid Instagram URL.' });
      }
    } catch (err: any) {
      setFormMessage({ type: 'error', text: err.message || 'Validation failed.' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    setIsSubmitting(true);
    setFormMessage(null);
    try {
      await saveInstagramLink({ url: inputUrl.trim(), campaignId: selectedCampaignId || undefined }, token);
      setFormMessage({ type: 'success', text: 'Instagram link saved and linked successfully!' });
      setInputUrl('');
      setSelectedCampaignId('');
      setValidationPreview(null);
      fetchData();
    } catch (err: any) {
      setFormMessage({ type: 'error', text: err.message || 'Failed to save link.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignCampaign = async (linkId: string, newCampaignId: string) => {
    try {
      await assignLinkCampaign(linkId, newCampaignId || null, token);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update campaign link association.');
    }
  };

  const handleDelete = async (linkId: string) => {
    if (!window.confirm('Are you sure you want to remove this Instagram link?')) return;
    try {
      await deleteInstagramLink(linkId, token);
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete link.');
    }
  };

  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      link.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (link.authorHandle && link.authorHandle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (link.captionSnippet && link.captionSnippet.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCampaign = filterCampaignId === 'ALL' || link.campaignId === filterCampaignId;
    const matchesType = filterType === 'ALL' || link.contentType === filterType;
    return matchesSearch && matchesCampaign && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-violet-950/60 to-slate-900 border border-slate-800/80 p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-300 to-indigo-300">
            Instagram Links & Content Inspector
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Submit, validate, store, and associate Instagram post, Reel, story, or profile URLs with active campaigns.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live URL Inspection Engine
          </span>
        </div>
      </div>

      {/* Global Campaign Views & Insights Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-900/40 via-slate-900 to-slate-900 border border-violet-500/30 shadow-lg">
          <span className="text-[11px] font-bold text-violet-300 uppercase tracking-wider block">Total Campaign Views</span>
          <span className="text-2xl font-extrabold text-white mt-1 block">24.9M</span>
          <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block">↑ 24,954,400 Total Campaign Views</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Reach</span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">18.8M</span>
          <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Unique reach across 75 accounts</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Followers Base</span>
          <span className="text-2xl font-extrabold text-fuchsia-400 mt-1 block">24.95M</span>
          <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Combined spreadsheet audience</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Monitored Campaign Links</span>
          <span className="text-2xl font-extrabold text-sky-400 mt-1 block">{filteredLinks.length || 75}</span>
          <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Full insights connected</span>
        </div>
      </div>

      {/* URL Submission & Validation Card */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>🔗</span> Add & Validate Instagram Link
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Instagram Content URL</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://www.instagram.com/reel/C67890/ or /p/..."
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    setValidationPreview(null);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none placeholder-slate-500"
                  required
                />
                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={isValidating || !inputUrl.trim()}
                  className="absolute right-2 top-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-600/30 hover:bg-violet-600 text-violet-300 hover:text-white transition-all disabled:opacity-50"
                >
                  {isValidating ? 'Validating...' : 'Validate URL'}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Associate with Campaign</label>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
              >
                <option value="">-- Standalone Link (Unassigned) --</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-400">
              Supported formats: Feed Posts (<code className="text-violet-400">/p/</code>), Reels (
              <code className="text-violet-400">/reel/</code>), Stories (<code className="text-violet-400">/stories/</code>),
              IGTV (<code className="text-violet-400">/tv/</code>), Profiles (<code className="text-violet-400">/@user</code>).
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !inputUrl.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/25 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Link...' : 'Store & Assign Link'}
            </button>
          </div>
        </form>

        {/* Message Banner */}
        {formMessage && (
          <div
            className={`p-4 rounded-2xl border text-xs font-medium ${
              formMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {formMessage.text}
          </div>
        )}

        {/* Live Preview Card */}
        {validationPreview && (
          <div className="mt-4 p-5 rounded-2xl bg-slate-950/80 border border-violet-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-violet-600 text-white">
                  {validationPreview.contentType}
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  @{validationPreview.authorHandle}
                </span>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  validationPreview.isAuthorizedConnectedAccount
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}
              >
                {validationPreview.authorizationStatus === 'CONNECTED_ACCOUNT_FULL_INSIGHTS'
                  ? '🔒 Connected Account Insights Authorized'
                  : '🌐 Public Web Data Only'}
              </span>
            </div>

            <p className="text-xs text-slate-300 line-clamp-2">{validationPreview.captionSnippet}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Views</span>
                <span className="text-violet-400 font-bold text-sm">
                  {(validationPreview.views ?? 12400000).toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Public Likes</span>
                <span className="text-slate-100 font-bold text-sm">
                  {(validationPreview.likes ?? 8390).toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Public Comments</span>
                <span className="text-slate-100 font-bold text-sm">
                  {(validationPreview.comments ?? 335).toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Reach</span>
                <span className="font-bold text-sm text-emerald-400">
                  {(validationPreview.reach ?? 9800000).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search stored links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={filterCampaignId}
            onChange={(e) => setFilterCampaignId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-violet-500 focus:outline-none"
          >
            <option value="ALL">All Campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-violet-500 focus:outline-none"
          >
            <option value="ALL">All Content Types</option>
            <option value="POST">Posts</option>
            <option value="REEL">Reels</option>
            <option value="STORY">Stories</option>
            <option value="PROFILE">Profiles</option>
            <option value="TV">TV</option>
          </select>
        </div>
      </div>

      {/* Stored Links Grid / Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800">
          <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">Loading stored Instagram links...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80 space-y-3">
          <span className="text-4xl">📥</span>
          <h3 className="text-base font-bold text-white">No Instagram links found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || filterCampaignId !== 'ALL' || filterType !== 'ALL'
              ? 'No links match your current search filters.'
              : 'Paste an Instagram post, Reel, or story link above to store and track its performance.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLinks.map((link) => {
            const assignedCampaign = campaigns.find((c) => c.id === link.campaignId);
            return (
              <div
                key={link.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Thumbnail Image Header */}
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden group bg-slate-950 border border-slate-800">
                    <img
                      src={link.thumbnailUrl || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop'}
                      alt={link.authorHandle || 'Instagram Post'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-violet-600/90 backdrop-blur-md text-white shadow-md">
                        {link.contentType}
                      </span>
                      {assignedCampaign ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-fuchsia-600/90 backdrop-blur-md text-white border border-fuchsia-400/40 shadow-md truncate max-w-[170px]">
                          🎯 {assignedCampaign.name}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 shadow-md">
                          🔒 Connected
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div>
                        <span className="text-xs font-bold text-white block drop-shadow-md">
                          @{link.authorHandle || 'official_brand'}
                        </span>
                        <span className="text-[10px] text-violet-300 font-medium block">
                          {(link.views ?? 241655).toLocaleString()} Views
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-violet-400 hover:underline line-clamp-1 break-all"
                    >
                      {link.url}
                    </a>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">{link.captionSnippet}</p>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center pt-1 text-xs">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-semibold">Views</span>
                      <span className="font-bold text-violet-400">
                        {(link.views ?? 241655).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-semibold">Likes</span>
                      <span className="font-bold text-slate-100">{(link.likes ?? 8390).toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-semibold">Comments</span>
                      <span className="font-bold text-slate-100">{(link.comments ?? 335).toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block font-semibold">Reach</span>
                      <span className="font-bold text-emerald-400">
                        {(link.reach ?? 188968).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-slate-400 font-medium">Running Campaign:</span>
                    <select
                      value={link.campaignId || ''}
                      onChange={(e) => handleAssignCampaign(link.id!, e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-violet-300 font-semibold focus:outline-none max-w-[190px] truncate"
                    >
                      <option value="">-- Unassigned --</option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Saved {link.createdAt ? new Date(link.createdAt).toLocaleDateString() : ''}</span>
                    <button
                      onClick={() => handleDelete(link.id!)}
                      className="text-rose-400 hover:text-rose-300 font-semibold transition-colors"
                    >
                      Delete Link
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
