import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCampaigns, updateCampaign } from '../api/campaignApi';
import type { Campaign } from '../api/campaignApi';
import { CampaignMediaViewer } from '../components/CampaignMediaViewer';

export const LiveCampaignsPage: React.FC = () => {
  const token = localStorage.getItem('token') || '';
  const navigate = useNavigate();
  const [liveCampaigns, setLiveCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLiveCampaigns();
    const interval = setInterval(() => {
      fetchLiveCampaigns();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCampaigns(token);
      // Filter for ACTIVE status campaigns
      const active = data.filter((c) => c.status === 'ACTIVE');
      setLiveCampaigns(active);
    } catch (err: any) {
      setError(err.message || 'Failed to load live campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseCampaign = async (id: string) => {
    try {
      await updateCampaign(id, { status: 'PAUSED' }, token);
      fetchLiveCampaigns();
    } catch (err: any) {
      alert(err.message || 'Failed to pause campaign');
    }
  };

  const filtered = liveCampaigns.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.brand && c.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.objective && c.objective.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalLiveSpend = liveCampaigns.reduce((acc, c) => acc + (c.totalSpend || 0), 0);
  const totalLiveReach = liveCampaigns.reduce((acc, c) => acc + (c.totalReach || 0), 0);
  const totalLiveImpressions = liveCampaigns.reduce((acc, c) => acc + (c.totalImpressions || 0), 0);
  const avgLiveER =
    liveCampaigns.length > 0
      ? (liveCampaigns.reduce((acc, c) => acc + (c.engagementRate || 0), 0) / liveCampaigns.length).toFixed(2)
      : '0.00';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <h1 className="text-2xl font-extrabold text-white">Live Active Campaigns</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time monitoring of all currently active Instagram campaigns with automatic status evaluation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLiveCampaigns}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <span>🔄</span> Refresh Live Metrics
          </button>
          <Link
            to="/app/campaigns"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 transition-all"
          >
            View All Campaigns
          </Link>
        </div>
      </div>

      {/* Aggregate Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <span className="text-xs text-slate-400 font-semibold block uppercase">Active Campaigns</span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
            {liveCampaigns.length}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <span className="text-xs text-slate-400 font-semibold block uppercase">Total Live Reach</span>
          <span className="text-2xl font-extrabold text-white mt-1 block">
            {totalLiveReach.toLocaleString()}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <span className="text-xs text-slate-400 font-semibold block uppercase">Total Impressions</span>
          <span className="text-2xl font-extrabold text-white mt-1 block">
            {totalLiveImpressions.toLocaleString()}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <span className="text-xs text-slate-400 font-semibold block uppercase">Total Live Spend</span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
            ${totalLiveSpend.toLocaleString()}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl col-span-2 lg:col-span-1">
          <span className="text-xs text-slate-400 font-semibold block uppercase">Avg Live ER</span>
          <span className="text-2xl font-extrabold text-indigo-400 mt-1 block">
            {avgLiveER}%
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <input
          type="text"
          placeholder="Filter live campaigns by name, brand, or objective..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-violet-500 focus:outline-none"
        />
        <div className="text-xs text-slate-400">
          Showing <span className="font-bold text-white">{filtered.length}</span> active campaigns
        </div>
      </div>

      {/* Live Campaign Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800">
          <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">Fetching live campaign metrics...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80 space-y-3">
          <span className="text-4xl">🟢</span>
          <h3 className="text-base font-bold text-white">No active live campaigns</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'No active campaign matches your filter.'
              : 'There are currently no campaigns marked as ACTIVE. Create a campaign or launch a scheduled campaign to monitor it live.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-6 shadow-xl transition-all flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE CAMPAIGN
                  </span>
                  <div className="text-right text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Budget Spend</span>
                    <span className="text-sm font-bold text-emerald-400">
                      ${campaign.totalSpend?.toLocaleString() || '0'} / ${campaign.budget?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>

                {/* Instagram Post / Reel Thumbnail Media Viewer */}
                <CampaignMediaViewer
                  campaign={campaign}
                  variant="card"
                  dark={true}
                  showAccountIdentityBelow={true}
                />

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ACTIVE LIVE
                      </span>
                      {campaign.brand && (
                        <span className="text-xs font-semibold text-slate-400">• {campaign.brand}</span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-white mt-1">{campaign.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{campaign.objective}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Reach</span>
                    <span className="text-sm font-extrabold text-white mt-0.5 block">
                      {campaign.totalReach?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Impressions</span>
                    <span className="text-sm font-extrabold text-white mt-0.5 block">
                      {campaign.totalImpressions?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Engagement</span>
                    <span className="text-sm font-extrabold text-fuchsia-400 mt-0.5 block">
                      {campaign.totalEngagements?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Link Clicks</span>
                    <span className="text-sm font-extrabold text-sky-400 mt-0.5 block">
                      {campaign.totalLinkClicks?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Live Spend</span>
                    <span className="text-sm font-extrabold text-emerald-400 mt-0.5 block">
                      ${campaign.totalSpend?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">ER %</span>
                    <span className="text-sm font-extrabold text-violet-400 mt-0.5 block">
                      {campaign.engagementRate != null ? `${campaign.engagementRate.toFixed(2)}%` : '0.00%'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 gap-2">
                  <span>📅 <strong>Start:</strong> {campaign.startDate || 'N/A'} | <strong>End:</strong> {campaign.endDate || 'Ongoing'}</span>
                  <span>🔗 {campaign.contentCount || 0} Content Items | ROAS: <strong className="text-fuchsia-400">{campaign.roas != null ? `${campaign.roas.toFixed(2)}x` : '0x'}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 gap-3">
                <button
                  onClick={() => handlePauseCampaign(campaign.id)}
                  className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/20 transition-all"
                >
                  ⏸ Pause Campaign
                </button>

                <button
                  onClick={() => navigate(`/app/campaigns/${campaign.id}`)}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 transition-all flex items-center gap-1"
                >
                  View Live Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
