
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTransactions } from '../api/wallet';
import type { Transaction } from '../types';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getTransactions(page);
        setTransactions(data.transactions);
        setTotalPages(data.pagination.pages);
      } catch {
        setError('Could not load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [page]); // re-fetch when page changes

  return (
    <div className="min-h-screen bg-gray-50">

      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link
            to="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </Link>
          <h1 className="font-bold text-gray-900">Transaction History</h1>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">

        {loading && (
          [...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded" />
              </div>
            </div>
          ))
        )}

        {error && (
          <div className="card text-center text-red-500 text-sm">{error}</div>
        )}

        {!loading && transactions.length === 0 && (
          <div className="card text-center text-gray-400 py-10">
            No transactions yet
          </div>
        )}

        {/* Transaction list */}
        {!loading && transactions.map((entry) => {

          // Find the other party in this transaction.
          // A transaction has two ledger entries — one for each side.
          // The "other" entry is the one that doesn't belong to the current wallet.
         const otherEntry = entry.transaction.ledgerEntries?.find(
  (e: NonNullable<Transaction['transaction']['ledgerEntries']>[number]) => 
    e.walletId !== entry.walletId
);
          const otherUser = otherEntry?.wallet?.user;

          // Label depends on direction:
          // credit = someone sent us money = "From: their name"
          // debit  = we sent someone money = "To: their name"
          const partyLabel = entry.type === 'credit' ? 'From' : 'To';
          const partyName = otherUser?.name || otherUser?.email || null;

          return (
            <div key={entry.id} className="card">
              <div className="flex justify-between items-start">

                <div className="flex items-center gap-3">
                  {/* Credit = green arrow in, debit = red arrow out */}
                  <div className={`w-10 h-10 rounded-full flex items-center 
                                  justify-center text-lg font-bold
                                  ${entry.type === 'credit'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-red-100 text-red-500'}`}>
                    {entry.type === 'credit' ? '↓' : '↑'}
                  </div>

                  <div>
                    {/* Show deposit or transfer label */}
                    <p className="font-medium text-gray-800 text-sm capitalize">
                      {entry.transaction.type}
                    </p>

                    {/* Show other party name for transfers only */}
                    {entry.transaction.type === 'transfer' && partyName && (
                      <p className="text-xs text-primary-600 font-medium">
                        {partyLabel}: {partyName}
                      </p>
                    )}

                    {/* Deposits have no other party */}
                    {entry.transaction.type === 'deposit' && (
                      <p className="text-xs text-gray-400">
                        Cash deposit
                      </p>
                    )}

                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(entry.createdAt).toLocaleString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-semibold text-sm
                                ${entry.type === 'credit'
                                  ? 'text-green-600'
                                  : 'text-red-500'}`}>
                    {entry.type === 'credit' ? '+' : '-'}
                    ₦{parseFloat(entry.amount).toLocaleString('en-NG', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  {/* Status badge */}
                  <span className={`text-xs px-2 py-0.5 rounded-full
                                   ${entry.transaction.status === 'completed'
                                     ? 'bg-green-50 text-green-600'
                                     : entry.transaction.status === 'failed'
                                     ? 'bg-red-50 text-red-500'
                                     : 'bg-yellow-50 text-yellow-600'}`}>
                    {entry.transaction.status}
                  </span>
                </div>

              </div>
            </div>
          );
        })}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary w-auto px-6 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500 self-center">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary w-auto px-6 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
