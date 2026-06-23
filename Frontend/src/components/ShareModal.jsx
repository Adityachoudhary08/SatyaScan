import { useState } from 'react';
import { getReportPdfUrl } from '../api/api';

export default function ShareModal({ checkId, onClose }) {
  const shareUrl = `${window.location.origin}/report/${checkId}`;
  const pdfUrl = getReportPdfUrl(checkId);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-lg">Share / Export Report</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        {/* Shareable link */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 block mb-1">Shareable Link</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 bg-gray-800 border border-gray-600 text-gray-300 text-sm rounded px-3 py-2 focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className={`shrink-0 px-4 py-2 rounded text-sm font-medium transition
                ${copied ? 'bg-green-700 text-white' : 'bg-blue-700 hover:bg-blue-600 text-white'}`}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* PDF download */}
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition"
        >
          📄 Download PDF Report
        </a>

        <p className="text-gray-600 text-xs mt-3 text-center">
          This link is public — anyone with it can view the report.
        </p>
      </div>
    </div>
  );
}
