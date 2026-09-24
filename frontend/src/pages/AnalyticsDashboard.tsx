import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  ArcElement, Filler, Tooltip, Legend
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  getAllMedia, getDashboardSummary, compareMedia, exportAnalyticsCsv,
  exportToExcel, exportToPdf, getAuthToken,
  type MediaItem, type DashboardSummary,
} from '../api/apiClient';
import AccountSelector from '../components/AccountSelector';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend);

// ── Constants ──────────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'newest', label: '🕐 Newest First' },
  { value: 'oldest', label: '📅 Oldest First' },
  { value: 'likes', label: '❤️ Most Liked' },
  { value: 'views', label: '👁️ Most Viewed' },
  { value: 'comments', label: '💬 Most Comments' },
  { value: 'shares', label: '🔗 Most Shared' },
  { value: 'saves', label: '🔖 Most Saved' },
  { value: 'reach', label: '📡 Highest Reach' },
  { value: 'impressions', label: '🌟 Most Impressions' },
  { value: 'engagement', label: '🔥 Best Engagement' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'REELS', label: '🎬 Reels' },
  { value: 'IMAGE', label: '🖼️ Images' },
  { value: 'VIDEO', label: '📹 Videos' },
];

const chartColors = {
  purple: 'rgba(139, 92, 246, 1)',
  purpleAlpha: 'rgba(139, 92, 246, 0.15)',
  indigo: 'rgba(99, 102, 241, 1)',
  indigoAlpha: 'rgba(99, 102, 241, 0.15)',
  rose: 'rgba(244, 63, 94, 1)',
  roseAlpha: 'rgba(244, 63, 94, 0.15)',
  emerald: 'rgba(16, 185, 129, 1)',
  emeraldAlpha: 'rgba(16, 185, 129, 0.15)',
  amber: 'rgba(245, 158, 11, 1)',
  amberAlpha: 'rgba(245, 158, 11, 0.15)',
  blue: 'rgba(59, 130, 246, 1)',
  blueAlpha: 'rgba(59, 130, 246, 0.15)',
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n: number | null | undefined) =>
  n == null ? '—' : n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}K`
      : n.toLocaleString();

const pct = (n: number | null | undefined) =>
  n == null ? '—' : `${n.toFixed(2)}%`;

const timeAgo = (ts: string | null) => {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  const d = Math.floor(diff / 86400000);
  return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`;
};

const typeEmoji = (type: string, productType: string) => {
  if (productType?.toUpperCase() === 'REELS') return '🎬';
  if (type === 'VIDEO') return '📹';
  if (type === 'IMAGE') return '🖼️';
  return '📸';
};

// ── Sub-Components ─────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  title: string; value: string | number; icon: string;
  color: string; sub?: string; highlight?: boolean;
}> = ({ title, value, icon, color, sub, highlight }) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 hover:shadow-lg ${highlight
      ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-transparent shadow-lg shadow-violet-200'
      : 'bg-white border-gray-100 hover:border-violet-200'
    }`}>
    <div className="flex items-start justify-between">
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${highlight ? 'text-violet-200' : 'text-gray-400'}`}>
          {title}
        </p>
        <p className={`text-2xl font-extrabold ${highlight ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        {sub && <p className={`text-xs mt-1 ${highlight ? 'text-violet-200' : 'text-gray-400'}`}>{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${highlight ? 'bg-white/20' : `bg-${color}-50`
        }`}>
        {icon}
      </div>
    </div>
    {highlight && (
      <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/10" />
    )}
  </div>
);

