
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { deposit } from '../api/wallet';

export default function Deposit() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await deposit(parseFloat(amount));
      setSuccess(true);
      // Redirect to dashboard after short delay
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Back link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 
                     hover:text-gray-700 mb-6 gap-1"
        >
          ← Back to dashboard
        </Link>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Deposit Funds</h2>
          <p className="text-sm text-gray-500 mb-6">
            Add money to your wallet
          </p>

          {/* Success state */}
          {success ? (
            <div className="bg-green-50 border border-green-200 text-green-700 
                            px-4 py-4 rounded-lg text-sm text-center">
              ✓ Deposit successful! Redirecting...
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
                  Amount (NGN)
                </label>
                <input
                  type="number"
                  className="input"
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              {/* Quick amount buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[1000, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset.toString())}
                    className="btn-secondary py-2 text-xs"
                  >
                    ₦{preset.toLocaleString()}
                  </button>
                ))}
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Processing...' : 'Deposit funds'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
