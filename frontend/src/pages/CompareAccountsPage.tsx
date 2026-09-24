import React, { useEffect, useState } from 'react';
import { accountApi } from '../api/accountApi';
import type { AccountComparisonResponse } from '../api/accountApi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export const CompareAccountsPage: React.FC = () => {
  const [data, setData] = useState<AccountComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'followers' | 'reach' | 'engagementRate' | 'growth'>('engagementRate');

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        setIsLoading(true);
        const res = await accountApi.compareAccounts();
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to compare accounts');
      } finally {
        setIsLoading(false);
      }
    };
    fetchComparison();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm">
          {error || 'No comparison data available'}
        </div>
      </div>
    );
  }

  const { accounts, topByReach, topByEngagementRate, topByFollowers, summaryTakeaway } = data;

  const chartLabels = accounts.map((a) => `@${a.username}`);
  const chartDataValues = accounts.map((a) => {
    switch (selectedMetric) {
      case 'followers':
        return a.followers;
      case 'reach':
        return a.reach;
      case 'engagementRate':
        return a.engagementRate;
      case 'growth':
        return a.followerGrowth;
      default:
        return a.engagementRate;
    }
  });

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: selectedMetric.toUpperCase(),
        data: chartDataValues,
        backgroundColor: [
          'rgba(139, 92, 246, 0.75)',
          'rgba(217, 70, 239, 0.75)',
          'rgba(16, 185, 129, 0.75)',
          'rgba(245, 158, 11, 0.75)',
          'rgba(59, 130, 246, 0.75)',
        ],
        borderColor: [
          'rgba(139, 92, 246, 1)',
          'rgba(217, 70, 239, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(59, 130, 246, 1)',
        ],
        borderWidth: 1.5,
        borderRadius: 12,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-6 rounded-3xl shadow-2xl">
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
          Instagram Account Comparison
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Benchmark reach, engagement rates, follower growth, and campaign performance across all connected channels.
        </p>

        {summaryTakeaway && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-transparent border border-violet-500/20 flex items-start gap-3">
            <span className="text-xl">✨</span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400 block">AI Comparative Synthesis</span>
              <p className="text-sm font-medium text-slate-200 mt-0.5">{summaryTakeaway}</p>
            </div>
          </div>
        )}
      </div>

      {/* Top Performers Ranking Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xl font-bold">
            🏆
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Highest Engagement Rate</span>
            <span className="text-lg font-extrabold text-white">
              @{topByEngagementRate?.username || 'N/A'}
            </span>
            <span className="text-xs text-emerald-400 font-semibold ml-2">
              {topByEngagementRate?.engagementRate?.toFixed(2)}% ER
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-xl font-bold">
            🚀
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Highest Reach Leader</span>
            <span className="text-lg font-extrabold text-white">
              @{topByReach?.username || 'N/A'}
            </span>
            <span className="text-xs text-violet-400 font-semibold ml-2">
              {(topByReach?.reach ? topByReach.reach / 1000 : 0).toFixed(1)}k Reach
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 text-xl font-bold">
            👥
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Largest Audience Base</span>
            <span className="text-lg font-extrabold text-white">
              @{topByFollowers?.username || 'N/A'}
            </span>
            <span className="text-xs text-fuchsia-400 font-semibold ml-2">
              {(topByFollowers?.followers ? topByFollowers.followers / 1000 : 0).toFixed(1)}k Followers
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Comparison Visualizer Chart */}
      <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Channel Performance Comparison</h2>
            <p className="text-xs text-slate-400">Compare metrics side-by-side</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['engagementRate', 'reach', 'followers', 'growth'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMetric(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  selectedMetric === m
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'engagementRate' ? 'ER Rate' : m}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Detailed Benchmark Matrix Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800/80">
          <h2 className="text-lg font-bold text-white">Account Comparison Matrix</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Account</th>
                <th className="px-6 py-4">Followers</th>
                <th className="px-6 py-4">Reach</th>
                <th className="px-6 py-4">Impressions</th>
                <th className="px-6 py-4">Engagement</th>
                <th className="px-6 py-4">ER Rate</th>
                <th className="px-6 py-4">Posts</th>
                <th className="px-6 py-4">Reels</th>
                <th className="px-6 py-4">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-violet-400">
                      {acc.username[0].toUpperCase()}
                    </div>
                    <span>@{acc.username}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-200">{(acc.followers / 1000).toFixed(1)}K</td>
                  <td className="px-6 py-4 text-slate-200">{(acc.reach / 1000).toFixed(1)}K</td>
                  <td className="px-6 py-4 text-slate-200">{(acc.impressions / 1000).toFixed(1)}K</td>
                  <td className="px-6 py-4 text-slate-200">{(acc.engagement / 1000).toFixed(1)}K</td>
                  <td className="px-6 py-4 font-bold text-emerald-400">{acc.engagementRate.toFixed(2)}%</td>
                  <td className="px-6 py-4 text-slate-300">{acc.posts}</td>
                  <td className="px-6 py-4 text-slate-300">{acc.reels}</td>
                  <td className="px-6 py-4 text-emerald-400">+{acc.followerGrowth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
