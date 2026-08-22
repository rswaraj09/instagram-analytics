import React, { useState, useEffect } from 'react';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmin();
  }, []);

  const fetchAdmin = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/admin/metrics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setMetrics(json);
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
        <h2 className="text-2xl font-bold text-gray-900">System Admin & AI Pipeline Monitor</h2>
        <p className="text-sm text-gray-500">Monitor active users, Meta API usage rate limits, background worker queues, AI model status, and error logs.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading admin metrics...</div>
      ) : metrics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Registered Users</span>
              <div className="text-2xl font-extrabold text-indigo-600 mt-1">{metrics.totalUsers}</div>
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Connected Accounts</span>
              <div className="text-2xl font-extrabold text-purple-600 mt-1">{metrics.connectedInstagramAccounts}</div>
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Analytics API Calls (24h)</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">{metrics.analyticsRequestsToday?.toLocaleString()}</div>
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Model Requests (24h)</span>
              <div className="text-2xl font-extrabold text-amber-500 mt-1">{metrics.aiRequestsToday?.toLocaleString()}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">⚙️ System & Model Health</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-600">AI Microservice Status</span>
                  <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{metrics.aiModelStatus}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-600">Active ML Model Version</span>
                  <span className="font-mono text-xs font-bold text-gray-800">{metrics.activeMlModelVersion}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-600">Dataset Version</span>
                  <span className="font-mono text-xs font-bold text-gray-800">{metrics.datasetVersion}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-600">Meta API Error Rate</span>
                  <span className="font-bold text-emerald-600">{metrics.metaApiErrorRate}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">💳 Subscription Tiers Breakdown</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span>Pro Tier ($29/mo)</span>
                    <span className="text-indigo-600 font-bold">{metrics.subscriptions?.proTier} users</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span>Free Tier</span>
                    <span className="text-purple-600 font-bold">{metrics.subscriptions?.freeTier} users</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AdminDashboard;
