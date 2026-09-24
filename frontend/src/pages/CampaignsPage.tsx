import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, Filler, Tooltip, Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import {
  getCampaigns, getCampaignDetail, createCampaign, deleteCampaign,
  addCampaignContent, deleteCampaignContent, addCampaignInfluencer, deleteCampaignInfluencer,
  addCampaignGoal, deleteCampaignGoal, compareCampaigns,
  type Campaign, type CampaignDetail, type CampaignComparison
} from '../api/campaignApi';
import { CampaignAccountIdentity } from '../components/CampaignAccountIdentity';
import { CampaignMediaViewer } from '../components/CampaignMediaViewer';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend);

type SubTab = 'overview' | 'performance' | 'content' | 'influencers' | 'audience' | 'goals' | 'insights' | 'reports';

const fmt = (n?: number | null) => (n == null ? '0' : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : n.toLocaleString());
const currency = (n?: number | null) => (n == null ? '$0' : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const pct = (n?: number | null) => (n == null ? '0%' : `${n.toFixed(2)}%`);

export const CampaignsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SubTab>('overview');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & period
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showContentModal, setShowContentModal] = useState<boolean>(false);
  const [showInfluencerModal, setShowInfluencerModal] = useState<boolean>(false);
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);

  // Form states
  const [newCampaign, setNewCampaign] = useState({ name: '', objective: 'Brand Awareness', brand: '', category: '', budget: 1000, startDate: '', endDate: '' });
  const [newContent, setNewContent] = useState({ mediaType: 'REEL' as 'POST' | 'REEL' | 'STORY', caption: '', reach: 5000, impressions: 7000, likes: 350, comments: 25, shares: 40, saves: 50, views: 6000, linkClicks: 120, conversions: 15 });
  const [newInfluencer, setNewInfluencer] = useState({ influencerName: '', handle: '', followers: 25000, reach: 15000, engagements: 1200, contentCount: 1, cost: 300, conversions: 20, notes: '' });
  const [newGoal, setNewGoal] = useState({ metricType: 'REACH', targetValue: 50000, currentValue: 12000 });

  // Comparison state
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<CampaignComparison | null>(null);
  const [comparing, setComparing] = useState<boolean>(false);

  const token = localStorage.getItem('token') || '';

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCampaigns(token);
      setCampaigns(data);
      if (data.length > 0 && !selectedCampaignId) {
        setSelectedCampaignId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [token, selectedCampaignId]);

  const loadDetail = useCallback(async (id: string) => {
    try {
      const res = await getCampaignDetail(id, token);
      setDetail(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load campaign details');
    }
  }, [token]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    if (selectedCampaignId) {
      loadDetail(selectedCampaignId);
    }
  }, [selectedCampaignId, loadDetail]);

  // Handlers
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name.trim()) return;
    try {
      const created = await createCampaign(newCampaign, token);
      setShowCreateModal(false);
      setNewCampaign({ name: '', objective: 'Brand Awareness', brand: '', category: '', budget: 1000, startDate: '', endDate: '' });
      await loadCampaigns();
      setSelectedCampaignId(created.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await deleteCampaign(id, token);
      setSelectedCampaignId(null);
      await loadCampaigns();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignId) return;
    try {
      await addCampaignContent(selectedCampaignId, newContent, token);
      setShowContentModal(false);
      loadDetail(selectedCampaignId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!selectedCampaignId) return;
    try {
      await deleteCampaignContent(selectedCampaignId, contentId, token);
      loadDetail(selectedCampaignId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignId) return;
    try {
      await addCampaignInfluencer(selectedCampaignId, newInfluencer, token);
      setShowInfluencerModal(false);
      loadDetail(selectedCampaignId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteInfluencer = async (infId: string) => {
    if (!selectedCampaignId) return;
    try {
      await deleteCampaignInfluencer(selectedCampaignId, infId, token);
      loadDetail(selectedCampaignId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignId) return;
    try {
      await addCampaignGoal(selectedCampaignId, newGoal, token);
      setShowGoalModal(false);
      loadDetail(selectedCampaignId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!selectedCampaignId) return;
    try {
      await deleteCampaignGoal(selectedCampaignId, goalId, token);
      loadDetail(selectedCampaignId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRunComparison = async () => {
    if (compareIds.length < 2) {
      alert('Please select at least 2 campaigns to compare.');
      return;
    }
    setComparing(true);
    try {
      const res = await compareCampaigns(compareIds, token);
      setComparisonResult(res);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setComparing(false);
    }
  };

  // Trend Chart Data
  const metricsData = detail?.metrics || [];
  const chartLabels = metricsData.map(m => m.date);
  const chartReach = metricsData.map(m => m.reach);
  const chartEngagements = metricsData.map(m => m.likes + m.comments + m.shares + m.saves);
  const chartSpend = metricsData.map(m => m.spend);

  const lineChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Reach',
        data: chartReach,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Engagements',
        data: chartEngagements,
        borderColor: '#ec4899',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const barChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Spend ($)',
        data: chartSpend,
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
    ],
  };

  const currentCamp = detail?.campaign || campaigns.find(c => c.id === selectedCampaignId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <span>🎯</span> Instagram Campaign Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage multi-channel campaigns, track real-time ROAS/CPM, measure influencer impact, and optimize with AI insights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Campaign dropdown selector */}
          <select
            value={selectedCampaignId || ''}
            onChange={e => setSelectedCampaignId(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.status})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCompareModal(true)}
            className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm rounded-xl transition-all border border-indigo-200 flex items-center gap-2"
          >
            📊 Compare Campaigns
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-indigo-200 flex items-center gap-2"
          >
            <span>+</span> New Campaign
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Campaign Sub-Tabs */}
      <div className="bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm flex flex-wrap gap-1">
        {[
          { id: 'overview', label: 'Campaign Overview', icon: '📋' },
          { id: 'performance', label: 'Performance', icon: '📈' },
          { id: 'content', label: 'Content', icon: '🎬' },
          { id: 'influencers', label: 'Influencers', icon: '🌟' },
          { id: 'audience', label: 'Audience', icon: '👥' },
          { id: 'goals', label: 'Goals', icon: '🎯' },
          { id: 'insights', label: 'AI Insights', icon: '🤖' },
          { id: 'reports', label: 'Reports', icon: '📄' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as SubTab)}
            className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === t.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-500 font-medium">Loading Instagram Campaigns...</div>
      )}

      {!loading && campaigns.length === 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm space-y-4">
          <div className="text-5xl">🚀</div>
          <h3 className="text-xl font-bold text-gray-900">No Instagram Campaigns Created Yet</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Set up your first campaign to track budget spend, impressions, engagement rates, and ROI across posts, reels, and stories.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all inline-block"
          >
            Create Your First Campaign
          </button>
        </div>
      )}

      {!loading && currentCamp && (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Campaign summary hero header */}
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 items-center">
                  <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${currentCamp.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                          currentCamp.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                            'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                        {currentCamp.status}
                      </span>
                      <span className="text-indigo-200 text-xs font-semibold">{currentCamp.objective}</span>
                      {currentCamp.brand && <span className="text-indigo-200 text-xs">• {currentCamp.brand}</span>}
                    </div>
                    <h2 className="text-3xl font-extrabold">{currentCamp.name}</h2>
                    <p className="text-xs text-indigo-200">
                      Timeline: {currentCamp.startDate || 'N/A'} to {currentCamp.endDate || 'N/A'}
                    </p>

                    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 mt-4 max-w-md">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-indigo-200">Budget Spent</p>
                        <p className="text-xl font-black text-white">{currency(currentCamp.totalSpend)} / {currency(currentCamp.budget)}</p>
                        <div className="w-36 bg-white/20 h-2 rounded-full mt-2 overflow-hidden">
                          <div
                            className="bg-emerald-400 h-full rounded-full"
                            style={{ width: `${Math.min(100, ((currentCamp.totalSpend || 0) / (currentCamp.budget || 1)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCampaign(currentCamp.id)}
                        className="p-2.5 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-xl transition-colors text-xs font-semibold ml-auto"
                        title="Delete Campaign"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Hero Instagram Post / Reel Thumbnail Viewer */}
                  <div className="lg:col-span-1">
                    <CampaignMediaViewer
                      campaign={currentCamp}
                      contents={detail?.contents}
                      variant="card"
                      dark={true}
                      showAccountIdentityBelow={true}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Total Reach</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">{fmt(currentCamp.totalReach)}</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">📡 Unique Accounts</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Impressions</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">{fmt(currentCamp.totalImpressions)}</p>
                  <p className="text-xs text-indigo-600 font-semibold mt-1">👁️ Content Views</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Engagement Rate</p>
                  <p className="text-2xl font-black text-indigo-600 mt-1">{pct(currentCamp.engagementRate)}</p>
                  <p className="text-xs text-indigo-500 font-semibold mt-1">🔥 Total: {fmt(currentCamp.totalEngagements)}</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase">ROAS</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{(currentCamp.roas || 0).toFixed(2)}x</p>
                  <p className="text-xs text-emerald-500 font-semibold mt-1">💰 Revenue: {currency(currentCamp.revenue)}</p>
                </div>
              </div>

              {/* Campaign list grid */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">All Campaigns Overview</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Account</th>
                        <th className="py-3 px-4">Campaign</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Budget</th>
                        <th className="py-3 px-4">Reach</th>
                        <th className="py-3 px-4">Engagement Rate</th>
                        <th className="py-3 px-4">ROAS</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm font-medium">
                      {campaigns.map(c => (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedCampaignId(c.id)}
                          className={`cursor-pointer hover:bg-indigo-50/50 transition-colors ${c.id === selectedCampaignId ? 'bg-indigo-50/80 font-bold' : ''
                            }`}
                        >
                          <td className="py-3 px-4">
                            <CampaignAccountIdentity 
                              account={c.instagramAccount} 
                              username={c.brand?.toLowerCase().replace(/\s+/g, '_')}
                              displayName={c.brand || c.name}
                              variant="badge"
                            />
                          </td>
                          <td className="py-3 px-4 text-gray-900">{c.name}</td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-700">{currency(c.budget)}</td>
                          <td className="py-3 px-4 text-gray-700">{fmt(c.totalReach)}</td>
                          <td className="py-3 px-4 text-indigo-600 font-bold">{pct(c.engagementRate)}</td>
                          <td className="py-3 px-4 text-emerald-600 font-bold">{(c.roas || 0).toFixed(2)}x</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedCampaignId(c.id); setActiveTab('performance'); }}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                            >
                              View Stats →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERFORMANCE */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Full Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Total Reach</p>
                  <p className="text-xl font-black text-gray-900 mt-1">{fmt(currentCamp.totalReach)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Impressions</p>
                  <p className="text-xl font-black text-gray-900 mt-1">{fmt(currentCamp.totalImpressions)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Engagements</p>
                  <p className="text-xl font-black text-indigo-600 mt-1">{fmt(currentCamp.totalEngagements)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Engagement Rate</p>
                  <p className="text-xl font-black text-purple-600 mt-1">{pct(currentCamp.engagementRate)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Likes</p>
                  <p className="text-xl font-black text-rose-600 mt-1">{fmt(currentCamp.totalLikes)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Comments</p>
                  <p className="text-xl font-black text-blue-600 mt-1">{fmt(currentCamp.totalComments)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Shares</p>
                  <p className="text-xl font-black text-emerald-600 mt-1">{fmt(currentCamp.totalShares)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Saves</p>
                  <p className="text-xl font-black text-amber-600 mt-1">{fmt(currentCamp.totalSaves)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Video Views</p>
                  <p className="text-xl font-black text-indigo-600 mt-1">{fmt(currentCamp.totalVideoViews)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Profile Visits</p>
                  <p className="text-xl font-black text-gray-900 mt-1">{fmt(currentCamp.totalProfileVisits)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Follower Growth</p>
                  <p className="text-xl font-black text-emerald-600 mt-1">+{fmt(currentCamp.totalFollowerGrowth)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Link Clicks</p>
                  <p className="text-xl font-black text-indigo-600 mt-1">{fmt(currentCamp.totalLinkClicks)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Conversion Rate</p>
                  <p className="text-xl font-black text-emerald-600 mt-1">{pct(currentCamp.conversionRate)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400">CPE (Cost/Eng)</p>
                  <p className="text-xl font-black text-gray-900 mt-1">{currency(currentCamp.cpe)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400">CPC (Cost/Click)</p>
                  <p className="text-xl font-black text-gray-900 mt-1">{currency(currentCamp.cpc)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400">CPM (Cost/1k)</p>
                  <p className="text-xl font-black text-gray-900 mt-1">{currency(currentCamp.cpm)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400">ROAS</p>
                  <p className="text-xl font-black text-emerald-600 mt-1">{(currentCamp.roas || 0).toFixed(2)}x</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400">CTR</p>
                  <p className="text-xl font-black text-purple-600 mt-1">{pct(currentCamp.ctr)}</p>
                </div>
              </div>

              {/* Trend Graphs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Reach & Engagement Trend</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPeriod('daily')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${period === 'daily' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                      >
                        Daily
                      </button>
                      <button
                        onClick={() => setPeriod('weekly')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${period === 'weekly' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                      >
                        Weekly
                      </button>
                    </div>
                  </div>
                  <div className="h-64">
                    <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Daily Budget Spend</h3>
                  <div className="h-64">
                    <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTENT */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Campaign Content Performance</h3>
                  <p className="text-xs text-gray-500">Track reach, impressions, views, link clicks and conversions by post/reel.</p>
                </div>
                <button
                  onClick={() => setShowContentModal(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  + Add Content Item
                </button>
              </div>

              {/* Content items grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(detail?.contents || []).map(c => (
                  <div key={c.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="p-4 bg-gray-50 flex items-center justify-between border-b border-gray-100">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                        {c.mediaType}
                      </span>
                      <button
                        onClick={() => c.id && handleDeleteContent(c.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-bold"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="p-5 space-y-4">
                      <p className="text-xs text-gray-700 font-medium line-clamp-2">{c.caption || 'No caption'}</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-indigo-50 p-2 rounded-xl">
                          <p className="text-[10px] text-indigo-400 font-bold uppercase">Reach</p>
                          <p className="text-sm font-black text-indigo-700">{fmt(c.reach)}</p>
                        </div>
                        <div className="bg-rose-50 p-2 rounded-xl">
                          <p className="text-[10px] text-rose-400 font-bold uppercase">Likes</p>
                          <p className="text-sm font-black text-rose-700">{fmt(c.likes)}</p>
                        </div>
                        <div className="bg-purple-50 p-2 rounded-xl">
                          <p className="text-[10px] text-purple-400 font-bold uppercase">ER</p>
                          <p className="text-sm font-black text-purple-700">{pct(c.engagementRate)}</p>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
                        <span>Clicks: {c.linkClicks}</span>
                        <span>Conversions: {c.conversions}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: INFLUENCERS */}
          {activeTab === 'influencers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Influencer Collaborations & ROI</h3>
                  <p className="text-xs text-gray-500">Rank creator performance by ER, Cost-Per-Engagement (CPE), and conversions.</p>
                </div>
                <button
                  onClick={() => setShowInfluencerModal(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  + Add Influencer
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase">
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Influencer</th>
                      <th className="py-3 px-4">Followers</th>
                      <th className="py-3 px-4">Reach</th>
                      <th className="py-3 px-4">ER</th>
                      <th className="py-3 px-4">Cost</th>
                      <th className="py-3 px-4">CPE</th>
                      <th className="py-3 px-4">ROI</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm font-medium">
                    {(detail?.influencers || []).map((inf, idx) => (
                      <tr key={inf.id || idx} className="hover:bg-gray-50/80">
                        <td className="py-3 px-4 font-bold text-indigo-600">#{inf.rank || idx + 1}</td>
                        <td className="py-3 px-4 text-gray-900 font-bold">{inf.influencerName} <span className="text-xs text-gray-400 font-normal">@{inf.handle}</span></td>
                        <td className="py-3 px-4 text-gray-700">{fmt(inf.followers)}</td>
                        <td className="py-3 px-4 text-gray-700">{fmt(inf.reach)}</td>
                        <td className="py-3 px-4 text-purple-600 font-bold">{pct(inf.engagementRate)}</td>
                        <td className="py-3 px-4 text-gray-700">{currency(inf.cost)}</td>
                        <td className="py-3 px-4 text-gray-700">{currency(inf.cpe)}</td>
                        <td className="py-3 px-4 text-emerald-600 font-bold">{(inf.roi || 0).toFixed(2)}x</td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => inf.id && handleDeleteInfluencer(inf.id)} className="text-xs text-red-500 hover:text-red-700 font-bold">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIENCE */}
          {activeTab === 'audience' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Campaign Audience Breakdown</h3>
                <p className="text-xs text-gray-500">Demographic splits, age distributions, and follower vs non-follower reach.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <h4 className="font-bold text-gray-900">Age Groups</h4>
                  {Object.entries(detail?.audience?.ageGroups || {}).map(([age, p]) => (
                    <div key={age}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>{age}</span>
                        <span className="text-indigo-600 font-bold">{p}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${p}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <h4 className="font-bold text-gray-900">Gender Distribution</h4>
                  {Object.entries(detail?.audience?.genderDistribution || {}).map(([g, p]) => (
                    <div key={g}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>{g}</span>
                        <span className="text-purple-600 font-bold">{p}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-purple-600 h-full rounded-full" style={{ width: `${p}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: GOALS */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Campaign Target Goals</h3>
                  <p className="text-xs text-gray-500">Set key performance targets and track real-time completion progress.</p>
                </div>
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  + Add Goal
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(detail?.goals || []).map(g => (
                  <div key={g.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{g.metricType}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${g.isOnTrack ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {g.isOnTrack ? 'On Track' : 'Needs Push'}
                      </span>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-gray-900">{fmt(g.currentValue)} / {fmt(g.targetValue)}</p>
                      <p className="text-xs text-gray-500 mt-1">{pct(g.progressPercentage)} Target Achieved</p>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, g.progressPercentage || 0)}%` }}></div>
                    </div>
                    <div className="text-right">
                      <button onClick={() => g.id && handleDeleteGoal(g.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: AI INSIGHTS */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-6 rounded-3xl shadow-lg flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-extrabold flex items-center gap-2">🤖 AI Campaign Optimization Engine</h3>
                  <p className="text-xs text-violet-100 mt-1">Real-time performance diagnostic & action recommendations derived from database metrics.</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl text-center">
                  <p className="text-[10px] uppercase font-bold text-violet-200">Overall Campaign Score</p>
                  <p className="text-3xl font-black text-white">{detail?.aiInsights?.overallScore || 85} / 100</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                  <h4 className="font-bold text-emerald-700 flex items-center gap-2">🟢 What Performed Well</h4>
                  <ul className="space-y-2 text-xs text-gray-700">
                    {(detail?.aiInsights?.whatPerformedWell || []).map((w, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                  <h4 className="font-bold text-rose-700 flex items-center gap-2">🔴 Areas Needing Improvement</h4>
                  <ul className="space-y-2 text-xs text-gray-700">
                    {(detail?.aiInsights?.whatPerformedPoorly || []).map((w, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                <h4 className="font-bold text-indigo-900 flex items-center gap-2">🚀 Recommended Next Action Strategy</h4>
                <p className="text-sm text-gray-700 leading-relaxed font-medium">
                  {detail?.aiInsights?.suggestedStrategy || 'Focus budget allocation on top performing Reels and expand micro-influencer partnerships.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 8: REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Campaign Summary Report</h3>
                    <p className="text-xs text-gray-500">Executive report ready for export and presentation.</p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    🖨️ Print / Download Report PDF
                  </button>
                </div>

                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                  <h4 className="font-extrabold text-gray-900 text-lg">{currentCamp.name} Report</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div><span className="text-gray-400">Objective:</span> <strong className="block text-gray-800">{currentCamp.objective}</strong></div>
                    <div><span className="text-gray-400">Total Spend:</span> <strong className="block text-gray-800">{currency(currentCamp.totalSpend)}</strong></div>
                    <div><span className="text-gray-400">Total Reach:</span> <strong className="block text-gray-800">{fmt(currentCamp.totalReach)}</strong></div>
                    <div><span className="text-gray-400">ROAS:</span> <strong className="block text-emerald-600">{(currentCamp.roas || 0).toFixed(2)}x</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* CREATE CAMPAIGN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <h3 className="text-xl font-extrabold text-gray-900">Create New Instagram Campaign</h3>
            <form onSubmit={handleCreateCampaign} className="space-y-4 text-sm">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={newCampaign.name}
                  onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="e.g. Summer Festival Promo 2026"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Objective</label>
                  <select
                    value={newCampaign.objective}
                    onChange={e => setNewCampaign({ ...newCampaign, objective: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200"
                  >
                    <option value="Brand Awareness">Brand Awareness</option>
                    <option value="Reach">Reach</option>
                    <option value="Conversions">Conversions</option>
                    <option value="Lead Generation">Lead Generation</option>
                    <option value="Product Launch">Product Launch</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Budget ($)</label>
                  <input
                    type="number"
                    value={newCampaign.budget}
                    onChange={e => setNewCampaign({ ...newCampaign, budget: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CONTENT MODAL */}
      {showContentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <h3 className="text-xl font-extrabold text-gray-900">Add Campaign Content Item</h3>
            <form onSubmit={handleAddContent} className="space-y-4 text-sm">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Media Type</label>
                <select
                  value={newContent.mediaType}
                  onChange={e => setNewContent({ ...newContent, mediaType: e.target.value as 'POST' | 'REEL' | 'STORY' })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200"
                >
                  <option value="REEL">Reel</option>
                  <option value="POST">Post</option>
                  <option value="STORY">Story</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Caption</label>
                <input
                  type="text"
                  value={newContent.caption}
                  onChange={e => setNewContent({ ...newContent, caption: e.target.value })}
                  placeholder="e.g. Check out our new summer lineup!"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Reach</label>
                  <input
                    type="number"
                    value={newContent.reach}
                    onChange={e => setNewContent({ ...newContent, reach: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Likes</label>
                  <input
                    type="number"
                    value={newContent.likes}
                    onChange={e => setNewContent({ ...newContent, likes: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowContentModal(false)} className="px-5 py-2.5 text-gray-600 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md">
                  Add Content
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD INFLUENCER MODAL */}
      {showInfluencerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <h3 className="text-xl font-extrabold text-gray-900">Add Influencer Collaboration</h3>
            <form onSubmit={handleAddInfluencer} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Creator Name *</label>
                  <input
                    type="text"
                    required
                    value={newInfluencer.influencerName}
                    onChange={e => setNewInfluencer({ ...newInfluencer, influencerName: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Instagram Handle *</label>
                  <input
                    type="text"
                    required
                    value={newInfluencer.handle}
                    onChange={e => setNewInfluencer({ ...newInfluencer, handle: e.target.value })}
                    placeholder="e.g. alexmorgan"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Followers</label>
                  <input
                    type="number"
                    value={newInfluencer.followers}
                    onChange={e => setNewInfluencer({ ...newInfluencer, followers: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Collaboration Cost ($)</label>
                  <input
                    type="number"
                    value={newInfluencer.cost}
                    onChange={e => setNewInfluencer({ ...newInfluencer, cost: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowInfluencerModal(false)} className="px-5 py-2.5 text-gray-600 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md">
                  Add Influencer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD GOAL MODAL */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <h3 className="text-xl font-extrabold text-gray-900">Set Campaign Goal</h3>
            <form onSubmit={handleAddGoal} className="space-y-4 text-sm">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Target Metric</label>
                <select
                  value={newGoal.metricType}
                  onChange={e => setNewGoal({ ...newGoal, metricType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200"
                >
                  <option value="REACH">Reach Target</option>
                  <option value="IMPRESSIONS">Impressions Target</option>
                  <option value="ENGAGEMENTS">Engagements Target</option>
                  <option value="CONVERSIONS">Conversions Target</option>
                  <option value="REVENUE">Revenue Target ($)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Target Value</label>
                  <input
                    type="number"
                    value={newGoal.targetValue}
                    onChange={e => setNewGoal({ ...newGoal, targetValue: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Current Progress</label>
                  <input
                    type="number"
                    value={newGoal.currentValue}
                    onChange={e => setNewGoal({ ...newGoal, currentValue: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowGoalModal(false)} className="px-5 py-2.5 text-gray-600 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md">
                  Set Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPARE CAMPAIGNS MODAL */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-extrabold text-gray-900">Compare Instagram Campaigns</h3>
            <p className="text-xs text-gray-500">Select 2 or more campaigns to benchmark KPIs side-by-side.</p>
            <div className="space-y-2">
              {campaigns.map(c => (
                <label key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-indigo-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compareIds.includes(c.id)}
                    onChange={e => {
                      if (e.target.checked) setCompareIds([...compareIds, c.id]);
                      else setCompareIds(compareIds.filter(id => id !== c.id));
                    }}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="font-bold text-sm text-gray-800">{c.name} ({c.status})</span>
                </label>
              ))}
            </div>

            <button
              onClick={handleRunComparison}
              disabled={compareIds.length < 2 || comparing}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl disabled:opacity-50"
            >
              {comparing ? 'Comparing...' : 'Run Side-by-Side Comparison'}
            </button>

            {comparisonResult && (
              <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3 text-xs">
                <h4 className="font-bold text-indigo-900 text-sm">Comparison Summary</h4>
                <p className="text-indigo-800 font-medium">{comparisonResult.comparisonSummary}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={() => setShowCompareModal(false)} className="px-5 py-2 text-gray-600 font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;
