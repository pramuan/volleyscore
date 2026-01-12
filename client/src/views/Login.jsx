import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, User } from 'lucide-react';
import volleyballIcon from '../assets/volleyball_48.png';
import pb from '../lib/pocketbase';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (pb.authStore.isValid) {
            navigate('/management', { replace: true });
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await pb.collection('users').authWithPassword(email, password);
            toast.success('Welcome back!');
            navigate('/management', { replace: true });
        } catch (error) {
            console.error(error);
            toast.error('Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-blue-600 p-8 text-center">
                    <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <img src={volleyballIcon} alt="Logo" className="w-10 h-10 object-contain" />
                    </div>
                    <h1 className="text-white text-2xl font-bold">VolleyScore Management</h1>
                </div>

                <form onSubmit={handleLogin} className="p-8 flex flex-col gap-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                placeholder="Enter your email"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="mt-2 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex justify-center"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="px-8 pb-6 text-center">
                    <p className="text-xs text-gray-400">
                        Restricted access for staff only.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 py-4 text-center">
                <p className="text-slate-400 text-xs font-medium">
                    Powered by 3PT Live Streaming
                </p>
            </footer>
        </div>
    );
}

export default Login;
