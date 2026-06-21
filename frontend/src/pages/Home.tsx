import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  { icon: '\u{1F4CA}', title: 'Real-time Metrics', desc: 'Likes, comments, reach and impressions pulled straight from the Instagram Graph API.' },
  { icon: '\u{1F510}', title: 'Secure Credentials', desc: 'Your app secrets and access tokens are encrypted at rest with AES-256-GCM.' },
  { icon: '\u{1F4C8}', title: 'Spreadsheet Dashboard', desc: 'Track every monitored profile and post in one sortable, exportable grid.' },
  { icon: '\u26A1', title: 'Live Updates', desc: 'WebSocket streaming keeps your analytics fresh without refreshing the page.' },
];

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
          Instagram Analytics
        </h1>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors">
            Log in
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md transition-all"
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-white/70 backdrop-blur text-purple-700 border border-purple-200 mb-6">
          Instagram Post Analytics Dashboard
        </span>
        <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
          Understand your{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
            Instagram performance
          </span>
        </h2>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Connect your Instagram business accounts and analyze posts with authoritative Graph API
          metrics \u2014 securely, in real time, all in one professional dashboard.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            to="/signup"
            className="px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
          >
            Create your account
          </Link>
          <Link
            to="/login"
            className="px-8 py-3.5 rounded-xl font-semibold text-gray-700 bg-white/80 backdrop-blur border border-gray-200 hover:bg-white transition-all"
          >
            I already have one
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl bg-white/70 backdrop-blur border border-white/60 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-100 to-indigo-100 flex items-center justify-center text-2xl mb-4">
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-200/60 py-8 text-center text-sm text-gray-400">
        Instagram Post Analytics Dashboard
      </footer>
    </div>
  );
};

export default Home;
