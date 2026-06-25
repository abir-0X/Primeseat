import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';


import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    LineElement,
    PointElement,
    Filler,
    Title as ChartTitle, 
    Tooltip, 
    Legend, 
    ArcElement 
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale, 
    LinearScale, 
    BarElement, 
    LineElement,
    PointElement,
    Filler,
    ChartTitle, 
    Tooltip, 
    Legend, 
    ArcElement
);

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    // Tab State: 'analytics' | 'events' | 'bookings'
    const [activeTab, setActiveTab] = useState('analytics');
    
    const [events, setEvents] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Form inputs state
    const [formData, setFormData] = useState({
        title: '', 
        description: '', 
        date: '', 
        location: '', 
        category: '', 
        totalSeats: '', 
        ticketPrice: '', 
        image: ''
    });

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
            return;
        }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [eventsRes, bookingsRes, analyticsRes] = await Promise.all([
                api.get('/events'),
                api.get('/bookings/my'), // Admin gets all bookings
                api.get('/admin/analytics')
            ]);
            setEvents(eventsRes.data);
            setBookings(bookingsRes.data);
            setAnalytics(analyticsRes.data);
        } catch (error) {
            console.error('Error fetching admin data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await api.post('/events', formData);
            setShowCreateModal(false);
            resetForm();
            await fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating event');
        } finally {
            setActionLoading(false);
        }
    };

    const handleOpenEditModal = (event) => {
        setSelectedEvent(event);
        setFormData({
            title: event.title,
            description: event.description,
            date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
            location: event.location,
            category: event.category,
            totalSeats: event.totalSeats,
            ticketPrice: event.ticketPrice,
            image: event.image || ''
        });
        setShowEditModal(true);
    };

    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await api.put(`/events/${selectedEvent._id}`, formData);
            setShowEditModal(false);
            resetForm();
            await fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating event');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteEvent = async (id) => {
        if (window.confirm('Are you sure you want to delete this event? This will affect any bookings connected to it.')) {
            try {
                await api.delete(`/events/${id}`);
                await fetchData();
            } catch (error) {
                alert(error.response?.data?.message || 'Error deleting event');
            }
        }
    };

    const handleUpdateBookingStatus = async (id, status) => {
        try {
            await api.put(`/bookings/${id}/status`, { status });
            // Refresh database data
            const [bookingsRes, analyticsRes, eventsRes] = await Promise.all([
                api.get('/bookings/my'),
                api.get('/admin/analytics'),
                api.get('/events')
            ]);
            setBookings(bookingsRes.data);
            setAnalytics(analyticsRes.data);
            setEvents(eventsRes.data);
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating booking status');
        }
    };

    const handleUpdatePaymentStatus = async (id, paymentStatus) => {
        try {
            await api.put(`/bookings/${id}/payment`, { paymentStatus });
            // Refresh database data
            const [bookingsRes, analyticsRes] = await Promise.all([
                api.get('/bookings/my'),
                api.get('/admin/analytics')
            ]);
            setBookings(bookingsRes.data);
            setAnalytics(analyticsRes.data);
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating payment status');
        }
    };

    const resetForm = () => {
        setFormData({ 
            title: '', 
            description: '', 
            date: '', 
            location: '', 
            category: '', 
            totalSeats: '', 
            ticketPrice: '', 
            image: '' 
        });
        setSelectedEvent(null);
    };

    if (loading) {
        return <Loading message="Please Wait..." />;
    }

    // Chart logic calculations
    const getCategoryChartData = () => {
        if (!analytics || !analytics.eventStats) return { labels: [], datasets: [] };
        
        const categoryCounts = {};
        analytics.eventStats.forEach(item => {
            const cat = item.category || 'Other';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        return {
            labels: Object.keys(categoryCounts),
            datasets: [
                {
                    label: 'Events Count',
                    data: Object.values(categoryCounts),
                    borderColor: '#6366f1', // Indigo 500
                    borderWidth: 2.5,
                    tension: 0.4, // Smooth curve
                    fill: true,
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return null;
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.25)'); // Indigo-500 with 25% opacity
                        gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
                        return gradient;
                    },
                    pointRadius: (context) => {
                        const index = context.dataIndex;
                        const count = context.dataset.data.length;
                        return index === count - 1 ? 6 : 0; // Glowing dot on last item
                    },
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 8
                }
            ]
        };
    };
    const getOccupancyChartData = () => {
        if (!analytics || !analytics.eventStats) return { labels: [], datasets: [] };

        const sortedStats = [...analytics.eventStats].slice(0, 8); // Top 8 events to prevent clutter

        return {
            labels: sortedStats.map(e => e.title.length > 15 ? e.title.substring(0, 15) + '...' : e.title),
            datasets: [
                {
                    label: 'Seat Occupancy',
                    data: sortedStats.map(e => e.totalSeats > 0 ? Math.round((e.bookedSeats / e.totalSeats) * 100) : 0),
                    borderColor: '#a3e635', // Lime 400
                    borderWidth: 2.5,
                    tension: 0.4, // Smooth spline curves
                    fill: true,
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return null;
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, 'rgba(163, 230, 53, 0.25)'); // lime-400 with 25% opacity
                        gradient.addColorStop(1, 'rgba(163, 230, 53, 0)');
                        return gradient;
                    },
                    pointRadius: (context) => {
                        const index = context.dataIndex;
                        const count = context.dataset.data.length;
                        return index === count - 1 ? 6 : 0; // Only show point on the last item
                    },
                    pointBackgroundColor: '#a3e635',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 8
                }
            ]
        };
    };

    // Shared chart options for dark mode
    const baseChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#A1A1AA', // zinc-400
                    font: { weight: 'bold', family: 'system-ui', size: 11 }
                }
            },
            tooltip: {
                backgroundColor: '#09090B', // zinc-950
                titleColor: '#F4F4F5', // zinc-100
                bodyColor: '#D4D4D8', // zinc-300
                borderColor: '#27272A', // zinc-800
                borderWidth: 1
            }
        }
    };

    const occupancyLineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#09090B', // zinc-950
                titleColor: '#F4F4F5', // zinc-100
                bodyColor: '#D4D4D8', // zinc-300
                borderColor: '#27272A', // zinc-800
                borderWidth: 1,
                callbacks: {
                    label: (context) => ` Occupancy: ${context.parsed.y}%`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: '#71717A', font: { size: 10 } } // zinc-500
            },
            y: {
                grid: { display: false },
                border: { display: false },
                ticks: { display: false },
                min: 0,
                max: 100
            }
        }
    };

    const categoryLineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#09090B',
                titleColor: '#F4F4F5',
                bodyColor: '#D4D4D8',
                borderColor: '#27272A',
                borderWidth: 1,
                callbacks: {
                    label: (context) => ` Events: ${context.parsed.y}`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: '#71717A', font: { size: 10 } }
            },
            y: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: '#71717A', font: { size: 10 }, precision: 0 },
                suggestedMin: 0
            }
        }
    };


    // Calculate global stats for seats occupancy card
    const totalBooked = analytics?.eventStats?.reduce((acc, e) => acc + (e.bookedSeats || 0), 0) || 0;
    const totalAvailable = analytics?.eventStats?.reduce((acc, e) => acc + (e.availableSeats || 0), 0) || 0;
    const totalSeats = analytics?.eventStats?.reduce((acc, e) => acc + (e.totalSeats || 0), 0) || 0;
    const occupancyRate = totalSeats > 0 ? Math.round((totalBooked / totalSeats) * 100) : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Header banner */}
            <div className="bg-zinc-950 text-white rounded-3xl p-8 mb-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden border border-zinc-900">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="z-10">
                    <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-500/20">Control Center</span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold mt-2 mb-1 tracking-tight">Primeseat Portal</h1>
                    <p className="text-zinc-400 text-sm">Welcome back, {user?.name}. Manage your business ecosystem dynamically.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowCreateModal(true); }}
                    className="w-full md:w-auto rounded-lg border border-white/50 bg-transparent px-5 py-3 text-sm font-medium text-white transition-colors duration-300 hover:bg-white hover:text-black font-semibold flex items-center justify-center gap-2 relative z-10"
                >
                    <span className="material-symbols-outlined text-sm align-middle select-none">add</span> Create New Event
                </button>
            </div>

            {/* Premium Tabbed Navigation */}
            <div className="flex border-b border-zinc-800 mb-8 overflow-x-auto gap-4">
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`pb-4 px-4 font-bold text-sm sm:text-base border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'analytics'
                            ? 'border-indigo-500 text-indigo-400'
                            : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    <span className="material-symbols-outlined text-[20px] align-middle select-none">analytics</span> Analytics & Reports
                </button>
                <button
                    onClick={() => setActiveTab('events')}
                    className={`pb-4 px-4 font-bold text-sm sm:text-base border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'events'
                            ? 'border-indigo-500 text-indigo-400'
                            : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    <span className="material-symbols-outlined text-[20px] align-middle select-none">calendar_today</span> Events Management
                </button>
                <button
                    onClick={() => setActiveTab('bookings')}
                    className={`pb-4 px-4 font-bold text-sm sm:text-base border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'bookings'
                            ? 'border-indigo-500 text-indigo-400'
                            : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    <span className="material-symbols-outlined text-[20px] align-middle select-none">confirmation_number</span> Booking Requests
                </button>
            </div>

            {/* Active Tab Contents */}
            {activeTab === 'analytics' && analytics && (
                <div className="space-y-8 animate-fadeIn">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <div className="bg-zinc-900 p-5 rounded-2xl shadow-sm border border-zinc-800 flex items-center justify-between">
                            <div>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                                <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 font-sans">₹{analytics.totalRevenue}</h3>
                            </div>
                            <div className="p-2 text-emerald-400 flex items-center justify-center shrink-0 select-none">
                                <span className="material-symbols-outlined text-[32px]">payments</span>
                            </div>
                        </div>
                        <div className="bg-zinc-900 p-5 rounded-2xl shadow-sm border border-zinc-800 flex items-center justify-between">
                            <div>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Paid Clients</p>
                                <h3 className="text-2xl sm:text-3xl font-black text-indigo-400 font-sans">{analytics.confirmedPaidClientsCount}</h3>
                            </div>
                            <div className="p-2 text-indigo-400 flex items-center justify-center shrink-0 select-none">
                                <span className="material-symbols-outlined text-[32px]">group</span>
                            </div>
                        </div>
                        <div className="bg-zinc-900 p-5 rounded-2xl shadow-sm border border-zinc-800 flex items-center justify-between">
                            <div>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Pending Requests</p>
                                <h3 className="text-2xl sm:text-3xl font-black text-amber-500 font-sans">{analytics.pendingRequestsCount}</h3>
                            </div>
                            <div className="p-2 text-amber-500 flex items-center justify-center shrink-0 select-none">
                                <span className="material-symbols-outlined text-[32px]">schedule</span>
                            </div>
                        </div>
                        <div className="bg-zinc-900 p-5 rounded-2xl shadow-sm border border-zinc-800 flex items-center justify-between">
                            <div>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Live Events</p>
                                <h3 className="text-2xl sm:text-3xl font-black text-blue-400 font-sans">
                                    {events.filter(event => new Date(event.date).getTime() >= new Date().setHours(0, 0, 0, 0)).length}
                                </h3>
                            </div>
                            <div className="p-2 text-blue-400 flex items-center justify-center shrink-0 select-none">
                                <span className="material-symbols-outlined text-[32px]">calendar_today</span>
                            </div>
                        </div>
                    </div>

                    {/* Centered vertical stack of wider line-chart cards */}
                    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
                        {/* Occupancy line chart */}
                        <div className="group relative overflow-hidden rounded-3xl bg-zinc-950 p-6 font-sans shadow-2xl border border-zinc-900 w-full">
                            <div className="absolute -top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-lime-500/10 blur-3xl transition-all duration-700 group-hover:bg-lime-500/15 pointer-events-none"></div>

                            <div className="relative flex flex-col gap-5">
                                <div className="flex items-start justify-between border-b border-zinc-800 pb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 text-lime-400 flex items-center justify-center select-none">
                                            <span className="material-symbols-outlined text-[24px]">analytics</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-zinc-200">Seats Occupancy per Event</p>
                                            <p className="text-xs text-zinc-500">Live booking statistics</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex divide-x divide-zinc-850">
                                    <div className="flex-1 pr-6">
                                        <p className="text-xs font-medium text-zinc-500">Booked Seats</p>
                                        <p className="text-2xl font-bold text-zinc-100">{totalBooked}</p>
                                        <p className="mt-1 text-xs font-medium text-lime-400">+{occupancyRate}% occupancy</p>
                                    </div>
                                    <div className="flex-1 pl-6">
                                        <p className="text-xs font-medium text-zinc-500">Available Seats</p>
                                        <p className="text-2xl font-bold text-zinc-100">{totalAvailable}</p>
                                        <p className="mt-1 text-xs font-medium text-zinc-400">{100 - occupancyRate}% capacity</p>
                                    </div>
                                </div>

                                <div className="relative h-64 w-full">
                                    <Line 
                                        data={getOccupancyChartData()} 
                                        options={occupancyLineOptions} 
                                    />
                                </div>

                                <div className="border-t border-zinc-850 pt-5">
                                    <button
                                        onClick={() => setActiveTab('bookings')}
                                        className="w-full rounded-lg border border-lime-400/50 bg-transparent px-4 py-2 text-sm font-medium text-lime-400 transition-colors duration-300 hover:bg-lime-400 hover:text-zinc-950 font-semibold"
                                    >
                                        Manage Event Bookings
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Category distribution line chart */}
                        <div className="group relative overflow-hidden rounded-3xl bg-zinc-950 p-6 font-sans shadow-2xl border border-zinc-900 w-full">
                            <div className="absolute -top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl transition-all duration-700 group-hover:bg-indigo-500/15 pointer-events-none"></div>

                            <div className="relative flex flex-col gap-5">
                                <div className="flex items-start justify-between border-b border-zinc-800 pb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 text-indigo-400 flex items-center justify-center select-none">
                                            <span className="material-symbols-outlined text-[24px]">category</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-zinc-200">Event Categories Distribution</p>
                                            <p className="text-xs text-zinc-500">Breakdown of published events by theme</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex divide-x divide-zinc-850">
                                    <div className="flex-1 pr-6">
                                        <p className="text-xs font-medium text-zinc-500">Primary Category</p>
                                        <p className="text-2xl font-bold text-zinc-100">
                                            {(() => {
                                                const counts = {};
                                                analytics.eventStats.forEach(e => {
                                                    const cat = e.category || 'Other';
                                                    counts[cat] = (counts[cat] || 0) + 1;
                                                });
                                                const entries = Object.entries(counts);
                                                if (entries.length === 0) return 'N/A';
                                                entries.sort((a, b) => b[1] - a[1]);
                                                return entries[0][0];
                                            })()}
                                        </p>
                                        <p className="mt-1 text-xs font-medium text-indigo-400">Most active category</p>
                                    </div>
                                    <div className="flex-1 pl-6">
                                        <p className="text-xs font-medium text-zinc-500">Distinct Categories</p>
                                        <p className="text-2xl font-bold text-zinc-100">
                                            {new Set(analytics.eventStats.map(e => e.category || 'Other')).size}
                                        </p>
                                        <p className="mt-1 text-xs font-medium text-zinc-400">Unique themes represented</p>
                                    </div>
                                </div>

                                <div className="relative h-64 w-full">
                                    <Line 
                                        data={getCategoryChartData()} 
                                        options={categoryLineOptions} 
                                    />
                                </div>

                                <div className="border-t border-zinc-850 pt-5">
                                    <button
                                        onClick={() => setActiveTab('events')}
                                        className="w-full rounded-lg border border-indigo-400/50 bg-transparent px-4 py-2 text-sm font-medium text-indigo-400 transition-colors duration-300 hover:bg-indigo-400 hover:text-zinc-950 font-semibold"
                                    >
                                        Manage Events Catalog
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {activeTab === 'events' && (() => {
                const liveEventsList = events.filter(event => new Date(event.date).getTime() >= new Date().setHours(0, 0, 0, 0));
                const pastEventsList = events.filter(event => new Date(event.date).getTime() < new Date().setHours(0, 0, 0, 0));
                return (
                    <div className="space-y-8 animate-fadeIn">
                        {/* Live Events Catalog */}
                        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-zinc-850 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20"></span> Live Events ({liveEventsList.length})
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-zinc-950/40 border-b border-zinc-850 text-xs font-bold uppercase tracking-wider text-zinc-500">
                                            <th className="py-4 px-6">Event Name</th>
                                            <th className="py-4 px-6">Category</th>
                                            <th className="py-4 px-6">Date</th>
                                            <th className="py-4 px-6">Price</th>
                                            <th className="py-4 px-6">Seats Sold</th>
                                            <th className="py-4 px-6 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-850 text-sm">
                                        {liveEventsList.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="py-12 text-center text-zinc-500 font-medium">No live events found. Click "Create New Event" to add one.</td>
                                            </tr>
                                        ) : (
                                            liveEventsList.map(event => (
                                                <tr key={event._id} className="hover:bg-zinc-950/20 transition">
                                                    <td className="py-4 px-6 font-bold text-zinc-150">{event.title}</td>
                                                    <td className="py-4 px-6 text-zinc-400">
                                                        <span className="bg-zinc-950 px-3 py-1 rounded-full text-xs font-semibold uppercase border border-zinc-800">{event.category}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-zinc-450 font-medium">{new Date(event.date).toLocaleDateString()}</td>
                                                    <td className="py-4 px-6 font-bold text-zinc-200">
                                                        {event.ticketPrice === 0 ? <span className="text-emerald-450 font-bold">Free</span> : `₹${event.ticketPrice}`}
                                                    </td>
                                                    <td className="py-4 px-6 text-zinc-400 font-medium">
                                                        <span className="text-zinc-200">{event.totalSeats - event.availableSeats}</span>
                                                        <span className="text-zinc-700 mx-1.5">/</span>
                                                        <span className="text-zinc-500">{event.totalSeats}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <button 
                                                                onClick={() => handleOpenEditModal(event)}
                                                                className="text-indigo-400 hover:text-indigo-300 p-2 transition"
                                                                title="Edit Event"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px] align-middle select-none">edit</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteEvent(event._id)}
                                                                className="text-red-400 hover:text-red-300 p-2 transition"
                                                                title="Delete Event"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px] align-middle select-none">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Past Events Catalog */}
                        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-zinc-850 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-zinc-150 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 shadow-sm shadow-zinc-600/20"></span> Past Events ({pastEventsList.length})
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-zinc-950/40 border-b border-zinc-850 text-xs font-bold uppercase tracking-wider text-zinc-500">
                                            <th className="py-4 px-6">Event Name</th>
                                            <th className="py-4 px-6">Category</th>
                                            <th className="py-4 px-6">Date</th>
                                            <th className="py-4 px-6">Price</th>
                                            <th className="py-4 px-6">Seats Sold</th>
                                            <th className="py-4 px-6 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-850 text-sm">
                                        {pastEventsList.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="py-12 text-center text-zinc-550 font-medium">No past events found.</td>
                                            </tr>
                                        ) : (
                                            pastEventsList.map(event => (
                                                <tr key={event._id} className="hover:bg-zinc-950/20 transition opacity-70 hover:opacity-100 duration-200">
                                                    <td className="py-4 px-6 font-bold text-zinc-300">{event.title}</td>
                                                    <td className="py-4 px-6 text-zinc-500">
                                                        <span className="bg-zinc-950 px-3 py-1 rounded-full text-xs font-semibold uppercase border border-zinc-800">{event.category}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-zinc-500 font-medium">{new Date(event.date).toLocaleDateString()}</td>
                                                    <td className="py-4 px-6 font-bold text-zinc-200">
                                                        {event.ticketPrice === 0 ? <span className="text-emerald-450 font-bold">Free</span> : `₹${event.ticketPrice}`}
                                                    </td>
                                                    <td className="py-4 px-6 text-zinc-500 font-medium">
                                                        <span className="text-zinc-300">{event.totalSeats - event.availableSeats}</span>
                                                        <span className="text-zinc-700 mx-1.5">/</span>
                                                        <span className="text-zinc-500">{event.totalSeats}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <button 
                                                                onClick={() => handleOpenEditModal(event)}
                                                                className="text-indigo-400 hover:text-indigo-300 p-2 transition"
                                                                title="Edit Event"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px] align-middle select-none">edit</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteEvent(event._id)}
                                                                className="text-red-400 hover:text-red-300 p-2 transition"
                                                                title="Delete Event"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px] align-middle select-none">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {activeTab === 'bookings' && (
                <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-sm overflow-hidden animate-fadeIn">
                    <div className="p-6 border-b border-zinc-850 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-zinc-100">Bookings List (<span className="font-sans font-semibold">{bookings.length}</span>)</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-950/40 border-b border-zinc-850 text-xs font-bold uppercase tracking-wider text-zinc-500">
                                    <th className="py-4 px-6">Event</th>
                                    <th className="py-4 px-6">User details</th>
                                    <th className="py-4 px-6">Amount</th>
                                    <th className="py-4 px-6">Booking Date</th>
                                    <th className="py-4 px-6">Booking Status</th>
                                    <th className="py-4 px-6">Payment status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-850 text-sm">
                                {bookings.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-zinc-500 font-medium">No booking requests submitted yet.</td>
                                    </tr>
                                ) : (
                                    bookings.map(booking => (
                                        <tr key={booking._id} className="hover:bg-zinc-950/20 transition">
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-zinc-150">{booking.eventId?.title || 'Deleted Event'}</div>
                                                {booking.eventId && (
                                                    <div className="text-xs text-zinc-500 mt-1">{booking.eventId.availableSeats} of {booking.eventId.totalSeats} seats left</div>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-semibold text-zinc-200">{booking.userId?.name || 'N/A'}</div>
                                                <div className="text-xs text-zinc-500 mt-0.5">{booking.userId?.email || 'N/A'}</div>
                                            </td>
                                            <td className="py-4 px-6 font-bold text-zinc-200">
                                                {booking.amount === 0 ? <span className="text-emerald-450">Free</span> : `₹${booking.amount}`}
                                            </td>
                                            <td className="py-4 px-6 text-zinc-455">{new Date(booking.bookedAt || booking.createdAt).toLocaleDateString()}</td>
                                            <td className="py-4 px-6">
                                                <select
                                                    value={booking.status}
                                                    onChange={(e) => handleUpdateBookingStatus(booking._id, e.target.value)}
                                                    className={`px-3 py-1.5 rounded-lg border font-bold text-xs uppercase tracking-wider outline-none transition cursor-pointer bg-zinc-950 ${
                                                        booking.status === 'confirmed' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' :
                                                        booking.status === 'cancelled' ? 'bg-red-950/40 text-red-400 border-red-900/30' :
                                                        booking.status === 'rejected' ? 'bg-red-950/40 text-red-400 border-red-900/30' :
                                                        'bg-amber-950/40 text-amber-400 border-amber-900/30'
                                                    }`}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="confirmed">Confirmed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                    <option value="rejected">Rejected</option>
                                                </select>
                                            </td>
                                            <td className="py-4 px-6">
                                                <select
                                                    disabled={booking.status === 'cancelled'}
                                                    value={booking.paymentStatus}
                                                    onChange={(e) => handleUpdatePaymentStatus(booking._id, e.target.value)}
                                                    className={`px-3 py-1.5 rounded-lg border font-bold text-xs uppercase tracking-wider outline-none transition bg-zinc-950 ${
                                                        booking.status === 'cancelled'
                                                            ? 'bg-zinc-800 text-zinc-650 border-zinc-700/30 cursor-not-allowed'
                                                            : 'cursor-pointer ' + (
                                                                booking.paymentStatus === 'paid'
                                                                    ? 'bg-blue-950/40 text-blue-400 border-blue-900/30'
                                                                    : 'bg-zinc-850 text-zinc-400 border-zinc-700/50'
                                                            )
                                                    }`}
                                                >
                                                    <option value="not_paid">Not Paid</option>
                                                    <option value="paid">Paid</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Event Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-zinc-800 max-h-[90vh] flex flex-col animation-scaleUp">
                        <div className="p-6 border-b border-zinc-850 flex items-center justify-between bg-zinc-950 shrink-0">
                            <h2 className="text-xl font-bold text-zinc-150">Create New Event</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-zinc-300 flex items-center justify-center"><span className="material-symbols-outlined text-[20px] select-none">close</span></button>
                        </div>
                        <form onSubmit={handleCreateEvent} className="p-6 overflow-y-auto space-y-5 flex-grow">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Event Title</label>
                                    <input required type="text" placeholder="e.g. Modern Web Summit" className="border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-600 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm shadow-inner" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Category</label>
                                    <input required type="text" placeholder="e.g. Tech, Music, Art" className="border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-600 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm shadow-inner" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Event Date</label>
                                    <input required type="date" className="border border-zinc-800 bg-zinc-950 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm shadow-inner" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Location</label>
                                    <input required type="text" placeholder="e.g. Grand Arena, NY" className="border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-600 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm shadow-inner" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Total Seats</label>
                                    <input required type="number" placeholder="e.g. 150" className="border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-600 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm shadow-inner" value={formData.totalSeats} onChange={e => setFormData({ ...formData, totalSeats: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Ticket Price (₹)</label>
                                    <input required type="number" placeholder="e.g. 500" className="border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-600 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm shadow-inner" value={formData.ticketPrice} onChange={e => setFormData({ ...formData, ticketPrice: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Event Image</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Upload Local File</span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 file:transition file:cursor-pointer border border-zinc-800 bg-zinc-950 px-3 py-1 rounded-xl outline-none"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setFormData({ ...formData, image: reader.result });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Or Paste Image URL</span>
                                        <input 
                                            type="text" 
                                            placeholder="https://images.unsplash.com/..." 
                                            className="w-full border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-600 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm shadow-inner" 
                                            value={formData.image && formData.image.startsWith('data:') ? '' : formData.image} 
                                            onChange={e => setFormData({ ...formData, image: e.target.value })} 
                                        />
                                    </div>
                                </div>
                                {formData.image && (
                                    <div className="mt-2 relative h-32 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                        <button 
                                            type="button" 
                                            onClick={() => setFormData({ ...formData, image: '' })}
                                            className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-full transition flex items-center justify-center"
                                            title="Clear Image"
                                        >
                                            <span className="material-symbols-outlined text-[14px] select-none">close</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Description</label>
                                <textarea required placeholder="Outline event schedule, highlights..." className="border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-600 px-4 py-3 rounded-xl h-28 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm resize-none shadow-inner" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-zinc-850 shrink-0">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 border border-zinc-800 hover:bg-zinc-850/50 text-zinc-300 font-bold py-3 rounded-xl transition text-sm">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 rounded-lg border border-white/50 bg-transparent py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white hover:text-black shadow-lg">
                                    {actionLoading ? 'Publishing...' : 'Publish Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Event Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-zinc-800 max-h-[90vh] flex flex-col animation-scaleUp">
                        <div className="p-6 border-b border-zinc-850 flex items-center justify-between bg-zinc-950 shrink-0">
                            <h2 className="text-xl font-bold text-zinc-150">Edit Event Details</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-zinc-500 hover:text-zinc-300 flex items-center justify-center"><span className="material-symbols-outlined text-[20px] select-none">close</span></button>
                        </div>
                        <form onSubmit={handleUpdateEvent} className="p-6 overflow-y-auto space-y-5 flex-grow">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Event Title</label>
                                    <input required type="text" className="border border-zinc-800 bg-zinc-950 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm shadow-inner" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Category</label>
                                    <input required type="text" className="border border-zinc-800 bg-zinc-950 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm shadow-inner" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Event Date</label>
                                    <input required type="date" className="border border-zinc-800 bg-zinc-950 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm shadow-inner" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Location</label>
                                    <input required type="text" className="border border-zinc-800 bg-zinc-950 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm shadow-inner" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Total Seats</label>
                                    <input required type="number" className="border border-zinc-800 bg-zinc-950 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm shadow-inner" value={formData.totalSeats} onChange={e => setFormData({ ...formData, totalSeats: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Ticket Price (₹)</label>
                                    <input required type="number" className="border border-zinc-800 bg-zinc-950 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm shadow-inner" value={formData.ticketPrice} onChange={e => setFormData({ ...formData, ticketPrice: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Event Image</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Upload Local File</span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 file:transition file:cursor-pointer border border-zinc-800 bg-zinc-950 px-3 py-1 rounded-xl outline-none"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setFormData({ ...formData, image: reader.result });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Or Paste Image URL</span>
                                        <input 
                                            type="text" 
                                            placeholder="https://images.unsplash.com/..." 
                                            className="w-full border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-600 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm shadow-inner" 
                                            value={formData.image && formData.image.startsWith('data:') ? '' : formData.image} 
                                            onChange={e => setFormData({ ...formData, image: e.target.value })} 
                                        />
                                    </div>
                                </div>
                                {formData.image && (
                                    <div className="mt-2 relative h-32 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                        <button 
                                            type="button" 
                                            onClick={() => setFormData({ ...formData, image: '' })}
                                            className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-full transition flex items-center justify-center"
                                            title="Clear Image"
                                        >
                                            <span className="material-symbols-outlined text-[14px] select-none">close</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Description</label>
                                <textarea required className="border border-zinc-800 bg-zinc-950 text-white px-4 py-3 rounded-xl h-28 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm resize-none shadow-inner" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-zinc-850 shrink-0">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 border border-zinc-800 hover:bg-zinc-850/50 text-zinc-300 font-bold py-3 rounded-xl transition text-sm">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 rounded-lg border border-white/50 bg-transparent py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white hover:text-black shadow-lg">
                                    {actionLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
