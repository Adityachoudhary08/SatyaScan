import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReport } from '../api/api';

function getTrustColor(score) {
  if (score >= 70) return '#22c55e';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function getVerdictColor(verdict) {
  const map = { True: '#22c55e', Supported: '#22c55e', False: '#ef4444', Contradicted: '#ef4444', Misleading: '#f97316', Unverified: '#6b7280', 'Partially True': '#f59e0b' };
  return map[verdict] || '#6b7280';
}

export default function ReportPage() {
  const { id } = useParams();
  const [check, setCheck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getReport(id)
      .then(({ data }) => setCheck(data))
      .catch((err) => setError(err.response?.data?.message || 'Report not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-center px-4">
      <p className="text-red-400 mb-4">{error}</p>
      <Link to="/" className="text-blue-400 hover:underline">← Home</Link>
    </div>
  );

  const pdfUrl = `/api/report/${id}?format=pdf`;

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Shared Report</h1>
            <p className="text-gray-500 text-sm">{new Date(check.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="text-sm border border-gray-600 text-gray-300 px-3 py-2 rounded-lg hover:border-gray-400 transition">
              ← Home
            </Link>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-blue-700 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition"
            >
              Download PDF
            </a>
          </div>
        </div>

        {/* Scores */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-5">
          <h2 className="text-white font-semibold mb-3">Scores</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Trust Score', value: check.trustScore },
              { label: 'AI Score', value: check.aiScore },
              { label: 'Source Trust', value: check.sourceScore },
            ].map((s) => (
              <div key={s.label} className="bg-gray-800 rounded-lg p-4">
                <div className="text-2xl font-bold" style={{ color: getTrustColor(s.value) }}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Meta */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-5">
          <div className="flex gap-4 text-sm flex-wrap">
            <span className="text-gray-400">Input: <span className="text-white capitalize">{check.inputType}</span></span>
            <span className="text-gray-400">Language: <span className="text-white uppercase">{check.language}</span></span>
            <span className="text-gray-400">Claims: <span className="text-white">{check.claims?.length}</span></span>
          </div>
        </div>

        {/* Original text */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-5">
          <h2 className="text-white font-semibold mb-2">Original Content</h2>
          <p className="text-gray-400 text-sm whitespace-pre-wrap line-clamp-6">{check.originalText}</p>
        </div>

        {/* Claims */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-3">Claims</h2>
          <div className="space-y-3">
            {check.claims?.map((claim, i) => (
              <div key={i} className="border border-gray-700 rounded-lg p-4">
                <p className="text-gray-200 text-sm mb-2">{claim.text}</p>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: getVerdictColor(claim.verdict) + '33', color: getVerdictColor(claim.verdict) }}
                >
                  {claim.verdict}
                </span>
                {claim.sources?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Sources:</p>
                    {claim.sources.map((s, j) => (
                      <a key={j} href={s} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-400 hover:underline truncate">
                        {s}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
