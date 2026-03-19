import { useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { login as loginApi} from '../api/auth';
import { useAuth } from '../context/useAuth';
import { isAxiosError } from 'axios';

export default function Login(){
    const navigate = useNavigate();
    const {login} = useAuth();
    const [ form, setForm] = useState({ email:'',password:''}
    );
    const [ error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async(e:React.FormEvent) =>{
        e.preventDefault();
        setError('');
        setLoading(true);

        try{
            const data = await loginApi(form.email,form.password);
            //Passing only the user - cookie is set automatically bybrowser
            login(data.user);
            navigate('/dashboard');
        }catch(err: unknown){
            if (isAxiosError<{ message?: string }>(err)) {
                setError(err.response?.data?.message || 'Login failed');
            } else {
                setError('Login failed');
            }
        }finally{
            setLoading(false);
        }
    }

    return(
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                     <h1 className="text-3xl font-bold text-gray-900">Lance Wallet</h1>
          <p className="text-gray-500 mt-2 text-sm">Sign in to your account</p>
           </div>
           <div className="card">
            <form onSubmit={handleSubmit} className="space-y-4">
                 {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )} 
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
             <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>


            </form>
             <p className="text-center text-sm text-gray-500 mt-4">
            No account?{' '}
            <Link to="/register" className="text-primary-600 hover:underline font-medium">
              Create one
            </Link>
          </p>

            
             </div>
                </div>
            </div>
    )
}