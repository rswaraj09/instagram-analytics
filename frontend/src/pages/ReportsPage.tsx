import React, { useState } from 'react';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('WEEKLY');
  const [format, setFormat] = useState('PDF');
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/reports/download?reportType=${reportType}&format=${format}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `instagram-${reportType.toLowerCase()}-report.${format.toLowerCase() === 'excel' ? 'xlsx' : format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e) {
      console.error('Download failed', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics Reports & Data Export</h2>
        <p className="text-sm text-gray-500">Generate executive PDF reports, CSV raw exports, or formatted Excel workbooks for team sharing and client presentation.</p>
      </div>

      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 max-w-xl space-y-6">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Report Type</label>
          <div className="grid grid-cols-3 gap-2">
            {['DAILY', 'WEEKLY', 'MONTHLY'].map(t => (
              <button
                key={t}
                onClick={() => setReportType(t)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  reportType === t ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Export Format</label>
          <div className="grid grid-cols-3 gap-2">
            {['PDF', 'CSV', 'EXCEL'].map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  format === f ? 'border-purple-600 bg-purple-50 text-purple-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f} Format
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-xl shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all cursor-pointer disabled:opacity-50"
        >
          {downloading ? 'Generating File...' : `📥 Download ${reportType} Report (${format})`}
        </button>
      </div>
    </div>
  );
};

export default ReportsPage;
