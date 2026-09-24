import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCampaignDetail } from '../api/campaignApi';
import type { CampaignDetail } from '../api/campaignApi';
import { CampaignAccountIdentity } from '../components/CampaignAccountIdentity';

export const CampaignDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('token') || '';
  const navigate = useNavigate();

  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchDetail(id);
    }
  }, [id]);

  const fetchDetail = async (campaignId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCampaignDetail(campaignId, token);
      setDetail(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load campaign detail');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="inline-block w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Loading campaign analytical details...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-4">
        <button
          onClick={() => navigate('/app/campaigns')}
          className="text-xs font-semibold text-violet-400 hover:underline"
        >
          ← Back to All Campaigns
        </button>
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error || 'Campaign not found.'}
        </div>
      </div>
    );
  }

  const { campaign, contents, metrics, aiInsights } = detail;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb Nav */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <Link to="/app/campaigns" className="hover:text-white font-semibold transition-colors">
          ← Back to Campaigns
        </Link>
        <span>Campaign ID: {campaign.id}</span>
      </div>

      {/* Main Campaign Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-violet-950/60 to-slate-900 border border-slate-800 p-6 lg:p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-600/30 text-violet-300 border border-violet-500/30">
                {campaign.status}
              </span>
              {campaign.brand && <span className="text-xs text-slate-400 font-semibold">• {campaign.brand}</span>}
              {campaign.category && <span className="text-xs text-slate-400 font-semibold">• {campaign.category}</span>}
            </div>

            <CampaignAccountIdentity
              account={campaign.instagramAccount}
              username={campaign.brand?.toLowerCase().replace(/\s+/g, '_')}
              displayName={campaign.brand || campaign.name}
              variant="header"
              dark={true}
            />

            <h1 className="text-3xl font-extrabold text-white">{campaign.name}</h1>
            <p className="text-xs text-slate-400">Objective: {campaign.objective}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[120px]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Overall AI Score</span>
              <span className="text-xl font-extrabold text-emerald-400 mt-0.5 block">
                {aiInsights?.overallScore || 85}/100
              </span>
            </div>
          </div>
        </div>

        {/* Overview Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Reach</span>
            <span className="text-lg font-extrabold text-white mt-1 block">
              {campaign.totalReach?.toLocaleString() || 0}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Impressions</span>
            <span className="text-lg font-extrabold text-white mt-1 block">
              {campaign.totalImpressions?.toLocaleString() || 0}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Engagement Rate</span>
            <span className="text-lg font-extrabold text-violet-400 mt-1 block">
              {campaign.engagementRate != null ? `${campaign.engagementRate.toFixed(2)}%` : '0%'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Spend</span>
            <span className="text-lg font-extrabold text-emerald-400 mt-1 block">
              ${campaign.totalSpend || 0}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Link Clicks</span>
            <span className="text-lg font-extrabold text-white mt-1 block">
              {campaign.totalLinkClicks?.toLocaleString() || 0}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">ROAS Return</span>
            <span className="text-lg font-extrabold text-fuchsia-400 mt-1 block">
              {campaign.roas != null ? `${campaign.roas.toFixed(2)}x` : '0x'}
            </span>
          </div>
        </div>
      </div>

      {/* AI Campaign Insights Card */}
      {aiInsights && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🤖</span> AI Campaign Insights & Performance Highlights
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
              <h3 className="font-bold text-emerald-400 uppercase text-[11px]">What Performed Well</h3>
              <ul className="space-y-2 text-slate-300">
                {aiInsights.whatPerformedWell.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <h3 className="font-bold text-amber-400 uppercase text-[11px]">Recommended Improvements</h3>
              <ul className="space-y-2 text-slate-300">
                {aiInsights.recommendedImprovements.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">💡</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Content Used in Campaign */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📲</span> Content Used in Campaign ({contents.length})
          </h2>
          <Link to="/app/links" className="text-xs font-semibold text-violet-400 hover:underline">
            + Add / Link Instagram URL
          </Link>
        </div>

        {contents.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No content items linked to this campaign yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contents.map((item) => (
              <div key={item.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-600 text-white">
                    {item.mediaType}
                  </span>
                  <a
                    href={item.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-violet-400 hover:underline"
                  >
                    View Post ↗
                  </a>
                </div>

                <p className="text-slate-300 line-clamp-2">{item.caption || 'No caption'}</p>

                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] pt-1">
                  <div className="p-1.5 rounded bg-slate-900">
                    <span className="text-slate-400 block font-semibold">Likes</span>
                    <span className="font-bold text-slate-100">{item.likes.toLocaleString()}</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900">
                    <span className="text-slate-400 block font-semibold">Comments</span>
                    <span className="font-bold text-slate-100">{item.comments.toLocaleString()}</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900">
                    <span className="text-slate-400 block font-semibold">Reach</span>
                    <span className="font-bold text-emerald-400">{item.reach.toLocaleString()}</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900">
                    <span className="text-slate-400 block font-semibold">ER %</span>
                    <span className="font-bold text-violet-400">
                      {item.engagementRate != null ? `${item.engagementRate.toFixed(2)}%` : '0%'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Performance Timeline Table */}
      {metrics && metrics.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📈</span> Daily Performance & Metric History
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950">
                  <th className="p-3 font-bold text-slate-400">Date</th>
                  <th className="p-3 font-bold text-slate-400">Reach</th>
                  <th className="p-3 font-bold text-slate-400">Impressions</th>
                  <th className="p-3 font-bold text-slate-400">Likes</th>
                  <th className="p-3 font-bold text-slate-400">Comments</th>
                  <th className="p-3 font-bold text-slate-400">Clicks</th>
                  <th className="p-3 font-bold text-slate-400">Spend</th>
                  <th className="p-3 font-bold text-slate-400">ER %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {metrics.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-850">
                    <td className="p-3 font-semibold text-slate-200">{m.date}</td>
                    <td className="p-3 text-emerald-400 font-bold">{m.reach?.toLocaleString()}</td>
                    <td className="p-3 font-medium">{m.impressions?.toLocaleString()}</td>
                    <td className="p-3 font-medium">{m.likes?.toLocaleString()}</td>
                    <td className="p-3 font-medium">{m.comments?.toLocaleString()}</td>
                    <td className="p-3 font-medium">{m.linkClicks?.toLocaleString()}</td>
                    <td className="p-3 font-semibold text-slate-100">${m.spend}</td>
                    <td className="p-3 font-bold text-violet-400">{m.engagementRate?.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
