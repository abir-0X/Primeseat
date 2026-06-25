import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900/80 sticky top-0 z-40 shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center py-4 gap-4">
                    <Link to="/" className="text-white text-2xl flex items-center gap-2 tracking-tight hover:opacity-90 transition font-logo">
                        <span className="material-symbols-outlined text-indigo-500 text-2xl select-none">confirmation_number</span> Primeseat
                    </Link>
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                        <Link to="/" className="text-zinc-400 hover:text-zinc-100 transition font-medium cursor-pointer">Events</Link>
                        {user ? (
                            <>
                                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="text-zinc-400 hover:text-zinc-100 transition font-medium">Dashboard</Link>
                                {/* From Uiverse.io by Jules-gitclerc */}
                                <button
                                    className="group flex items-center justify-start w-9 h-9 bg-red-600 rounded-full cursor-pointer relative overflow-hidden transition-all duration-200 shadow-lg hover:w-28 hover:rounded-lg active:translate-x-0.5 active:translate-y-0.5"
                                    onClick={handleLogout}
                                >
                                    <div
                                        className="flex items-center justify-center w-full transition-all duration-300 group-hover:justify-start group-hover:px-3"
                                    >
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 512 512" fill="white">
                                            <path
                                                d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
                                            ></path>
                                        </svg>
                                    </div>
                                    <div
                                        className="absolute right-3.5 transform translate-x-full opacity-0 text-white text-sm font-medium transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                                    >
                                        Logout
                                    </div>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-zinc-400 hover:text-zinc-100 transition font-medium">Login</Link>
                                <Link to="/register" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition shadow-md shadow-indigo-500/10">Sign Up</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
