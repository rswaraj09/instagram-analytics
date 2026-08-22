import React, { useState, useEffect } from 'react';

export const HashtagAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHashtags();
  }, []);

  const fetchHashtags = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/analytics/hashtags', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Hashtag Intelligence & Group Management</h2>
        <p className="text-sm text-gray-500">Analyze hashtag performance frequency, engagement yield, saved hashtag sets, and recommended combinations.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading hashtag analytics...</div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Frequently Used Hashtags</h3>
            <div className="space-y-3">
              {data.frequentlyUsed?.map((h: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
                  <span className="font-bold text-indigo-600">{h.hashtag}</span>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-gray-500">{h.count} posts</span>
                    <span className="text-xs font-bold text-emerald-600 ml-2">Avg ER: {h.avgEngagementRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Highest Performing Hashtags</h3>
            <div className="space-y-3">
              {data.highPerforming?.map((h: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
                  <span className="font-bold text-purple-600">{h.hashtag}</span>
                  <span className="text-xs font-bold text-emerald-600">Avg ER: {h.avgEngagementRate}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 md:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recommended Hashtag Suggestions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.recommendedHashtags?.map((r: any, i: number) => (
                <div key={i} className="bg-purple-50/40 border border-purple-100 rounded-xl p-4">
                  <span className="font-extrabold text-purple-700 text-sm">{r.tag}</span>
                  <p className="text-xs text-gray-600 mt-1">{r.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default HashtagAnalytics;
