import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import Loading from '../components/Loading';
import { AuthContext } from '../context/AuthContext';


const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const { data } = await api.get(`/events/${id}`);
                setEvent(data);
            } catch (err) {
                setError('Failed to load event details.');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    const handleBooking = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setBookingLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            if (!showOTP) {
                await api.post('/bookings/send-otp');
                setShowOTP(true);
                setSuccessMsg('OTP sent to your email. Please verify to confirm booking.');
            } else {
                await api.post('/bookings', { eventId: event._id, otp });
                setSuccessMsg('Booking requested! Awaiting admin confirmation.');
                setShowOTP(false);
                // Update local seats count dynamically after booking
                setEvent({ ...event, availableSeats: event.availableSeats - 1 });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) return <Loading message="Loading event details..." />;
    if (error && !event) return <div className="text-center py-20 text-xl text-red-500">{error || 'Event not found'}</div>;

    const isSoldOut = event.availableSeats <= 0;

    return (
        <div className="max-w-4xl mx-auto bg-zinc-900 rounded-3xl shadow-xl overflow-hidden mt-8 border border-zinc-800">
            {event.image ? (
                <>
                    <img 
                        src={event.image} 
                        alt={event.title} 
                        className="w-full h-80 object-cover animate-fadeIn" 
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    <div className="hidden w-full h-80 bg-zinc-950 flex items-center justify-center text-white/30 text-5xl font-black uppercase tracking-widest">
                        {event.category}
                    </div>
                </>
            ) : (
                <div className="w-full h-64 bg-zinc-950 flex items-center justify-center text-white/30 text-5xl font-black uppercase tracking-widest">
                    {event.category}
                </div>
            )}

            <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                    <div className="flex-grow">
                        <div className="inline-block bg-indigo-500/10 text-indigo-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-3 border border-indigo-500/20">
                            {event.category}
                        </div>
                        <h1 className="text-4xl font-extrabold text-zinc-100 mb-4">{event.title}</h1>
                        <p className="text-zinc-350 text-lg leading-relaxed mb-6 font-light">{event.description}</p>
                    </div>

                    <div className="bg-zinc-950/60 p-6 rounded-2xl border border-zinc-800/80 min-w-[300px] w-full md:w-auto shrink-0 shadow-sm">
                        <h3 className="text-xl font-bold text-zinc-100 mb-6">Booking Details</h3>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-4 text-zinc-300">
                                <div className="p-2 text-zinc-400 flex items-center justify-center shrink-0 select-none">
                                    <span className="material-symbols-outlined text-[24px]">payments</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ticket Price</p>
                                    <p className="font-extrabold text-zinc-100 text-lg">{event.ticketPrice === 0 ? <span className="text-emerald-400 font-extrabold">Free</span> : `₹${event.ticketPrice}`}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-zinc-300">
                                <div className="p-2 text-zinc-400 flex items-center justify-center shrink-0 select-none">
                                    <span className="material-symbols-outlined text-[24px]">event_seat</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Availability</p>
                                    <p className="font-extrabold text-zinc-100">
                                        <span className={event.availableSeats < 10 ? 'text-amber-500 font-extrabold' : ''}>{event.availableSeats}</span> / {event.totalSeats}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-zinc-300">
                                <div className="p-2 text-zinc-400 flex items-center justify-center shrink-0 select-none">
                                    <span className="material-symbols-outlined text-[24px]">calendar_today</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</p>
                                    <p className="font-extrabold text-zinc-100">{new Date(event.date).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-zinc-300">
                                <div className="p-2 text-zinc-400 flex items-center justify-center shrink-0 select-none">
                                    <span className="material-symbols-outlined text-[24px]">location_on</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Location</p>
                                    <p className="font-extrabold text-zinc-100">{event.location}</p>
                                </div>
                            </div>
                        </div>

                        {showOTP && (
                            <div className="mb-6 animate-fadeIn">
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Enter OTP to Confirm</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="6-digit code"
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-white placeholder-zinc-650 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition shadow-sm font-bold tracking-widest text-center text-lg"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength="6"
                                />
                            </div>
                        )}

                        <button
                            onClick={handleBooking}
                            disabled={isSoldOut || bookingLoading || (showOTP && !otp)}
                            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition duration-200 shadow-lg ${isSoldOut || (successMsg && !showOTP)
                                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-650 hover:to-purple-700 text-white hover:shadow-xl hover:-translate-y-0.5'
                                }`}
                        >
                            {bookingLoading ? 'Processing...' : (showOTP ? 'Verify OTP & Confirm' : (successMsg && !showOTP ? 'Request Sent' : (isSoldOut ? 'Sold Out' : 'Confirm Registration')))}
                        </button>
                        {error && <p className="text-red-400 mt-4 text-center text-sm font-medium bg-red-950/20 border border-red-900/30 p-3 rounded-xl">{error}</p>}
                        {successMsg && <p className="text-emerald-400 mt-4 text-center text-sm font-medium bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-xl">{successMsg}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
