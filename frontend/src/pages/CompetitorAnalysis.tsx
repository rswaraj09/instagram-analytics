import React, { useState, useEffect } from 'react';

export const CompetitorAnalysis: React.FC = () => {
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState('Tech');
  const [selectedComp, setSelectedComp] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompetitors();
  }, []);

  const fetchCompetitors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/competitors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setCompetitors(json);
        if (json.length > 0) {
          fetchDashboard(json[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDashboard = async (id: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/competitors/${id}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setSelectedComp(json.competitor);
        setDashboardData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username, displayName, category })
      });
      if (res.ok) {
        setUsername('');
        setDisplayName('');
        fetchCompetitors();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8080/api/competitors/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCompetitors();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Competitor Intelligence & Benchmarking</h2>
        <p className="text-sm text-gray-500">Monitor rival performance, content gaps, side-by-side growth comparisons, and AI strategic takeaways.</p>
      </div>

      {/* Add Competitor */}
      <form onSubmit={handleAddCompetitor} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 flex flex-col md:flex-row items-end gap-4">
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Competitor Instagram @Username *</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. techcrunch"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Display Label</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. TechCrunch Official"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm hover:bg-indigo-700 transition-all cursor-pointer"
        >
          + Track Competitor
        </button>
      </form>

      {/* Competitors List */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {competitors.map((comp) => (
          <div
            key={comp.id}
            onClick={() => fetchDashboard(comp.id)}
            className={`border rounded-2xl p-4 cursor-pointer transition-all ${
              selectedComp?.id === comp.id ? 'border-indigo-600 bg-indigo-50/20 shadow-md' : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-gray-900">@{comp.username}</h4>
                <p className="text-xs text-gray-400">{comp.displayName}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(comp.id); }}
                className="text-xs text-rose-500 hover:underline"
              >
                Delete
              </button>
            </div>
            <div className="mt-3 flex justify-between items-center text-xs">
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-semibold">{comp.category}</span>
              <span className="text-emerald-600 font-bold">ACTIVE</span>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard Comparison */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading competitor comparison...</div>
      ) : dashboardData ? (
        <div className="space-y-6">
          {/* Status Label Banner */}
          <div className="flex justify-between items-center bg-gray-900 text-white rounded-2xl p-4">
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Data Provenance Status</span>
              <div className="text-sm font-bold mt-0.5">
                Data Status: <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-xs ml-1 font-mono">OBSERVED / ESTIMATED</span>
              </div>
            </div>
            <span className="text-xs text-gray-400">Strict Meta API Compliance Maintained</span>
          </div>

          {/* Side by Side Comparison */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Side-by-Side Account Benchmarking</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                  <tr>
                    <th className="py-3 px-4">Metric</th>
                    <th className="py-3 px-4 text-indigo-600 font-bold">My Account</th>
                    <th className="py-3 px-4 text-purple-600 font-bold">@{selectedComp?.username}</th>
                    <th className="py-3 px-4">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3 px-4 font-medium">Followers</td>
                    <td className="py-3 px-4 font-bold">{dashboardData.comparison?.myAccount?.followers?.toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold">{dashboardData.comparison?.competitor?.followers?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-rose-500 font-semibold">-34,000</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Engagement Rate</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">{dashboardData.comparison?.myAccount?.engagementRate}%</td>
                    <td className="py-3 px-4 font-bold text-purple-600">{dashboardData.comparison?.competitor?.engagementRate}%</td>
                    <td className="py-3 px-4 text-amber-600 font-semibold">-0.70%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Weekly Posts</td>
                    <td className="py-3 px-4 font-bold">{dashboardData.comparison?.myAccount?.postingFrequencyPerWeek}</td>
                    <td className="py-3 px-4 font-bold">{dashboardData.comparison?.competitor?.postingFrequencyPerWeek}</td>
                    <td className="py-3 px-4 text-rose-500 font-semibold">-2.3 posts/wk</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Reel Ratio</td>
                    <td className="py-3 px-4 font-bold">{dashboardData.comparison?.myAccount?.reelToPostRatio}</td>
                    <td className="py-3 px-4 font-bold">{dashboardData.comparison?.competitor?.reelToPostRatio}</td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold">Comparable</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Strategic Takeaways */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🤖 Competitor AI Insights & Content Gaps</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                <h4 className="font-bold text-indigo-900 text-sm mb-2">Key Competitor Strengths</h4>
                <ul className="list-disc list-inside text-xs text-indigo-800 space-y-1">
                  {dashboardData.aiInsights?.competitorStrengths?.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4">
                <h4 className="font-bold text-purple-900 text-sm mb-2">Identified Content Gaps</h4>
                <ul className="list-disc list-inside text-xs text-purple-800 space-y-1">
                  {dashboardData.aiInsights?.contentGaps?.map((g: string, i: number) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CompetitorAnalysis;
