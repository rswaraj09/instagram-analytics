import React, { useState } from 'react';
import { fetchPostMetricsByUrl, fetchProfileByUrl } from '../api/apiClient';
import AccountSelector from '../components/AccountSelector';

interface CombinedData {
  username?: string;
  followersCount?: number;
  followingCount?: number;
  totalPosts?: number;
  likesCount?: number;
  commentsCount?: number;
  viewsCount?: number;
  reach?: number;
  impressions?: number;
  engagementRate?: number;
}

const Posts: React.FC = () => {
  const [profileUrl, setProfileUrl] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [data, setData] = useState<CombinedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setData(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You are not logged in. Please login first.');
      setLoading(false);
      return;
    }

    try {
      let profileData: any = {};
      let postData: any = {};

      // Fetch profile if URL provided
      if (profileUrl) {
        try {
          profileData = await fetchProfileByUrl(profileUrl, token, selectedAccountId);
        } catch (err: any) {
          console.warn('Profile fetch failed:', err);
          throw new Error('Failed to fetch profile: ' + (err.message || 'Unknown error'));
        }
      }

      // Fetch post if URL provided
      if (postUrl) {
        try {
          postData = await fetchPostMetricsByUrl(postUrl, token, selectedAccountId);
        } catch (err: any) {
          console.warn('Post fetch failed:', err);
          throw new Error('Failed to fetch post: ' + (err.message || 'Unknown error'));
        }
      }

      if (!profileUrl && !postUrl) {
        throw new Error('Please provide either a Profile URL or a Post URL.');
      }

      setData({ ...profileData, ...postData });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
          Analyze Profile & Post (Graph API)
        </h2>
        <form onSubmit={handleFetch} className="space-y-6">
          <AccountSelector value={selectedAccountId} onChange={setSelectedAccountId} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instagram Profile URL</label>
              <input
                type="url"
                placeholder="https://www.instagram.com/username/"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instagram Post URL</label>
              <input
                type="url"
                placeholder="https://www.instagram.com/p/SHORTCODE/"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || (!profileUrl && !postUrl)}
            className={`w-full md:w-auto px-8 py-3 rounded-lg font-medium text-white transition-all transform hover:scale-[1.02] ${
              loading || (!profileUrl && !postUrl)
                ? 'bg-purple-300 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? 'Fetching via Graph API...' : 'Fetch Real-Time Analytics'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
            {error}
          </div>
        )}
      </div>

      {data && (
        <div className="space-y-8 animate-fade-in-up">
          {/* Profile Metrics Section */}
          {(data.followersCount != null || data.username) && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                👤 Profile Analytics <span className="text-sm font-normal text-gray-500">@{data.username || 'unknown'}</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <MetricCard title="Followers" value={data.followersCount} icon="👥" color="indigo" />
                <MetricCard title="Following" value={data.followingCount} icon="🤝" color="blue" />
                <MetricCard title="Total Posts" value={data.totalPosts} icon="📸" color="emerald" />
              </div>
            </div>
          )}

          {/* Post Metrics Section */}
          {(data.likesCount != null || data.reach != null) && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                📸 Post Analytics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <MetricCard title="Likes" value={data.likesCount} icon="❤️" color="rose" />
                <MetricCard title="Comments" value={data.commentsCount} icon="💬" color="blue" />
                <MetricCard title="Views" value={data.viewsCount} icon="👁️" color="indigo" />
                <MetricCard title="Reach" value={data.reach} icon="📈" color="emerald" />
                <MetricCard title="Impressions" value={data.impressions} icon="🌟" color="amber" />
                <MetricCard title="Engagement Rate" value={data.engagementRate != null ? `${data.engagementRate}%` : null} icon="🔥" color="orange" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ title, value, icon, color }: { title: string, value: any, icon: string, color: string }) => {
  const colorMap: Record<string, string> = {
    rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  const displayValue = value != null ? (typeof value === 'number' ? value.toLocaleString() : value) : 'N/A';

  return (
    <div className="p-6 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-500 font-medium">{title}</span>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{displayValue}</div>
    </div>
  );
};

export default Posts;
