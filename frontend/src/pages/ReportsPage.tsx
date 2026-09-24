import React, { useEffect, useState } from 'react';
import { getCampaigns } from '../api/campaignApi';
import type { Campaign } from '../api/campaignApi';

export const ReportsPage: React.FC = () => {
  const token = localStorage.getItem('token') || '';
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Export State
  const [selectedCampaignId, setSelectedCampaignId] = useState('ALL');
  const [reportTimeframe, setReportTimeframe] = useState<'WEEKLY' | 'MONTHLY' | 'ALL_TIME'>('WEEKLY');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const cData = await getCampaigns(token).catch(() => []);
      setCampaigns(cData);
    } catch (e) {
      console.error('Reports fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  const selectedCampaigns =
    selectedCampaignId === 'ALL'
      ? campaigns
      : campaigns.filter((c) => c.id === selectedCampaignId);

  const handleExportCSV = () => {
    setExporting(true);
    try {
      const headers = [
        'Campaign Name',
        'Status',
        'Objective',
        'Start Date',
        'End Date',
        'Budget ($)',
        'Total Spend ($)',
        'Reach',
        'Impressions',
        'Engagements',
        'ER %',
        'Link Clicks',
        'ROAS',
      ];

      const rows = selectedCampaigns.map((c) => [
        `"${c.name.replace(/"/g, '""')}"`,
        c.status,
        `"${(c.objective || '').replace(/"/g, '""')}"`,
        c.startDate || '',
        c.endDate || '',
        c.budget || 0,
        c.totalSpend || 0,
        c.totalReach || 0,
        c.totalImpressions || 0,
        c.totalEngagements || 0,
        c.engagementRate != null ? c.engagementRate.toFixed(2) : 0,
        c.totalLinkClicks || 0,
        c.roas != null ? c.roas.toFixed(2) : 0,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `instagram-campaigns-report-${selectedCampaignId}-${Date.now()}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to generate CSV export.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const totalReachSum = selectedCampaigns.reduce((acc, c) => acc + (c.totalReach || 0), 0);
  const totalSpendSum = selectedCampaigns.reduce((acc, c) => acc + (c.totalSpend || 0), 0);
  const totalImpressionsSum = selectedCampaigns.reduce((acc, c) => acc + (c.totalImpressions || 0), 0);
  const avgER =
    selectedCampaigns.length > 0
      ? (
          selectedCampaigns.reduce((acc, c) => acc + (c.engagementRate || 0), 0) /
          selectedCampaigns.length
        ).toFixed(2)
      : '0.00';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0 print:m-0 print:max-w-none">
      {/* Header Banner (Hidden on print) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-violet-950/40 to-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Campaign Executive Reports & Data Export</h1>
          <p className="text-sm text-slate-400 mt-1">
            Generate executive summaries, export raw CSV analytics datasets, or save formatted PDF report views.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={exporting || selectedCampaigns.length === 0}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>📊</span> Export CSV Dataset
          </button>
          <button
            onClick={handlePrintPDF}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 transition-all flex items-center gap-1.5"
          >
            <span>🖨️</span> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Report Configuration Controls (Hidden on print) */}
      <div className="print:hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>⚙️</span> Report Scope & Filters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Select Campaign Scope</label>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-violet-500 focus:outline-none"
            >
              <option value="ALL">All Campaigns ({campaigns.length})</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Timeframe</label>
            <div className="flex gap-2">
              {(['WEEKLY', 'MONTHLY', 'ALL_TIME'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setReportTimeframe(t)}
                  className={`px-3 py-2 rounded-xl font-semibold text-[11px] transition-all flex-1 ${
                    reportTimeframe === t
                      ? 'bg-violet-600 text-white shadow'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end justify-end">
            <span className="text-slate-400 text-xs font-semibold">
              Selected Scope: <strong className="text-violet-400">{selectedCampaigns.length} Campaign(s)</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-slate-900 border border-slate-800 print:border-none print:bg-white print:text-black rounded-3xl p-6 lg:p-10 shadow-2xl space-y-8">
        {/* Report Header */}
        <div className="flex items-center justify-between border-b border-slate-800 print:border-gray-200 pb-6">
          <div>
            <span className="text-xs font-extrabold text-violet-400 print:text-indigo-600 uppercase tracking-widest block">
              INSTAGRAM CAMPAIGN ANALYTICS REPORT
            </span>
            <h2 className="text-2xl font-black text-white print:text-black mt-1">
              Executive Performance Summary
            </h2>
            <p className="text-xs text-slate-400 print:text-gray-500 mt-0.5">
              Generated on {new Date().toLocaleDateString()} | Scope: {selectedCampaignId === 'ALL' ? 'All Portfolio Campaigns' : 'Single Campaign View'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-white print:text-black">Instagram Analytics Engine</span>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 print:bg-gray-50 print:border-gray-200">
            <span className="text-[10px] text-slate-400 print:text-gray-500 uppercase font-bold block">Total Portfolio Reach</span>
            <span className="text-xl font-black text-emerald-400 print:text-emerald-700 mt-1 block">
              {totalReachSum.toLocaleString()}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 print:bg-gray-50 print:border-gray-200">
            <span className="text-[10px] text-slate-400 print:text-gray-500 uppercase font-bold block">Total Impressions</span>
            <span className="text-xl font-black text-white print:text-black mt-1 block">
              {totalImpressionsSum.toLocaleString()}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 print:bg-gray-50 print:border-gray-200">
            <span className="text-[10px] text-slate-400 print:text-gray-500 uppercase font-bold block">Avg Engagement Rate</span>
            <span className="text-xl font-black text-violet-400 print:text-indigo-600 mt-1 block">
              {avgER}%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 print:bg-gray-50 print:border-gray-200">
            <span className="text-[10px] text-slate-400 print:text-gray-500 uppercase font-bold block">Total Spend</span>
            <span className="text-xl font-black text-white print:text-black mt-1 block">
              ${totalSpendSum.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Campaign Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white print:text-black">Campaign Performance Breakdown</h3>

          {loading ? (
            <div className="py-8 text-center text-slate-400">Loading metrics...</div>
          ) : selectedCampaigns.length === 0 ? (
            <p className="text-xs text-slate-400">No campaigns found in selected scope.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 print:border-gray-300 bg-slate-950 print:bg-gray-100">
                    <th className="p-3 font-bold text-slate-400 print:text-gray-700">Campaign Name</th>
                    <th className="p-3 font-bold text-slate-400 print:text-gray-700">Status</th>
                    <th className="p-3 font-bold text-slate-400 print:text-gray-700">Reach</th>
                    <th className="p-3 font-bold text-slate-400 print:text-gray-700">Impressions</th>
                    <th className="p-3 font-bold text-slate-400 print:text-gray-700">ER %</th>
                    <th className="p-3 font-bold text-slate-400 print:text-gray-700">Spend</th>
                    <th className="p-3 font-bold text-slate-400 print:text-gray-700">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-200">
                  {selectedCampaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-850">
                      <td className="p-3 font-bold text-white print:text-black">{c.name}</td>
                      <td className="p-3 font-semibold text-slate-300 print:text-gray-800">{c.status}</td>
                      <td className="p-3 font-extrabold text-emerald-400 print:text-emerald-700">
                        {c.totalReach?.toLocaleString() || 0}
                      </td>
                      <td className="p-3 font-medium text-slate-200 print:text-black">
                        {c.totalImpressions?.toLocaleString() || 0}
                      </td>
                      <td className="p-3 font-bold text-violet-400 print:text-indigo-600">
                        {c.engagementRate != null ? `${c.engagementRate.toFixed(2)}%` : '0%'}
                      </td>
                      <td className="p-3 font-medium text-slate-200 print:text-black">${c.totalSpend || 0}</td>
                      <td className="p-3 font-bold text-fuchsia-400 print:text-purple-600">
                        {c.roas != null ? `${c.roas.toFixed(2)}x` : '0x'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