const MediaCard: React.FC<{
  item: MediaItem;
  onSelect?: (id: string) => void;
  selected?: boolean;
  compareMode?: boolean;
}> = ({ item, onSelect, selected, compareMode }) => {
  const thumb = item.thumbnailUrl || item.mediaUrl;
  const isReel = item.mediaProductType?.toUpperCase() === 'REELS';

  return (
    <div
      onClick={() => compareMode && onSelect?.(item.id)}
      className={`group bg-white rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-xl cursor-pointer ${selected
          ? 'border-violet-500 ring-2 ring-violet-300 shadow-lg'
          : 'border-gray-100 hover:border-violet-200'
        } ${compareMode ? 'hover:scale-[1.01]' : ''}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt={item.caption?.slice(0, 30) || 'post'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
            {typeEmoji(item.mediaType, item.mediaProductType)}
          </div>
        )}
        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold backdrop-blur text-white ${isReel ? 'bg-violet-600/90' : 'bg-gray-800/80'
            }`}>
            {typeEmoji(item.mediaType, item.mediaProductType)}{' '}
            {isReel ? 'Reel' : item.mediaType}
          </span>
        </div>
        {/* Compare checkbox */}
        {compareMode && (
          <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white/80 border-gray-300'
            }`}>
            {selected && <span className="text-xs">✓</span>}
          </div>
        )}
        {/* Engagement overlay on hover */}
        {item.engagementRate != null && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-xs font-bold">
            {pct(item.engagementRate)} ER
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Caption */}
        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed min-h-8">
          {item.caption || <span className="text-gray-300 italic">No caption</span>}
        </p>

        <p className="text-xs text-gray-400">{timeAgo(item.timestamp)}</p>

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-2">
          <MetricPill icon="❤️" value={fmt(item.likeCount)} label="Likes" color="rose" />
          <MetricPill icon="💬" value={fmt(item.commentsCount)} label="Comments" color="blue" />
          <MetricPill icon="👁️" value={fmt(item.videoViews ?? item.plays)} label="Views" color="indigo" />
          <MetricPill icon="📡" value={fmt(item.reach)} label="Reach" color="emerald" />
          <MetricPill icon="🔖" value={fmt(item.saved)} label="Saves" color="amber" />
          <MetricPill icon="🔗" value={fmt(item.shares)} label="Shares" color="purple" />
        </div>

        {/* External link */}
        {item.permalink && (
          <a
            href={item.permalink}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
          >
            View on Instagram ↗
          </a>
        )}
      </div>
    </div>
  );
};

const MetricPill: React.FC<{ icon: string; value: string; label: string; color: string }> = ({
  icon, value, label
}) => (
  <div className="flex flex-col items-center p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
    <span className="text-xs">{icon}</span>
    <span className="text-xs font-bold text-gray-900 mt-0.5">{value}</span>
    <span className="text-[9px] text-gray-400">{label}</span>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────

type Tab = 'overview' | 'content' | 'compare' | 'charts';

const AnalyticsDashboard: React.FC = () => {
  const [tab, setTab] = useState<Tab>('overview');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [compareData, setCompareData] = useState<MediaItem[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [exportMenu, setExportMenu] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [chartMetric, setChartMetric] = useState<'views' | 'likes' | 'comments' | 'shares' | 'saves' | 'reach' | 'impressions' | 'engagementRate'>('views');

  const exportRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const token = getAuthToken();

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchMedia = useCallback(async (pg = 0) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllMedia(token, {
        accountId: selectedAccountId || undefined,
        limit: 200,
        type: typeFilter || undefined,
        search: search || undefined,
        sortBy,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page: pg,
        size: 12,
      });
      setMedia(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      setPage(pg);
      setLastRefresh(new Date());
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [token, selectedAccountId, typeFilter, search, sortBy, dateFrom, dateTo]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const result = await getDashboardSummary(token, selectedAccountId || undefined);
      setSummary(result);
      // Milestone notifications
      if (result.bestPerformingReel && result.bestPerformingReel.videoViews && result.bestPerformingReel.videoViews >= 10000) {
        setNotification(`🎉 Your top reel crossed ${fmt(result.bestPerformingReel.videoViews)} views!`);
        setTimeout(() => setNotification(null), 8000);
      }
    } catch (e: any) {
      // Non-critical, don't show error for summary
    } finally {
      setSummaryLoading(false);
    }
  }, [token, selectedAccountId]);

  useEffect(() => {
    if (tab === 'overview') fetchSummary();
    else if (tab === 'content') fetchMedia(0);
    else if (tab === 'charts' && !summary) fetchSummary();
  }, [tab, selectedAccountId]);

  // Debounced search
  useEffect(() => {
    if (tab !== 'content') return;
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchMedia(0), 400);
    return () => clearTimeout(searchTimeout.current);
  }, [search, sortBy, typeFilter, dateFrom, dateTo]);

  // Close export menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node))
        setExportMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Compare ──────────────────────────────────────────────────────────────────

  const handleCompare = async () => {
    if (compareIds.size < 2) return;
    setCompareLoading(true);
    try {
      const result = await compareMedia(token, [...compareIds], selectedAccountId || undefined);
      setCompareData(result);
      setTab('compare');
    } catch (e: any) {
      setError(e?.message ?? 'Compare failed');
    } finally {
      setCompareLoading(false);
    }
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      return next;
    });
  };

  // ── Export ───────────────────────────────────────────────────────────────────

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setExportMenu(false);
    try {
      let blob: Blob;
      if (format === 'csv') {
        blob = await exportAnalyticsCsv(token, selectedAccountId || undefined);
      } else if (format === 'excel') {
        // Convert MediaItem[] to ExportableRow[] format for excel export
        const rows = media.map(m => ({
          profileUrl: m.permalink ?? '',
          username: m.shortcode ?? m.id,
          followersCount: null,
          followingCount: null,
          totalPosts: null,
          postUrl: m.permalink ?? '',
          likesCount: m.likeCount,
          commentsCount: m.commentsCount,
          viewsCount: m.videoViews,
          reach: m.reach,
        }));
        blob = await exportToExcel(rows, token);
      } else {
        const rows = media.map(m => ({
          profileUrl: m.permalink ?? '',
          username: m.shortcode ?? m.id,
          followersCount: null,
          followingCount: null,
          totalPosts: null,
          postUrl: m.permalink ?? '',
          likesCount: m.likeCount,
          commentsCount: m.commentsCount,
          viewsCount: m.videoViews,
          reach: m.reach,
        }));
        blob = await exportToPdf(rows, token);
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `instagram-analytics.${format === 'csv' ? 'csv' : format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message ?? 'Export failed');
    }
  };

  // ── Chart data ───────────────────────────────────────────────────────────────

  const chartData = (() => {
    if (!summary?.dailySnapshots?.length) return null;
    const labels = summary.dailySnapshots.map(s => s.date.slice(5)); // MM-DD
    const metricVal = (s: typeof summary.dailySnapshots[0]) => {
      if (chartMetric === 'engagementRate') return s.engagementRate;
      return (s as any)[chartMetric] ?? 0;
    };
    return {
      labels,
      datasets: [{
        label: chartMetric.charAt(0).toUpperCase() + chartMetric.slice(1),
        data: summary.dailySnapshots.map(metricVal),
        borderColor: chartColors.purple,
        backgroundColor: chartColors.purpleAlpha,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: chartColors.purple,
      }]
    };
  })();

  const typeBreakdown = (() => {
    if (!summary) return null;
    return {
      labels: ['Reels', 'Images', 'Videos'],
      datasets: [{
        data: [summary.totalReels, summary.totalImages, summary.totalVideos - summary.totalReels],
        backgroundColor: [chartColors.purple, chartColors.emerald, chartColors.blue],
        borderWidth: 0,
      }]
    };
  })();

  const topContentChart = (() => {
    if (!media.length) return null;
    const top10 = media.slice(0, 10);
    const metricMap: Record<string, (m: MediaItem) => number> = {
      views: m => m.videoViews ?? m.plays ?? 0,
      likes: m => m.likeCount ?? 0,
      comments: m => m.commentsCount ?? 0,
      shares: m => m.shares ?? 0,
      saves: m => m.saved ?? 0,
      reach: m => m.reach ?? 0,
    };
    const getter = metricMap[chartMetric] ?? metricMap.views;
    return {
      labels: top10.map(m => m.shortcode ?? m.id?.slice(-6) ?? ''),
      datasets: [{
        label: chartMetric,
        data: top10.map(getter),
        backgroundColor: top10.map((_, i) => `hsla(${260 - i * 12}, 80%, ${55 + i * 3}%, 0.85)`),
        borderRadius: 8,
        borderWidth: 0,
      }]
    };
  })();

  // ── Tabs ─────────────────────────────────────────────────────────────────────

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'content', label: 'Content', icon: '🎬' },
    { id: 'charts', label: 'Charts', icon: '📈' },
    { id: 'compare', label: 'Compare', icon: '⚖️' },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-indigo-50/20">
      {/* Notification toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-2xl shadow-violet-200 flex items-center gap-2 text-sm font-medium animate-bounce-in">
          {notification}
          <button onClick={() => setNotification(null)} className="ml-2 text-white/70 hover:text-white">✕</button>
        </div>
      )}

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
                Reel & Post Analytics
              </span>
            </h1>
            {lastRefresh && (
              <p className="text-sm text-gray-400 mt-1">
                Last synced: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Account selector */}
            <div className="w-56">
              <AccountSelector value={selectedAccountId} onChange={setSelectedAccountId} />
            </div>

            {/* Refresh */}
            <button
              onClick={() => { fetchSummary(); if (tab === 'content') fetchMedia(0); }}
              disabled={loading || summaryLoading}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
            >
              {(loading || summaryLoading) ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : '🔄'}
              Sync Now
            </button>

            {/* Export dropdown */}
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setExportMenu(s => !s)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-medium text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
              >
                ⬇ Export ▾
              </button>
              {exportMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 z-30 overflow-hidden">
                  <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-3 text-sm hover:bg-violet-50 transition-colors flex items-center gap-2">
                    📄 Export as CSV
                  </button>
                  <button onClick={() => handleExport('excel')} className="w-full text-left px-4 py-3 text-sm hover:bg-violet-50 transition-colors flex items-center gap-2">
                    📊 Export as Excel
                  </button>
                  <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-3 text-sm hover:bg-violet-50 transition-colors flex items-center gap-2">
                    📑 Export as PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white/80 backdrop-blur rounded-2xl border border-gray-100 shadow-sm mb-8 w-fit">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${tab === t.id
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ──────────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-8">
            {summaryLoading ? (
              <LoadingSpinner text="Syncing analytics from Instagram..." />
            ) : summary ? (
              <>
                {/* Overview stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  <StatCard title="Total Posts" value={fmt(summary.totalPosts)} icon="📸" color="violet" highlight />
                  <StatCard title="Total Reels" value={fmt(summary.totalReels)} icon="🎬" color="violet" />
                  <StatCard title="Total Views" value={fmt(summary.totalViews)} icon="👁️" color="indigo" />
                  <StatCard title="Total Likes" value={fmt(summary.totalLikes)} icon="❤️" color="rose" />
                  <StatCard title="Total Comments" value={fmt(summary.totalComments)} icon="💬" color="blue" />
                  <StatCard title="Total Shares" value={fmt(summary.totalShares)} icon="🔗" color="purple" />
                  <StatCard title="Total Saves" value={fmt(summary.totalSaves)} icon="🔖" color="amber" />
                  <StatCard title="Total Reach" value={fmt(summary.totalReach)} icon="📡" color="emerald" />
                  <StatCard title="Total Impressions" value={fmt(summary.totalImpressions)} icon="🌟" color="cyan" />
                  <StatCard title="Avg Engagement" value={pct(summary.averageEngagementRate)} icon="🔥" color="orange" />
                  <StatCard title="Images" value={fmt(summary.totalImages)} icon="🖼️" color="teal" />
                  <StatCard title="Videos" value={fmt(summary.totalVideos)} icon="📹" color="pink" />
                </div>

                {/* Best performers */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Top Performers</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {[
                      { label: '🎬 Best Reel', item: summary.bestPerformingReel, metric: 'Views', val: fmt(summary.bestPerformingReel?.videoViews) },
                      { label: '📸 Best Post', item: summary.bestPerformingPost, metric: 'Engagement', val: pct(summary.bestPerformingPost?.engagementRate) },
                      { label: '⚡ Fastest Growing', item: summary.fastestGrowingContent, metric: 'Reach', val: fmt(summary.fastestGrowingContent?.reach) },
                      { label: '🔗 Most Shared', item: summary.mostSharedContent, metric: 'Shares', val: fmt(summary.mostSharedContent?.shares) },
                      { label: '🔖 Most Saved', item: summary.mostSavedContent, metric: 'Saves', val: fmt(summary.mostSavedContent?.saved) },
                    ].map(({ label, item, metric, val }) => (
                      <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-violet-200 transition-all">
                        <p className="text-xs font-bold text-violet-600 mb-3">{label}</p>
                        {item ? (
                          <>
                            {item.thumbnailUrl || item.mediaUrl ? (
                              <img src={(item.thumbnailUrl || item.mediaUrl)!} alt="" className="w-full aspect-video object-cover rounded-lg mb-3" />
                            ) : (
                              <div className="w-full aspect-video bg-gradient-to-br from-violet-100 to-indigo-100 rounded-lg mb-3 flex items-center justify-center text-3xl">
                                {typeEmoji(item.mediaType, item.mediaProductType)}
                              </div>
                            )}
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">{item.caption ?? 'No caption'}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">{timeAgo(item.timestamp)}</span>
                              <span className="text-sm font-bold text-gray-900">{metric}: {val}</span>
                            </div>
                            {item.permalink && (
                              <a href={item.permalink} target="_blank" rel="noreferrer"
                                className="mt-2 text-xs text-violet-600 hover:underline block">
                                View ↗
                              </a>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-6 text-gray-300 text-sm">No data</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mini daily trend */}
                {summary.dailySnapshots.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Recent Activity</h2>
                    <div className="h-48">
                      {chartData && (
                        <Line
                          data={chartData}
                          options={{
                            responsive: true, maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                              x: { grid: { display: false }, ticks: { maxTicksLimit: 7 } },
                              y: { grid: { color: 'rgba(0,0,0,0.04)' } },
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon="📊"
                title="No analytics yet"
                desc="Connect an Instagram account under Accounts to start syncing your content analytics."
              />
            )}
          </div>
        )}

        {/* ── CONTENT TAB ────────────────────────────────────────────────────────── */}
        {tab === 'content' && (
          <div className="space-y-6">
            {/* Filters bar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-48">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                  <input
                    type="text"
                    placeholder="Search by caption, hashtag, ID..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-400 focus:border-transparent text-sm transition-all"
                  />
                </div>

                {/* Type filter */}
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-400 text-sm bg-white"
                >
                  {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-400 text-sm bg-white"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>

                {/* Date range */}
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-400" />
                <span className="text-gray-400 text-sm">→</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-violet-400" />

                {/* Clear filters */}
                {(search || typeFilter || dateFrom || dateTo) && (
                  <button onClick={() => { setSearch(''); setTypeFilter(''); setDateFrom(''); setDateTo(''); }}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                    ✕ Clear
                  </button>
                )}
              </div>

              {/* Compare controls */}
              {compareIds.size > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                  <span className="text-sm text-violet-600 font-medium">
                    {compareIds.size} selected for comparison
                  </span>
                  <button
                    onClick={handleCompare}
                    disabled={compareIds.size < 2 || compareLoading}
                    className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg font-medium transition-all disabled:opacity-50"
                  >
                    {compareLoading ? 'Loading...' : '⚖️ Compare Now'}
                  </button>
                  <button
                    onClick={() => setCompareIds(new Set())}
                    className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-700">{media.length}</span> of{' '}
                <span className="font-semibold text-gray-700">{totalElements}</span> posts
                {compareIds.size > 0 && ' • Click to select for comparison'}
              </p>
              <label className="text-xs text-gray-400 flex items-center gap-1.5 cursor-pointer">
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${compareIds.size > 0 ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-300'
                  }`}>
                  {compareIds.size > 0 && '✓'}
                </span>
                Compare mode {compareIds.size > 0 ? 'ON' : 'OFF'}
              </label>
            </div>

            {/* Media grid */}
            {loading ? (
              <LoadingSpinner text="Syncing posts & reels..." />
            ) : media.length === 0 ? (
              <EmptyState icon="🎬" title="No content found" desc="Try adjusting your filters or sync your account." />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {media.map(item => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      onSelect={toggleCompare}
                      selected={compareIds.has(item.id)}
                      compareMode
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => fetchMedia(page - 1)}
                      disabled={page === 0 || loading}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Prev
                    </button>
                    <span className="text-sm text-gray-500 px-3">
                      Page {page + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => fetchMedia(page + 1)}
                      disabled={page >= totalPages - 1 || loading}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── CHARTS TAB ────────────────────────────────────────────────────────── */}
        {tab === 'charts' && (
          <div className="space-y-6">
            {/* Metric selector */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-2 shadow-sm">
              {(['views', 'likes', 'comments', 'shares', 'saves', 'reach', 'impressions', 'engagementRate'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setChartMetric(m)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${chartMetric === m
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Growth timeline */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Growth Timeline</h3>
                {summaryLoading ? <LoadingSpinner text="Loading..." /> :
                  chartData ? (
                    <div className="h-64">
                      <Line data={chartData} options={{
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                        scales: {
                          x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } },
                          y: { grid: { color: 'rgba(0,0,0,0.04)' }, beginAtZero: true },
                        }
                      }} />
                    </div>
                  ) : <EmptyState icon="📉" title="No timeline data" desc="Sync your account to see growth trends." />
                }
              </div>

              {/* Content type breakdown */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🍩 Content Breakdown</h3>
                {summaryLoading ? <LoadingSpinner text="Loading..." /> :
                  typeBreakdown ? (
                    <div className="h-64 flex items-center justify-center">
                      <Doughnut data={typeBreakdown} options={{
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } },
                          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` } }
                        },
                        cutout: '65%',
                      }} />
                    </div>
                  ) : <EmptyState icon="🍰" title="No breakdown data" desc="Sync your account." />
                }
              </div>

              {/* Top content bar chart */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm lg:col-span-2">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 Top 10 Content Performance</h3>
                {loading ? <LoadingSpinner text="Loading..." /> :
                  topContentChart ? (
                    <div className="h-72">
                      <Bar data={topContentChart} options={{
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          x: { grid: { display: false } },
                          y: { grid: { color: 'rgba(0,0,0,0.04)' }, beginAtZero: true },
                        }
                      }} />
                    </div>
                  ) : <EmptyState icon="📊" title="No content data" desc="Switch to Content tab and sync first." />
                }
              </div>
            </div>

            {/* Heatmap-style table: daily engagement */}
            {summary?.dailySnapshots && summary.dailySnapshots.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🔥 Daily Performance Heatmap</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                        {['Date', 'Views', 'Likes', 'Comments', 'Shares', 'Saves', 'Reach', 'Impressions', 'Eng. Rate'].map(h => (
                          <th key={h} className="py-3 px-3 text-right first:text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {summary.dailySnapshots.slice(-30).reverse().map(s => {
                        const max = Math.max(...summary.dailySnapshots.map(d => d.views));
                        const intensity = max > 0 ? s.views / max : 0;
                        const rgb = Math.round(255 - intensity * 100);
                        return (
                          <tr key={s.date} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="py-2.5 px-3 font-medium text-gray-700">{s.date}</td>
                            <td className="py-2.5 px-3 text-right font-semibold"
                              style={{ color: `rgb(${rgb},${Math.round(rgb * 0.5)},200)` }}>
                              {fmt(s.views)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-gray-600">{fmt(s.likes)}</td>
                            <td className="py-2.5 px-3 text-right text-gray-600">{fmt(s.comments)}</td>
                            <td className="py-2.5 px-3 text-right text-gray-600">{fmt(s.shares)}</td>
                            <td className="py-2.5 px-3 text-right text-gray-600">{fmt(s.saves)}</td>
                            <td className="py-2.5 px-3 text-right text-gray-600">{fmt(s.reach)}</td>
                            <td className="py-2.5 px-3 text-right text-gray-600">{fmt(s.impressions)}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className={`font-semibold ${s.engagementRate > 5 ? 'text-emerald-600' : s.engagementRate > 2 ? 'text-amber-600' : 'text-gray-600'}`}>
                                {pct(s.engagementRate)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── COMPARE TAB ────────────────────────────────────────────────────────── */}
        {tab === 'compare' && (
          <div className="space-y-6">
            {compareData.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="text-5xl mb-4">⚖️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Nothing to compare yet</h3>
                <p className="text-gray-500 mb-6">Go to the Content tab, select 2–5 posts or reels, then click "Compare Now".</p>
                <button onClick={() => setTab('content')}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all">
                  Go to Content →
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    Comparing {compareData.length} pieces of content
                  </h2>
                  <button onClick={() => { setTab('content'); setCompareData([]); setCompareIds(new Set()); }}
                    className="text-sm text-violet-600 hover:underline">
                    ← Back to Content
                  </button>
                </div>

                {/* Media cards side-by-side */}
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(compareData.length, 5)}, minmax(0, 1fr))` }}>
                  {compareData.map(item => <MediaCard key={item.id} item={item} />)}
                </div>

                {/* Comparison table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                        <th className="py-4 px-5 text-left font-semibold">Metric</th>
                        {compareData.map(item => (
                          <th key={item.id} className="py-4 px-5 text-right font-semibold">
                            {item.shortcode ?? item.id.slice(-6)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: '❤️ Likes', key: 'likeCount' as keyof MediaItem },
                        { label: '💬 Comments', key: 'commentsCount' as keyof MediaItem },
                        { label: '👁️ Views', key: 'videoViews' as keyof MediaItem },
                        { label: '🎯 Plays', key: 'plays' as keyof MediaItem },
                        { label: '📡 Reach', key: 'reach' as keyof MediaItem },
                        { label: '🌟 Impressions', key: 'impressions' as keyof MediaItem },
                        { label: '🔖 Saves', key: 'saved' as keyof MediaItem },
                        { label: '🔗 Shares', key: 'shares' as keyof MediaItem },
                        { label: '👤 Profile Visits', key: 'profileVisits' as keyof MediaItem },
                        { label: '📈 Engagement Rate', key: 'engagementRate' as keyof MediaItem },
                        { label: '⏱️ Avg Watch (s)', key: 'avgWatchTime' as keyof MediaItem },
                      ].map(({ label, key }) => {
                        const vals = compareData.map(item => (item[key] as number | null) ?? 0);
                        const maxVal = Math.max(...vals);
                        return (
                          <tr key={key} className="border-b border-gray-50 hover:bg-gray-50/50 even:bg-gray-50/30">
                            <td className="py-3 px-5 font-medium text-gray-700">{label}</td>
                            {compareData.map((item, i) => {
                              const v = (item[key] as number | null);
                              const isMax = vals[i] === maxVal && maxVal > 0;
                              const display = key === 'engagementRate'
                                ? pct(v as number | null)
                                : key === 'avgWatchTime'
                                  ? v != null ? `${(v / 1000).toFixed(1)}s` : '—'
                                  : fmt(v as number | null);
                              return (
                                <td key={item.id} className={`py-3 px-5 text-right font-semibold ${isMax ? 'text-violet-600' : 'text-gray-700'
                                  }`}>
                                  {isMax && '👑 '}{display}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

// ── Utility components ─────────────────────────────────────────────────────────

const LoadingSpinner: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-24 space-y-4">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
      <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
    </div>
    <p className="text-sm text-gray-500 font-medium">{text}</p>
  </div>
);

const EmptyState: React.FC<{ icon: string; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center py-20 space-y-3">
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-4xl">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
    <p className="text-sm text-gray-500 text-center max-w-xs">{desc}</p>
  </div>
);

export default AnalyticsDashboard;
