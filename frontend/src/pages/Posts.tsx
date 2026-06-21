import React, { useState, useEffect } from 'react';
import { fetchPostMetrics, fetchProfiles } from '../api/apiClient';
import AccountSelector from '../components/AccountSelector';
import { useWebSocket } from '../hooks/useWebSocket';

interface Metrics {
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  reach: number;
  impressions: number;
  engagementRate: number;
  isEstimated: boolean;
}

interface Profile {
  id: string;
  username: string;
  category: string;
}

const Posts: React.FC = () => {
  const [postUrl, setPostUrl] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfiles = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const data = await fetchProfiles(token);
        const list = data.content || [];
        setProfiles(list);
        if (list.length > 0) {
          setProfileId(list[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load profiles:', err);
      }
    };
    loadProfiles();
  }, []);

  // Determine the STOMP destination based on the active post ID
  const wsDestination = activePostId ? `/topic/metrics/${activePostId}` : null;

  // Listen to WebSocket messages for the current post metrics
  const { connected: wsConnected } = useWebSocket(wsDestination, (updatedMetrics) => {
    console.info('Received live metrics update via WebSocket:', updatedMetrics);
    setMetrics(updatedMetrics);
  });

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMetrics(null);
    setActivePostId(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You are not logged in. Please login first.');
      setLoading(false);
      return;
    }

    try {
      const data = await fetchPostMetrics(postUrl, profileId, token, selectedAccountId);
      setMetrics(data.metrics);
      if (data.post && data.post.id) {
        setActivePostId(data.post.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch metrics. Make sure the backend is running and the profile ID is valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
          Analyze Instagram Post
        </h2>
        <form onSubmit={handleFetch} className="space-y-6">
              <AccountSelector value={selectedAccountId} onChange={setSelectedAccountId} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instagram Post URL</label>
              <input
                type="url"
                required
                placeholder="https://www.instagram.com/p/SHORTCODE/"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instagram Profile</label>
              {profiles.length > 0 ? (
                <select
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      @{p.username} ({p.category || 'No Category'})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  placeholder="Profile UUID"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                />
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full md:w-auto px-8 py-3 rounded-lg font-medium text-white transition-all transform hover:scale-[1.02] ${
              loading 
                ? 'bg-purple-300 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? 'Analyzing...' : 'Fetch Real-Time Analytics'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
            {error}
          </div>
        )}
      </div>

      {metrics && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in-up">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-900">Performance Metrics</h3>
              {wsConnected && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Live
                </span>
              )}
            </div>
            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide ${
              metrics.isEstimated 
                ? 'bg-amber-100 text-amber-800' 
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {metrics.isEstimated ? 'Estimated (Scraped)' : 'Authoritative (Graph API)'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <MetricCard title="Likes" value={metrics.likesCount != null ? metrics.likesCount.toLocaleString() : 'N/A'} icon="❤️" color="rose" />
            <MetricCard title="Comments" value={metrics.commentsCount != null ? metrics.commentsCount.toLocaleString() : 'N/A'} icon="💬" color="blue" />
            <MetricCard title="Views" value={metrics.viewsCount != null ? metrics.viewsCount.toLocaleString() : 'N/A'} icon="👁️" color="indigo" />
            <MetricCard title="Reach" value={metrics.reach != null ? metrics.reach.toLocaleString() : 'N/A'} icon="📈" color="emerald" />
            <MetricCard title="Impressions" value={metrics.impressions != null ? metrics.impressions.toLocaleString() : 'N/A'} icon="🌟" color="amber" />
            <MetricCard title="Engagement Rate" value={metrics.engagementRate != null ? `${metrics.engagementRate}%` : 'N/A'} icon="🔥" color="orange" />
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: string, color: string }) => {
  const colorMap: Record<string, string> = {
    rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="p-6 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-500 font-medium">{title}</span>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
};

export default Posts;
