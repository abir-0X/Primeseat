import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { Link, useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';

/**
 * UserDashboard View Component
 * 
 * Displays the authenticated client's booking requests, including statuses 
 * (pending, confirmed, cancelled, rejected) and payment states (paid, not_paid).
 * Includes an option to self-cancel pending booking requests.
 */
const UserDashboard = () => {
    // Auth context session state
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Local dashboard states
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Enforce dashboard route guards
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchBookings();
    }, [user, navigate]);

    /**
     * Query User Booking Records
     */
    const fetchBookings = async () => {
        try {
            const { data } = await api.get('/bookings/my');
            setBookings(data);
        } catch (error) {
            console.error('Error fetching bookings', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Cancel Booking Request
     * 
     * Releases seat holds if the booking was confirmed and updates status to cancelled.
     * @param {string} id Booking record ID
     */
    const cancelBooking = async (id) => {
        if (window.confirm('Are you sure you want to cancel this booking request?')) {
            try {
                await api.delete(`/bookings/${id}`);
                // Refresh local listings
                fetchBookings();
            } catch (error) {
                alert(error.response?.data?.message || 'Error cancelling booking');
            }
        }
    };

    if (loading) return <Loading message="Loading dashboard..." />;

    return (
        <div className="max-w-6xl mx-auto">
            {/* User Greeting Block */}
            <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 mb-8 border border-zinc-800 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl"></div>
                <div className="w-20 h-20 bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-full flex items-center justify-center text-3xl font-extrabold uppercase tracking-widest shrink-0 shadow-md">
                    {user?.name.charAt(0)}
                </div>
                <div className="flex flex-col items-center sm:items-start z-10">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 mb-2">Welcome, {user?.name}!</h1>
                    <p className="text-zinc-400 text-sm flex items-center justify-center sm:justify-start gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20"></span> User Dashboard
                    </p>
                </div>
            </div>

            {/* Bookings Section Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2 sm:gap-3">
                    <span className="material-symbols-outlined text-zinc-500 text-2xl align-middle select-none">confirmation_number</span> My Booking Requests
                </h2>
            </div>

            {/* Bookings Grid viewport */}
            {bookings.length === 0 ? (
                <div className="bg-zinc-900 rounded-3xl p-16 text-center border border-zinc-800 shadow-md">
                    <div className="p-5 text-zinc-655 flex items-center justify-center mx-auto mb-4 select-none">
                        <span className="material-symbols-outlined text-[48px]">confirmation_number</span>
                    </div>
                    <h3 className="text-xl text-zinc-200 font-bold mb-2">No bookings yet</h3>
                    <p className="text-zinc-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">You haven't requested any tickets yet. Explore active events and register today!</p>
                    <Link to="/" className="inline-block bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-indigo-500/10">
                        Browse Events
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookings.map((booking) => (
                        <div key={booking._id} className="bg-zinc-900 rounded-3xl overflow-hidden shadow-sm border border-zinc-800/80 hover:border-zinc-700/80 hover:shadow-lg hover:shadow-indigo-500/5 transition duration-300 flex flex-col">
                            <div className="p-6 flex-grow">
                                {booking.eventId ? (
                                    <>
                                        {/* Event title and status tags */}
                                        <div className="flex justify-between items-start mb-4 gap-4">
                                            <h3 className="text-lg font-bold text-zinc-100 leading-tight">{booking.eventId.title}</h3>
                                            <div className="flex flex-col gap-1.5 items-end shrink-0">
                                                {/* Independent reservation status badge */}
                                                <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-wider border ${
                                                    booking.status === 'confirmed' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' :
                                                    booking.status === 'cancelled' ? 'bg-red-950/40 text-red-400 border-red-900/30' :
                                                    booking.status === 'rejected' ? 'bg-red-950/40 text-red-400 border-red-900/30' :
                                                    'bg-amber-950/40 text-amber-400 border-amber-900/30'
                                                }`}>
                                                    {booking.status}
                                                </span>
                                                {/* Independent payment status badge */}
                                                {booking.status !== 'cancelled' && (
                                                    <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-wider border ${
                                                        booking.paymentStatus === 'paid' ? 'bg-blue-950/40 text-blue-400 border-blue-900/30' : 
                                                        'bg-zinc-850 text-zinc-400 border-zinc-700/50'
                                                    }`}>
                                                        {booking.paymentStatus.replace('_', ' ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Structured Details Info box */}
                                        <div className="text-sm text-zinc-400 mb-2 space-y-1.5 bg-zinc-950/30 p-3 rounded-2xl border border-zinc-850">
                                            <p className="flex justify-between"><span className="text-zinc-550 font-bold uppercase text-[10px]">Date:</span> <span className="font-semibold text-zinc-300">{new Date(booking.eventId.date).toLocaleDateString()}</span></p>
                                            <p className="flex justify-between"><span className="text-zinc-550 font-bold uppercase text-[10px]">Amount:</span> <span className={`font-bold ${booking.amount === 0 ? 'text-emerald-400' : 'text-zinc-200'}`}>{booking.amount === 0 ? 'Free' : `₹${booking.amount}`}</span></p>
                                            <p className="flex justify-between"><span className="text-zinc-550 font-bold uppercase text-[10px]">Requested:</span> <span className="text-zinc-300">{new Date(booking.bookedAt || booking.createdAt).toLocaleDateString()}</span></p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-red-400 italic text-sm">Event details unavailable (might have been deleted)</p>
                                )}
                             </div>
                             
                             {/* Bottom actions row */}
                             <div className="p-4 bg-zinc-950/50 border-t border-zinc-800/80 flex justify-between items-center shrink-0">
                                {booking.eventId && booking.status !== 'cancelled' ? (
                                    <>
                                        <Link to={`/events/${booking.eventId._id}`} className="text-indigo-400 hover:text-indigo-300 font-bold text-sm transition hover:underline">View Event</Link>
                                        <button
                                            onClick={() => cancelBooking(booking._id)}
                                            className="text-red-400 font-bold text-sm hover:text-red-300 transition flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-[16px] align-middle select-none">cancel</span> Cancel Request
                                        </button>
                                    </>
                                ) : (
                                    <div className="w-full text-center text-xs text-zinc-500 italic font-semibold">Booking Cancelled</div>
                                )}
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserDashboard;
