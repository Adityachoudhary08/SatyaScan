import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, deleteHistoryItem } from '../api/api';
import { useAuth } from '../context/AuthContext';

function getTrustColor(score) {
  if (score >= 70) return 'text-green-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

function getVerdictSummary(claims = []) {
  const counts = { True: 0, Supported: 0, False: 0, Contradicted: 0, Unverified: 0, Misleading: 0 };
  claims.forEach((c) => { if (c.verdict in counts) counts[c.verdict]++; });
  const falseCount = counts.False + counts.Contradicted + counts.Misleading;
  const trueCount = counts.True + counts.Supported;
  const unverified = counts.Unverified;
  return `${trueCount} ✓  ${falseCount} ✗  ${unverified} ?`;
}

export default function HistoryPage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [checks, setChecks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    setError('');
    getHistory(page)
      .then(({ data }) => {
        setChecks(data.checks);
        setPagination(data.pagination);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load history'))
      .finally(() => setLoading(false));
  }, [page, isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-center px-4">
        <p className="text-gray-400 mb-4">You need to be logged in to view history.</p>
        <a href="/login" className="text-blue-400 hover:underline">Login →</a>
      </div>
    );
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this check?')) return;
    setDeletingId(id);
    try {
      await deleteHistoryItem(id);
      setChecks((prev) => prev.filter((c) => c._id !== id));
    } catch {
      alert('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClick = (check) => {
    // Reconstruct minimal result shape to pass to ResultsPage
    navigate('/results', {
      state: {
        result: {
          trustScore: check.trustScore,
          aiLikelihood: 100 - check.aiScore,
          sourceCredibility: check.sourceScore,
          language: check.language,
          claims: check.claims.map((c) => ({
            text: c.text,
            verdict: c.verdict,
            sources: c.sources?.map((url) => ({ url })) || [],
          })),
          checkId: check._id,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">History</h1>

        {loading && <p className="text-gray-400">Loading…</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && checks.length === 0 && (
          <div className="text-center text-gray-500 mt-16">
            <p className="mb-2">No checks yet.</p>
            <a href="/analyze" className="text-blue-400 hover:underline">Run your first analysis →</a>
          </div>
        )}

        <div className="space-y-3">
          {checks.map((check) => (
            <div
              key={check._id}
              className="bg-gray-900 border border-gray-700 rounded-xl p-5 hover:border-gray-500 transition cursor-pointer"
              onClick={() => handleClick(check)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded capitalize">
                      {check.inputType}
                    </span>
                    {check.language && check.language !== 'unknown' && (
                      <span className="text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">
                        {check.language.toUpperCase()}
                      </span>
                    )}
                    <span className="text-xs text-gray-600">
                      {new Date(check.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm truncate">
                    {check.originalText?.slice(0, 120)}{check.originalText?.length > 120 ? '…' : ''}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">{getVerdictSummary(check.claims)}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-2xl font-extrabold ${getTrustColor(check.trustScore)}`}>
                    {check.trustScore}
                  </span>
                  <span className="text-xs text-gray-600">Trust</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(check._id); }}
                    disabled={deletingId === check._id}
                    className="text-xs text-red-500 hover:text-red-400 disabled:opacity-50"
                  >
                    {deletingId === check._id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-3 mt-8">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 text-sm bg-gray-800 text-gray-300 rounded disabled:opacity-40 hover:bg-gray-700"
            >
              ← Prev
            </button>
            <span className="text-gray-400 text-sm self-center">
              Page {pagination.page} / {pagination.totalPages}
            </span>
            <button
              disabled={page === pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-sm bg-gray-800 text-gray-300 rounded disabled:opacity-40 hover:bg-gray-700"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
