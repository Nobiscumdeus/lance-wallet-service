
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBalance } from '../api/wallet';
import { useAuth } from '../context/useAuth';
import type { BalanceResponse } from '../types';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch balance when dashboard mounts
    const fetchBalance = async () => {
      try {
        const data = await getBalance();
        setBalance(data);
      } catch {
        setError('Could not load balance');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top nav */}
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="font-bold text-lg text-gray-900">Lance Wallet</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.name}</span>
            <button
              onClick={logout}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Balance card */}
        <div className="bg-primary-600 rounded-2xl p-6 text-white">
          <p className="text-primary-100 text-sm font-medium mb-1">
            Available Balance
          </p>
          {loading ? (
            <div className="h-10 w-40 bg-primary-500 rounded animate-pulse" />
          ) : error ? (
            <p className="text-red-200 text-sm">{error}</p>
          ) : (
            <p className="text-4xl font-bold">
              {balance?.currency}{' '}
              {parseFloat(balance?.balance || '0').toLocaleString('en-NG', {
                minimumFractionDigits: 2,
              })}
            </p>
          )}
          <p className="text-primary-200 text-xs mt-3">
            Wallet ID: {balance?.walletId?.slice(0, 8)}...
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link to="/deposit" className="card hover:shadow-md transition 
                                         flex flex-col items-center py-6 gap-2">
            <div className="w-12 h-12 bg-green-100 rounded-full flex 
                            items-center justify-center text-2xl">
              ↓
            </div>
            <span className="font-medium text-gray-700 text-sm">Deposit</span>
          </Link>

          <Link to="/transfer" className="card hover:shadow-md transition 
                                           flex flex-col items-center py-6 gap-2">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex 
                            items-center justify-center text-2xl">
              →
            </div>
            <span className="font-medium text-gray-700 text-sm">Transfer</span>
          </Link>
        </div>

        {/* Recent transactions link */}
        <div className="card">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">Transactions</h2>
            <Link
              to="/transactions"
              className="text-sm text-primary-600 hover:underline font-medium"
            >
              View all →
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            View your full transaction history
          </p>
        </div>

        {/* User info */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">Account</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="text-gray-800 font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-800">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">User ID</span>
              <span className="text-gray-500 font-mono text-xs">{user?.id}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
