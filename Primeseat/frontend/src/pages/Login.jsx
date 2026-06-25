import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, verifyOTP } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (!showOTP) {
                const data = await login(email, password);
                if (data.role === 'admin') navigate('/admin');
                else navigate('/dashboard');
            } else {
                const data = await verifyOTP(email, otp);
                if (data.role === 'admin') navigate('/admin');
                else navigate('/dashboard');
            }
        } catch (err) {
            if (err.needsVerification) {
                setShowOTP(true);
                setError('Account not verified. A new OTP has been sent to your email.');
            } else {
                setError(err.message || err);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 bg-zinc-900 p-8 rounded-3xl shadow-xl border border-zinc-800">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-zinc-100 mb-2">Welcome Back</h2>
                <p className="text-zinc-400 text-sm">Sign in to your Primeseat account</p>
            </div>

            {error && <div className="bg-red-950/20 text-red-400 border border-red-900/30 p-3 rounded-xl mb-6 text-center text-sm font-medium">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
                {!showOTP ? (
                    <>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Email Address</label>
                            <input
                                type="email"
                                required
                                placeholder="email@example.com"
                                className="w-full px-4 py-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm shadow-inner"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Password</label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full px-4 py-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm shadow-inner"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Verification Code (OTP)</label>
                        <input
                            type="text"
                            required
                            placeholder="6-digit code"
                            className="w-full px-4 py-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-650 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-bold tracking-widest text-center text-lg shadow-inner"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength="6"
                        />
                    </div>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-500/10 mt-6"
                >
                    {loading ? 'Processing...' : (showOTP ? 'Verify OTP & Log In' : 'Sign In')}
                </button>
            </form>

            <p className="text-center mt-8 text-zinc-400 text-sm">
                Don't have an account? <Link to="/register" className="text-indigo-400 font-bold hover:underline">Sign up</Link>
            </p>
        </div>
    );
};

export default Login;
