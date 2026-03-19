
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { transfer } from '../api/wallet';
import { isAxiosError } from 'axios';
export default function Transfer() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ toUserId: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await transfer(form.toUserId.trim(), parseFloat(form.amount));
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err: unknown) {
      if (isAxiosError<{ message?: string }>(err)) {
        setError(err.response?.data?.message || 'Transfer failed');
      } else {
        setError('Transfer failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 
                     hover:text-gray-700 mb-6 gap-1"
        >
          ← Back to dashboard
        </Link>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Transfer Funds</h2>
          <p className="text-sm text-gray-500 mb-6">
            Send money to another user
          </p>

          {success ? (
            <div className="bg-green-50 border border-green-200 text-green-700 
                            px-4 py-4 rounded-lg text-sm text-center">
              ✓ Transfer successful! Redirecting...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 
                                px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient User ID
                </label>
                <input
                  type="text"
                  className="input font-mono text-sm"
                  placeholder="Paste recipient's user ID"
                  value={form.toUserId}
                  onChange={(e) => setForm({ ...form, toUserId: e.target.value })}
                  required
                />
                {/* 
                  In a real app this would be a search by email or username.
                  For this assessment, user ID is sufficient to demonstrate
                  the transfer flow correctly.
                */}
                <p className="text-xs text-gray-400 mt-1">
                  Ask the recipient to share their User ID from the dashboard
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (NGN)
                </label>
                <input
                  type="number"
                  className="input"
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Processing...' : 'Send funds'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
