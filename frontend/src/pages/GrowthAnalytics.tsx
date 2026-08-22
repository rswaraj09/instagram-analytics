import React, { useState, useEffect } from 'react';

export const GrowthAnalytics: React.FC = () => {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchGrowthData(days);
  }, [days]);

  const fetchGrowthData = async (d: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/analytics/growth?days=${d}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load growth analytics', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Growth & Follower Intelligence</h2>
          <p className="text-sm text-gray-500">Track historical growth trends, follower gain/loss rates, and milestone forecasts.</p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                days === d ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading growth analytics...</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Followers</span>
              <div className="text-2xl font-extrabold text-gray-900 mt-1">{data.currentFollowers?.toLocaleString()}</div>
              <span className="inline-block mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                +{data.growthPercentage}% in last {days}d
              </span>
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Followers Gained</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">+{data.followersGained?.toLocaleString()}</div>
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Followers Lost</span>
              <div className="text-2xl font-extrabold text-rose-500 mt-1">-{data.followersLost?.toLocaleString()}</div>
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Net Growth</span>
              <div className="text-2xl font-extrabold text-indigo-600 mt-1">+{data.netGrowth?.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Historical Growth Timeline</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Followers</th>
                    <th className="py-3 px-4 text-emerald-600">Gained</th>
                    <th className="py-3 px-4 text-rose-500">Lost</th>
                    <th className="py-3 px-4">Net Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.timeline?.slice(0, 10).map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-medium text-gray-900">{row.date}</td>
                      <td className="py-3 px-4">{row.followers?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-emerald-600 font-semibold">+{row.gained}</td>
                      <td className="py-3 px-4 text-rose-500 font-semibold">-{row.lost}</td>
                      <td className="py-3 px-4 font-bold text-indigo-600">+{row.netChange}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default GrowthAnalytics;
