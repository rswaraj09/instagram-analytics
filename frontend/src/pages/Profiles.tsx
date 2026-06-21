import React, { useState, useEffect } from 'react';
import { fetchProfiles, createProfile, deleteProfile } from '../api/apiClient';
import AccountSelector from '../components/AccountSelector';

interface Profile {
  id: string;
  username: string;
  profileUrl: string;
  category: string;
  followersCount: number | null;
  followingCount: number | null;
  totalPosts: number | null;
  isBusinessAccount: boolean;
}

const Profiles: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [username, setUsername] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [category, setCategory] = useState('');
  const [graphApiToken, setGraphApiToken] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadProfiles = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You are not logged in. Please login first.');
      setLoading(false);
      return;
    }
    try {
      const data = await fetchProfiles(token);
      setProfiles(data.content || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You are not logged in. Please login first.');
      setSubmitLoading(false);
      return;
    }

    try {
      // Clean up username to exclude '@' prefix if typed
      const cleanUsername = username.trim().startsWith('@') 
        ? username.trim().substring(1) 
        : username.trim();

      // Formulate url if empty
      const cleanUrl = profileUrl.trim() || `https://www.instagram.com/${cleanUsername}/`;

      await createProfile(cleanUsername, cleanUrl, category.trim(), graphApiToken.trim(), token, selectedAccountId);
      
      setSuccess(`Profile @${cleanUsername} added successfully!`);
      setUsername('');
      setProfileUrl('');
      setCategory('');
      setGraphApiToken('');
      loadProfiles(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Failed to add profile.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteProfile = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete profile @${name}?`)) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You are not logged in. Please login first.');
      return;
    }

    try {
      await deleteProfile(id, token);
      setSuccess(`Profile @${name} deleted successfully!`);
      loadProfiles();
    } catch (err: any) {
      setError(err.message || 'Failed to delete profile.');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Instagram Profiles</h1>
          <p className="text-gray-500 mt-1">Manage and monitor target Instagram creator or business profiles</p>
        </div>
      </div>

      {/* Grid Layout: Add Profile Form & List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Add Profile Panel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-950">Add Profile</h2>
            <p className="text-sm text-gray-400 mt-1">Register a new profile for monitoring</p>
          </div>
          
          <form onSubmit={handleAddProfile} className="space-y-4">
            <AccountSelector value={selectedAccountId} onChange={setSelectedAccountId} />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
              <input
                type="text"
                required
                placeholder="e.g., raysedutech"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Profile URL (Optional)</label>
              <input
                type="url"
                placeholder="https://www.instagram.com/raysedutech/"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              <input
                type="text"
                placeholder="e.g., Education, Tech, Fitness"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Graph API Access Token (Optional)</label>
              <input
                type="password"
                placeholder="Required for business insights only"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                value={graphApiToken}
                onChange={(e) => setGraphApiToken(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className={`w-full py-2.5 rounded-lg font-semibold text-white transition-all transform hover:scale-[1.01] ${
                submitLoading
                  ? 'bg-purple-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md'
              }`}
            >
              {submitLoading ? 'Saving Profile...' : 'Save Profile'}
            </button>
          </form>

          {/* Feedback messages inside side panel */}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border-l-4 border-red-500">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm border-l-4 border-emerald-500">
              {success}
            </div>
          )}
        </div>

        {/* Right: Profiles List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-950 mb-4">Monitored Profiles</h2>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No profiles registered yet. Use the side panel to add your first profile.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-sm font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Profile</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Followers</th>
                      <th className="py-3 px-4 text-right">Posts</th>
                      <th className="py-3 px-4 text-center">Type</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((p) => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-100 to-indigo-100 text-purple-600 flex items-center justify-center font-bold">
                              {p.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <a 
                                href={p.profileUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                              >
                                @{p.username}
                              </a>
                              <div className="text-xs text-gray-400">ID: {p.id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            {p.category || 'Creator'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-gray-900">
                          {p.followersCount != null ? p.followersCount.toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-gray-900">
                          {p.totalPosts != null ? p.totalPosts.toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            p.isBusinessAccount 
                              ? 'bg-purple-50 text-purple-600 border border-purple-200' 
                              : 'bg-orange-50 text-orange-600 border border-orange-200'
                          }`}>
                            {p.isBusinessAccount ? 'Business' : 'Public'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleDeleteProfile(p.id, p.username)}
                            className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                          >
                            Delete
                          </button>
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
    </div>
  );
};

export default Profiles;
