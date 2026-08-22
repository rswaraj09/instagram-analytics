import React, { useState, useEffect } from 'react';

export const ReelAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/analytics/reels', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Reels error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Short-Form Reels Analytics</h2>
        <p className="text-sm text-gray-500">Track video views, plays, watch time retention, virality score, and best performing short-form content.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading Reels metrics...</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Plays & Views</span>
              <div className="text-2xl font-extrabold text-indigo-600 mt-1">{data.totalPlays?.toLocaleString()}</div>
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Reel Shares</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">+{data.totalShares?.toLocaleString()}</div>
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg Engagement Rate</span>
              <div className="text-2xl font-extrabold text-purple-600 mt-1">{data.averageEngagementRate?.toFixed(2)}%</div>
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg Watch Time</span>
              <div className="text-2xl font-extrabold text-amber-500 mt-1">{data.avgWatchTimeSec} sec</div>
            </div>
          </div>

          {data.bestPerformingReel && (
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl p-6 shadow-md">
              <span className="text-xs font-extrabold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">🏆 Top Performing Reel</span>
              <div className="mt-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold">{data.bestPerformingReel.caption || 'Top Reel Video'}</h3>
                  <p className="text-xs text-white/80 mt-1">Published: {data.bestPerformingReel.timestamp}</p>
                </div>
                <div className="flex gap-4 text-center">
                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <div className="text-lg font-black">{data.bestPerformingReel.videoViews?.toLocaleString()}</div>
                    <div className="text-[10px] uppercase text-white/80">Views</div>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <div className="text-lg font-black">{data.bestPerformingReel.likeCount?.toLocaleString()}</div>
                    <div className="text-[10px] uppercase text-white/80">Likes</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reels Library</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.reels?.map((reel: any, i: number) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="text-xs font-semibold text-indigo-600 mb-1">Reel #{i+1}</div>
                  <p className="text-sm font-medium text-gray-800 line-clamp-2">{reel.caption || 'Untitled Reel'}</p>
                  <div className="mt-4 flex justify-between text-xs text-gray-500 font-semibold border-t border-gray-50 pt-2">
                    <span>👁️ {reel.videoViews || 0}</span>
                    <span>❤️ {reel.likeCount || 0}</span>
                    <span>💬 {reel.commentsCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ReelAnalytics;
