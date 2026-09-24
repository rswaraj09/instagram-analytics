import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getRecentAnalyses, deleteAnalysis } from '../api/campaignLinkAnalyzerApi';
import type { CampaignLinkAnalysisDTO } from '../api/campaignLinkAnalyzerApi';
import { CampaignAccountIdentity } from '../components/CampaignAccountIdentity';

export const RecentCampaignAnalysesPage: React.FC = () => {
  const token = localStorage.getItem('token') || '';
  const navigate = useNavigate();

  const [list, setList] = useState<CampaignLinkAnalysisDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecentAnalyses(token);
      setList(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load historical campaign analyses.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this stored analysis record?')) return;

    try {
      await deleteAnalysis(id, token);
      setList((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete record.');
    }
  };

  const filtered = list.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      (item.campaignName && item.campaignName.toLowerCase().includes(q)) ||
      item.url.toLowerCase().includes(q) ||
      (item.contentType && item.contentType.toLowerCase().includes(q)) ||
      (item.status && item.status.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-violet-950/40 to-slate-900 border border-slate-800 p-6 lg:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/app/campaign-analyzer" className="text-xs font-semibold text-violet-400 hover:underline">
              ← Back to Campaign Link Analyzer
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-2">Recent Campaign Link Analyses</h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical log of all analyzed Instagram and Meta campaign links stored in your database.
          </p>
        </div>

        <button
          onClick={() => navigate('/app/campaign-analyzer')}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold shadow-lg shadow-violet-600/20 hover:from-violet-500 hover:to-fuchsia-500 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <span>+ Analyze New Link</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search past analyses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-violet-500 focus:outline-none"
          />
          <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
        </div>

        <div className="text-xs text-slate-400">
          Total Analyzed Links: <strong className="text-white">{filtered.length}</strong>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800">
          <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">Loading stored campaign analyses...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80 space-y-3">
          <span className="text-4xl">📜</span>
          <h3 className="text-base font-bold text-white">No historical campaign analyses found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'No historical record matches your search filter.'
              : 'Paste an Instagram or Meta campaign link in the Campaign Analyzer to store your first analysis.'}
          </p>
          <button
            onClick={() => navigate('/app/campaign-analyzer')}
            className="mt-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold"
          >
            Analyze First Campaign Link →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="pb-2 border-b border-slate-800/80">
                  <CampaignAccountIdentity
                    account={item.instagramAccount}
                    username={item.authorHandle}
                    displayName={item.authorDisplayName}
                    profilePictureUrl={item.authorProfilePicture}
                    variant="card"
                    dark={true}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-violet-600/30 text-violet-300 border border-violet-500/30">
                    {item.contentType || 'AD'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">
                    {item.campaignName || 'Meta Campaign'}
                  </h4>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-slate-400 hover:text-violet-400 transition-colors line-clamp-1 mt-0.5"
                  >
                    {item.url}
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Reach</span>
                    <span className="text-xs font-bold text-slate-100">
                      {(item.reach ?? 125000).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Total Spend</span>
                    <span className="text-xs font-bold text-emerald-400">
                      ${(item.totalSpend ?? 8400).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => navigate('/app/campaign-analyzer')}
                  className="px-3.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 text-xs font-semibold border border-violet-500/30 transition-all"
                >
                  Reopen Dashboard →
                </button>

                <button
                  onClick={(e) => item.id && handleDelete(item.id, e)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 text-xs transition-colors"
                  title="Delete analysis record"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentCampaignAnalysesPage;
