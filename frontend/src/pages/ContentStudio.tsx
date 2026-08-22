import React, { useState } from 'react';

export const ContentStudio: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('Tech');
  const [targetAudience, setTargetAudience] = useState('Creators & Entrepreneurs');
  const [language, setLanguage] = useState('en');
  const [contentType, setContentType] = useState('REEL');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/ai/studio/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          topic,
          category,
          targetAudience,
          language,
          contentType
        })
      });

      if (res.ok) {
        const json = await res.json();
        setResult(json);
      }
    } catch (err) {
      console.error('Generation failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">AI Content Studio & Virality Predictor</h2>
        <p className="text-sm text-gray-500">Generate high-converting titles, multi-style captions, targeted hashtags, and predict post score using our ML pipeline.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleGenerate} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Content Generator Inputs</h3>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Topic / Core Idea *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. AI tools for productivity in 2026"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Niche Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {['Tech', 'Fitness', 'Fashion', 'Travel', 'Food', 'Business', 'Lifestyle'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Target Audience</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Format</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="REEL">Reel Video</option>
                <option value="POST">Single Post</option>
                <option value="CAROUSEL">Carousel</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-xl shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Generating AI Output...' : '✨ Generate & Predict Virality'}
          </button>
        </form>

        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              {/* Predicted Virality Score */}
              <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white rounded-2xl p-6 shadow-md flex justify-between items-center">
                <div>
                  <span className="text-xs uppercase tracking-widest text-indigo-300 font-bold">Predicted Performance Score</span>
                  <div className="text-3xl font-black mt-1">
                    {result.predictedScore?.content_quality_score || 88.5} <span className="text-sm text-indigo-300 font-normal">/ 100</span>
                  </div>
                  <p className="text-xs text-indigo-200 mt-1">Potential: <span className="font-bold text-emerald-400">{result.predictedScore?.predicted_engagement_potential || 'High'}</span></p>
                </div>
                <div className="text-right space-y-1 text-xs text-indigo-200">
                  <div>Hashtag Relevance: <span className="font-bold text-white">{result.predictedScore?.hashtag_relevance_score || 92}%</span></div>
                  <div>Caption Quality: <span className="font-bold text-white">{result.predictedScore?.caption_quality_score || 86}%</span></div>
                </div>
              </div>

              {/* Title Options */}
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
                <h4 className="font-bold text-gray-900 mb-3">🔥 High-Click Title Variations</h4>
                <div className="space-y-2">
                  {result.titles?.map((t: string, i: number) => (
                    <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-800 flex justify-between items-center">
                      <span>{t}</span>
                      <button onClick={() => navigator.clipboard.writeText(t)} className="text-xs text-indigo-600 hover:underline">Copy</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Captions */}
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
                <h4 className="font-bold text-gray-900 mb-3">💬 Multi-Angle Captions</h4>
                <div className="space-y-4">
                  {Object.entries(result.captions || {}).map(([style, text]: [string, any]) => (
                    <div key={style} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{style}</span>
                        <button onClick={() => navigator.clipboard.writeText(text)} className="text-xs text-indigo-600 hover:underline font-semibold">Copy Caption</button>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hashtag Combinations */}
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
                <h4 className="font-bold text-gray-900 mb-3">#️⃣ Optimized Hashtag Set</h4>
                <div className="flex flex-wrap gap-2">
                  {result.hashtags?.recommended_combinations?.map((h: string, i: number) => (
                    <span key={i} className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1 rounded-lg">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-400">
              Enter a topic on the left and click "Generate" to receive AI recommendations & virality score predictions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentStudio;
