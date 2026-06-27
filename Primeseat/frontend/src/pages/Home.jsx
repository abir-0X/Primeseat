import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import Loading from '../components/Loading';

/**
 * Home View Page Component
 * 
 * Renders the landing page containing a hero search banner, a horizontal 
 * scrolling catalog of upcoming events, features columns, and a footer.
 */
const Home = () => {
    // State management for event listings, user search keywords, and loading indicators
    const [events, setEvents] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Ref reference to the horizontal scrolling container
    const scrollContainerRef = useRef(null);

    /**
     * Horizontal Scroll Utility
     * Scrolls the event list snapshot horizontally by exactly one card width + gap.
     * 
     * @param {string} direction 'left' | 'right'
     */
    const handleScroll = (direction) => {
        const container = scrollContainerRef.current;
        if (container && container.firstChild) {
            const cardWidth = container.firstChild.offsetWidth + 24; // Card width + gap size
            const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // Effect hook to run search actions with a 400ms debounce buffer to prevent API spamming
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchEvents();
        }, 400); // 400ms debounce
        return () => clearTimeout(timeoutId);
    }, [search]);

    /**
     * Query Active Events Catalog
     * Resolves only upcoming events in reverse chronological creation order.
     */
    const fetchEvents = async () => {
        try {
            const { data } = await api.get(`/events?search=${search}&upcoming=true&sort=latest`);
            setEvents(data);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Banner Section */}
            <div className="relative bg-zinc-950 text-white rounded-3xl overflow-hidden mb-12 shadow-2xl border border-zinc-900">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=3000&auto=format&fit=crop')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent"></div>
                <div className="relative p-10 md:p-20 text-center flex flex-col items-center z-10">
                    <span className="bg-indigo-500/10 text-indigo-400 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-indigo-500/20">Welcome to Primeseat</span>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight drop-shadow-lg">
                        Find Your Next <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-400">Unforgettable</span> Experience
                    </h1>
                    <p className="text-zinc-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                        Discover the best tech conferences, late-night music festivals, and hands-on workshops happening directly in your area. Secure your spot today.
                    </p>

                    {/* Interactive search bar input */}
                    <div className="w-full max-w-2xl mx-auto relative flex items-center shadow-2xl group z-10">
                        <input
                            type="text"
                            placeholder="Search events by title..."
                            className="w-full pl-16 pr-6 py-5 rounded-full text-lg text-white bg-zinc-900/80 backdrop-blur-sm border-2 border-zinc-800/80 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder-zinc-500 font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <span className="material-symbols-outlined absolute left-6 text-zinc-500 text-xl group-focus-within:text-indigo-400 transition-colors select-none z-10">search</span>
                    </div>
                </div>
            </div>

            {/* Upcoming Events Catalog title row */}
            <div className="flex items-center justify-between mb-8 px-2 border-b border-zinc-800 pb-4">
                <h2 className="text-3xl font-extrabold text-zinc-100">Upcoming Events</h2>
                <div className="text-zinc-400 font-medium">{events.length} results found</div>
            </div>

            {/* Catalog Grid Viewport */}
            {loading ? (
                <Loading message="Loading events..." />
            ) : events.length === 0 ? (
                <div className="text-center py-20 text-xl text-zinc-400">No events found matching your search.</div>
            ) : (
                <>
                    {/* Horizontal scroll listing container */}
                    <div 
                        ref={scrollContainerRef}
                        className="flex gap-6 overflow-x-auto pb-6 scroll-smooth snap-x snap-mandatory scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
                    >
                        {events.map(event => (
                            <div 
                                key={event._id} 
                                className="bg-zinc-900/60 rounded-3xl overflow-hidden shadow-md border border-zinc-800 hover:border-zinc-700/80 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1 transition duration-300 flex flex-col min-w-[285px] w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] shrink-0 snap-start"
                            >
                                {/* Event Image container */}
                                <div className="h-48 bg-zinc-850 overflow-hidden relative">
                                    {event.image ? (
                                        <>
                                            <img 
                                                src={event.image} 
                                                alt={event.title} 
                                                className="w-full h-full object-cover animate-fadeIn" 
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                            {/* Fallback theme indicator if image URL is broken */}
                                            <div className="hidden w-full h-full flex items-center justify-center bg-zinc-850 text-zinc-400 font-bold text-2xl uppercase tracking-wider">
                                                {event.category || 'Event'}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-850 text-zinc-455 font-bold text-2xl uppercase tracking-wider">
                                            {event.category || 'Event'}
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
                                        {event.ticketPrice === 0 ? <span className="text-emerald-400">FREE</span> : <span className="text-zinc-100">₹{event.ticketPrice}</span>}
                                    </div>
                                </div>
                                
                                {/* Info block */}
                                <div className="p-6 flex-grow flex flex-col">
                                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">{event.category}</div>
                                    <h2 className="text-xl font-bold text-zinc-100 mb-3">{event.title}</h2>
                                    <div className="flex flex-col gap-2 mb-4 text-zinc-300 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-zinc-500 text-[18px] align-middle select-none">calendar_today</span>
                                            <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-zinc-500 text-[18px] align-middle select-none">location_on</span>
                                            <span>{event.location}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Event Capacity indicator progress bar */}
                                    <div className="mt-auto">
                                        <div className="w-full bg-zinc-800 rounded-full h-2 mb-2">
                                            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${(event.availableSeats / event.totalSeats) * 100}%` }}></div>
                                        </div>
                                        <p className="text-xs text-zinc-455 mb-4">{event.availableSeats} of {event.totalSeats} seats remaining</p>
                                        <Link to={`/events/${event._id}`} className="block w-full text-center rounded-lg border border-white/50 bg-transparent py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white hover:text-black">
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Navigation arrow buttons for list scrolling */}
                    <div className="flex justify-center items-center gap-4 mt-6">
                        <button 
                            type="button"
                            onClick={() => handleScroll('left')}
                            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 p-3.5 rounded-full transition shadow-lg hover:shadow-indigo-500/5 active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
                            title="Scroll Left"
                        >
                            <span className="material-symbols-outlined text-[16px] align-middle select-none">arrow_back</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => handleScroll('right')}
                            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 p-3.5 rounded-full transition shadow-lg hover:shadow-indigo-500/5 active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
                            title="Scroll Right"
                        >
                            <span className="material-symbols-outlined text-[16px] align-middle select-none">arrow_forward</span>
                        </button>
                    </div>
                </>
            )}

            {/* Divider line */}
            <div className="w-full border-t border-zinc-800/80 my-20"></div>

            {/* Pitch/Features Section Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 px-4">
                <div className="bg-zinc-900/60 p-8 rounded-3xl shadow-sm border border-zinc-800/80 flex flex-col items-center text-center hover:border-zinc-700/80 hover:-translate-y-1 transition duration-300">
                    <div className="p-4 text-indigo-400 flex items-center justify-center mb-4 select-none">
                        <span className="material-symbols-outlined text-[36px]">schedule</span>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-100 mb-3">Fast Booking</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">Secure your tickets instantly with our fast streamlined booking infrastructure built for speed.</p>
                </div>
                <div className="bg-zinc-900/60 p-8 rounded-3xl shadow-sm border border-zinc-800/80 flex flex-col items-center text-center hover:border-zinc-700/80 hover:-translate-y-1 transition duration-300">
                    <div className="p-4 text-indigo-400 flex items-center justify-center mb-4 select-none">
                        <span className="material-symbols-outlined text-[36px]">confirmation_number</span>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-100 mb-3">Seamless Access</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">Download tickets instantly or manage them right from your personal dashboard with easily.</p>
                </div>
                <div className="bg-zinc-900/60 p-8 rounded-3xl shadow-sm border border-zinc-800/80 flex flex-col items-center text-center hover:border-zinc-700/80 hover:-translate-y-1 transition duration-300">
                    <div className="p-4 text-indigo-400 flex items-center justify-center mb-4 select-none">
                        <span className="material-symbols-outlined text-[36px]">verified_user</span>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-100 mb-3">Secure Platform</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">All transactions and registrations are bounded by cutting-edge security and 2FA OTP tech.</p>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-auto pt-16 pb-8 border-t border-zinc-900 text-center">
                <div className="flex justify-center items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-indigo-500 text-2xl select-none">confirmation_number</span>
                    <span className="text-xl font-bold text-zinc-100">Primeseat</span>
                </div>
                <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                    &copy; {new Date().getFullYear()} Primeseat Platform. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default Home;
