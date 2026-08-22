import React, { useState, useEffect } from 'react';

export const ContentCalendar: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [mediaType, setMediaType] = useState('REEL');
  const [scheduledDate, setScheduledDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCalendar();
  }, []);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/calendar', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setItems(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          caption,
          mediaType,
          scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : new Date().toISOString(),
          status: 'SCHEDULED'
        })
      });
      if (res.ok) {
        setTitle('');
        setCaption('');
        fetchCalendar();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8080/api/calendar/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCalendar();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Content Calendar & Scheduling</h2>
        <p className="text-sm text-gray-500">Plan ahead, organize Reel drafts, schedule posts, and align your publishing timeline.</p>
      </div>

      {/* Add New Calendar Event */}
      <form onSubmit={handleAddItem} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Schedule Content Post / Reel</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Content Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 5 AI tools every developer needs"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Type</label>
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="REEL">Reel Video</option>
              <option value="POST">Single Post</option>
              <option value="STORY">Story</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Scheduled Date & Time</label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Caption Preview</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            placeholder="Optional caption preview..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          ></textarea>
        </div>
        <button
          type="submit"
          className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm hover:bg-indigo-700 transition-all cursor-pointer"
        >
          + Add to Schedule
        </button>
      </form>

      {/* Calendar List */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Scheduled & Planned Queue</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading schedule...</div>
        ) : items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">{item.mediaType}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      item.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 mt-1">{item.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Scheduled for: {new Date(item.scheduledDate).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-xs text-rose-500 font-semibold hover:underline"
                >
                  Cancel / Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">No scheduled content items yet.</div>
        )}
      </div>
    </div>
  );
};

export default ContentCalendar;
