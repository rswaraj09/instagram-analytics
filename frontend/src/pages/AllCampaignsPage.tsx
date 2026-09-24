import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCampaigns,
  createCampaign,
  deleteCampaign,
  compareCampaigns,
} from '../api/campaignApi';
import type { Campaign, CampaignComparison } from '../api/campaignApi';
import { CampaignAccountIdentity } from '../components/CampaignAccountIdentity';
import { CampaignMediaViewer } from '../components/CampaignMediaViewer';

export const AllCampaignsPage: React.FC = () => {
  const token = localStorage.getItem('token') || '';
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search, Filter, Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Selection & Comparison State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState<CampaignComparison | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // New Campaign Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    objective: 'Brand Awareness',
    brand: '',
    category: 'General',
    budget: 1000,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    status: 'ACTIVE' as const,
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCampaigns(token);
      setCampaigns(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCampaign(newCampaign, token);
      setIsCreateModalOpen(false);
      setNewCampaign({
        name: '',
        objective: 'Brand Awareness',
        brand: '',
        category: 'General',
        budget: 1000,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: 'ACTIVE',
      });
      fetchCampaigns();
    } catch (err: any) {
      alert(err.message || 'Failed to create campaign');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await deleteCampaign(id, token);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete campaign');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCompareClick = async () => {
    if (selectedIds.length < 1) return;
    setIsComparing(true);
    try {
      const comparison = await compareCampaigns(selectedIds, token);
      setComparisonData(comparison);
      setComparisonModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to run campaign comparison');
    } finally {
      setIsComparing(false);
    }
  };

  // Filter & Sort Logic
  const filtered = campaigns.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.brand && c.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.objective && c.objective.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    let matchesDate = true;
    if (startDateFilter && c.startDate) {
      matchesDate = matchesDate && c.startDate >= startDateFilter;
    }
    if (endDateFilter && c.endDate) {
      matchesDate = matchesDate && c.endDate <= endDateFilter;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'budget') return (b.budget || 0) - (a.budget || 0);
    if (sortBy === 'spend') return (b.totalSpend || 0) - (a.totalSpend || 0);
    if (sortBy === 'reach') return (b.totalReach || 0) - (a.totalReach || 0);
    if (sortBy === 'er') return (b.engagementRate || 0) - (a.engagementRate || 0);
    if (sortBy === 'roas') return (b.roas || 0) - (a.roas || 0);
    if (sortBy === 'startDate') return (b.startDate || '').localeCompare(a.startDate || '');
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'SCHEDULED':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'COMPLETED':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'PAUSED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'FAILED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-violet-950/40 to-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white">All Instagram Campaigns</h1>
          <p className="text-sm text-slate-400 mt-1">
            Filter, search, compare, and manage your complete Instagram marketing campaign portfolio.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleCompareClick}
              disabled={isComparing}
              className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-semibold shadow-lg shadow-fuchsia-600/20 transition-all"
            >
              {isComparing ? 'Comparing...' : `Compare Selected (${selectedIds.length})`}
            </button>
          )}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 transition-all flex items-center gap-1"
          >
            <span>+</span> New Campaign
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80">
          {['ALL', 'ACTIVE', 'SCHEDULED', 'COMPLETED', 'PAUSED', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {st === 'ALL' ? 'All Campaigns' : st}
              <span className="ml-1.5 opacity-70 text-[10px]">
                ({st === 'ALL' ? campaigns.length : campaigns.filter((c) => c.status === st).length})
              </span>
            </button>
          ))}
        </div>

        {/* Search, Sort, Date Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name, brand, objective..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-violet-500 focus:outline-none"
            >
              <option value="createdAt">Date Created (Newest)</option>
              <option value="name">Campaign Name</option>
              <option value="reach">Highest Reach</option>
              <option value="er">Highest ER%</option>
              <option value="spend">Highest Spend</option>
              <option value="budget">Highest Budget</option>
              <option value="roas">Highest ROAS</option>
              <option value="startDate">Start Date</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Start Date From</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">End Date To</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Campaign List / Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800">
          <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">Loading campaign database...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      ) : sorted.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80 space-y-3">
          <span className="text-4xl">📊</span>
          <h3 className="text-base font-bold text-white">No campaigns found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL' || startDateFilter || endDateFilter
              ? 'No campaign matches your current search or date filters.'
              : 'Create your first campaign to track reach, impressions, and ROI.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((campaign) => {
            const isSelected = selectedIds.includes(campaign.id);
            return (
              <div
                key={campaign.id}
                className={`bg-slate-900 border rounded-3xl p-6 shadow-xl transition-all flex flex-col justify-between space-y-5 ${
                  isSelected ? 'border-fuchsia-500 ring-1 ring-fuchsia-500' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-4">
                  {/* Exact Instagram Post / Reel Media Viewer with Account Attribution Below */}
                  <CampaignMediaViewer
                    campaign={campaign}
                    variant="card"
                    dark={true}
                    showAccountIdentityBelow={true}
                  />

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(campaign.id)}
                        className="w-4 h-4 rounded border-slate-700 text-fuchsia-600 focus:ring-0 bg-slate-950 cursor-pointer"
                      />
                      <div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            campaign.status
                          )}`}
                        >
                          {campaign.status}
                        </span>
                        <h2 className="text-base font-bold text-white mt-1 line-clamp-1">
                          {campaign.name}
                        </h2>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="text-slate-500 hover:text-rose-400 text-xs font-semibold"
                      title="Delete Campaign"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-1">{campaign.objective}</p>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Reach</span>
                      <span className="font-bold text-slate-100">{campaign.totalReach?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">ER Rate</span>
                      <span className="font-bold text-violet-400">
                        {campaign.engagementRate != null ? `${campaign.engagementRate.toFixed(2)}%` : '0%'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Spend</span>
                      <span className="font-bold text-emerald-400">${campaign.totalSpend || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {campaign.startDate} → {campaign.endDate}
                  </span>
                  <button
                    onClick={() => navigate(`/app/campaigns/${campaign.id}`)}
                    className="text-xs font-bold text-violet-400 hover:text-violet-300"
                  >
                    Details →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Campaign Comparison Side-by-Side Modal */}
      {comparisonModalOpen && comparisonData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Campaign Side-by-Side Comparison</h2>
                <p className="text-xs text-slate-400 mt-0.5">{comparisonData.comparisonSummary}</p>
              </div>
              <button
                onClick={() => setComparisonModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950">
                    <th className="p-3 font-bold text-slate-400">Metric</th>
                    {comparisonData.campaigns.map((c) => (
                      <th key={c.id} className="p-3 font-bold text-white min-w-[160px] align-top">
                        <div className="mb-2">
                          <CampaignAccountIdentity
                            account={c.instagramAccount}
                            username={c.brand?.toLowerCase().replace(/\s+/g, '_')}
                            displayName={c.brand || c.name}
                            variant="compact"
                            dark={true}
                          />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{c.name}</span>
                          {c.id === comparisonData.bestPerformingCampaignId && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold">
                              TOP PERFORMER
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="p-3 font-semibold text-slate-400">Status</td>
                    {comparisonData.campaigns.map((c) => (
                      <td key={c.id} className="p-3 font-bold text-white">
                        {c.status}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-400">Total Reach</td>
                    {comparisonData.campaigns.map((c) => (
                      <td key={c.id} className="p-3 font-bold text-emerald-400">
                        {c.totalReach?.toLocaleString() || 0}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-400">Total Impressions</td>
                    {comparisonData.campaigns.map((c) => (
                      <td key={c.id} className="p-3 font-bold text-white">
                        {c.totalImpressions?.toLocaleString() || 0}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-400">Engagement Rate %</td>
                    {comparisonData.campaigns.map((c) => (
                      <td key={c.id} className="p-3 font-bold text-violet-400">
                        {c.engagementRate != null ? `${c.engagementRate.toFixed(2)}%` : '0%'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-400">Total Spend</td>
                    {comparisonData.campaigns.map((c) => (
                      <td key={c.id} className="p-3 font-bold text-white">
                        ${c.totalSpend || 0} / ${c.budget || 0}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-400">ROAS</td>
                    {comparisonData.campaigns.map((c) => (
                      <td key={c.id} className="p-3 font-bold text-fuchsia-400">
                        {c.roas != null ? `${c.roas.toFixed(2)}x` : '0x'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-400">Link Clicks</td>
                    {comparisonData.campaigns.map((c) => (
                      <td key={c.id} className="p-3 font-bold text-white">
                        {c.totalLinkClicks?.toLocaleString() || 0}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setComparisonModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Campaign Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 w-full max-w-md shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Create Instagram Campaign</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Reel Launch 2026"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-violet-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Brand"
                    value={newCampaign.brand}
                    onChange={(e) => setNewCampaign({ ...newCampaign, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Budget ($)</label>
                  <input
                    type="number"
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign({ ...newCampaign, budget: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newCampaign.startDate}
                    onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    value={newCampaign.endDate}
                    onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-violet-600 text-white font-semibold shadow-lg shadow-violet-600/20"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
