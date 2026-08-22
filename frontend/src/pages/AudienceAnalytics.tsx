import React, { useState, useEffect } from 'react';

export const AudienceAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAudience();
  }, []);

  const fetchAudience = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/analytics/audience', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Audience error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Audience Demographics & Retention</h2>
        <p className="text-sm text-gray-500">Understand your follower base by age, gender, geographic location, and peak activity windows.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading audience demographics...</div>
      ) : data?.isAvailable === false ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-6 flex items-start gap-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <h4 className="font-bold">Demographic Insights Restricted</h4>
            <p className="text-sm mt-1">{data.message || "Data unavailable for this account."}</p>
          </div>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Age Distribution</h3>
            <div className="space-y-3">
              {Object.entries(data.ageGroups || {}).map(([age, pct]: [string, any]) => (
                <div key={age}>
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span>{age} years</span>
                    <span className="text-indigo-600 font-bold">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Gender Split</h3>
            <div className="space-y-3">
              {Object.entries(data.genderDistribution || {}).map(([gender, pct]: [string, any]) => (
                <div key={gender}>
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span>{gender}</span>
                    <span className="text-purple-600 font-bold">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top Countries</h3>
            <div className="space-y-2">
              {data.topCountries?.map((c: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
                  <span className="font-medium text-gray-800">{c.country}</span>
                  <span className="font-bold text-emerald-600">{c.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top Cities</h3>
            <div className="space-y-2">
              {data.topCities?.map((c: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
                  <span className="font-medium text-gray-800">{c.city}</span>
                  <span className="font-bold text-indigo-600">{c.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AudienceAnalytics;
