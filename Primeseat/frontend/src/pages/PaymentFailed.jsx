import React from 'react';
import { Link } from 'react-router-dom';

const PaymentFailed = () => {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-3xl shadow-2xl shadow-red-500/5 max-w-md w-full text-center border-t-8 border-t-red-500 transform transition-all hover:-translate-y-1">
                <span className="material-symbols-outlined text-red-500 text-7xl mx-auto mb-6 block select-none">cancel</span>
                <h1 className="text-4xl font-black text-zinc-100 mb-4">Booking Failed</h1>
                <p className="text-zinc-400 mb-8 text-lg">We couldn't process your payment. Please ensure your payment details are correct and try again.</p>
                <div className="space-y-4">
                    <Link to="/" className="block w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg shadow-red-950/40">
                        Return to Events
                    </Link>
                    <Link to="/dashboard" className="block w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-4 px-6 rounded-xl transition">
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentFailed;
