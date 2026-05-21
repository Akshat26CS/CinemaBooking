import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Film, Building2, Monitor, BarChart3,
  Plus, Trash2, Edit3, Users, Ticket, DollarSign,
  ChevronRight, Loader2, Shield, Calendar, Globe, User
} from 'lucide-react';
import { GenericAdminModal } from './AdminModals';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  token: string;
}

type Tab = 'dashboard' | 'movies' | 'theatres' | 'bookings' | 'customers' | 'admins' | 'shows' | 'website';

interface Stats {
  movieCount: number;
  theatreCount: number;
  customerCount: number;
  bookingCount: number;
  totalRevenue: number;
}

export default function AdminPanel({ open, onClose, token }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const [theatres, setTheatres] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [website, setWebsite] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    if (!open) return;
    fetchData();
  }, [open, activeTab]);

  // Lock scroll when admin panel is open
  useEffect(() => {
    if (open) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [open]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const res = await fetch('/api/admin/stats', { headers });
        if (res.ok) setStats(await res.json());
      } else if (activeTab === 'movies') {
        const res = await fetch('/api/movies');
        if (res.ok) setMovies(await res.json());
      } else if (activeTab === 'theatres') {
        const res = await fetch('/api/theatres');
        if (res.ok) setTheatres(await res.json());
      } else if (activeTab === 'bookings') {
        const res = await fetch('/api/admin/bookings', { headers });
        if (res.ok) setBookings(await res.json());
      } else if (activeTab === 'customers') {
        const res = await fetch('/api/admin/customers', { headers });
        if (res.ok) setCustomers(await res.json());
      } else if (activeTab === 'admins') {
        const res = await fetch('/api/admin/admins', { headers });
        if (res.ok) setAdmins(await res.json());
      } else if (activeTab === 'shows') {
        const res = await fetch('/api/admin/shows', { headers });
        if (res.ok) setShows(await res.json());
      } else if (activeTab === 'website') {
        const res = await fetch('/api/admin/website', { headers });
        if (res.ok) setWebsite(await res.json());
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, type: string, title: string, fields: any[], endpoint: string} | null>(null);

  const handleModalSubmit = async (data: any) => {
    if (!modalConfig) return;
    const res = await fetch(modalConfig.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Request failed');
    }
    fetchData();
  };

  const deleteEntity = async (type: string, id: number | string) => {
    if (!confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) return;
    try {
      await fetch(`/api/admin/${type}s/${id}`, { method: 'DELETE', headers });
      fetchData();
    } catch (err) {
      console.error(`Delete ${type} error:`, err);
    }
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { key: 'customers', label: 'Customers', icon: Users },
    { key: 'admins', label: 'Admins', icon: Shield },
    { key: 'movies', label: 'Movies', icon: Film },
    { key: 'theatres', label: 'Theatres', icon: Building2 },
    { key: 'shows', label: 'Shows', icon: Calendar },
    { key: 'bookings', label: 'Bookings', icon: Ticket },
    { key: 'website', label: 'Website', icon: Globe },
  ];

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99998] bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      {open && (
        <motion.div
          key="panel"
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 200 }}
          className="fixed inset-x-0 bottom-0 top-12 md:top-6 md:inset-x-6 md:bottom-6 z-[99999] bg-[#0a0a0a]/70 backdrop-blur-3xl md:rounded-[2.5rem] rounded-t-[2rem] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden ring-1 ring-white/5"
          data-lenis-prevent
        >
          {/* Header */}
          <div className="flex-shrink-0 bg-white/5 backdrop-blur-xl border-b border-white/10">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-crimson/20 border border-brand-crimson/20 flex items-center justify-center shadow-inner">
                  <Monitor className="w-4 h-4 text-brand-crimson" />
                </div>
                <h1 className="font-display font-semibold text-xl text-white tracking-tight">Admin Panel</h1>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

          {/* Tabs */}
          <div className="max-w-7xl mx-auto px-6 pb-0">
            <div className="flex gap-1 overflow-x-auto hide-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'text-white border-brand-crimson'
                        : 'text-brand-slate border-transparent hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-brand-crimson animate-spin" />
              </div>
            ) : (
              <>
                {/* Dashboard */}
                {activeTab === 'dashboard' && stats && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={Film} label="Movies" value={stats.movieCount} color="text-cyan-400 bg-cyan-400/10" />
                    <StatCard icon={Building2} label="Theatres" value={stats.theatreCount} color="text-purple-400 bg-purple-400/10" />
                    <StatCard icon={Users} label="Customers" value={stats.customerCount} color="text-emerald-400 bg-emerald-400/10" />
                    <StatCard icon={Ticket} label="Bookings" value={stats.bookingCount} color="text-amber-400 bg-amber-400/10" />
                    <div className="sm:col-span-2 lg:col-span-4 bg-brand-bg-alt/60 border border-white/5 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-brand-gold" />
                        </div>
                        <div>
                          <p className="text-xs text-brand-slate uppercase tracking-widest">Total Revenue</p>
                          <p className="text-3xl font-display font-bold text-brand-gold">₹{stats.totalRevenue.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Movies */}
                {activeTab === 'movies' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-display font-bold text-xl text-white">All Movies ({movies.length})</h2>
                      <button onClick={() => setModalConfig({isOpen: true, type: 'movie', title: 'Add Movie', endpoint: '/api/admin/movies', fields: [ {name: 'title', label: 'Title', type: 'text', required: true}, {name: 'description', label: 'Description', type: 'text'}, {name: 'stars', label: 'Stars (Pipe-separated)', type: 'text'}, {name: 'language', label: 'Language', type: 'text'}, {name: 'duration', label: 'Duration (e.g. 2h 30m)', type: 'text'}, {name: 'image', label: 'Image URL', type: 'text'}, {name: 'genre', label: 'Genre', type: 'text'}, {name: 'formats', label: 'Formats', type: 'text'}, {name: 'trailerLink', label: 'Trailer URL', type: 'text'}, {name: 'comingSoon', label: 'Coming Soon', type: 'checkbox'} ]})} className="flex items-center gap-2 px-4 py-2 bg-brand-crimson/20 text-brand-crimson hover:bg-brand-crimson hover:text-white rounded-lg transition-colors text-sm font-medium"><Plus className="w-4 h-4"/> Add Movie</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {movies.map((movie) => (
                        <div
                          key={movie.id}
                          className="bg-brand-bg-alt/60 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-4 p-4">
                            {movie.image && (
                              <img src={movie.image} alt={movie.title} className="w-14 h-20 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-display font-semibold text-white text-sm truncate">{movie.title}</h3>
                              <p className="text-xs text-brand-slate mt-1">{movie.time} • {movie.genres?.join(', ')}</p>
                              {movie.comingSoon && (
                                <span className="inline-block text-[10px] mt-1 px-2 py-0.5 bg-brand-crimson/20 text-brand-crimson rounded">Coming Soon</span>
                              )}
                            </div>
                            <button
                              onClick={() => deleteEntity('movie', movie.id)}
                              className="p-2 rounded-lg hover:bg-brand-crimson/20 text-brand-slate hover:text-brand-crimson transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Theatres */}
                {activeTab === 'theatres' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-display font-bold text-xl text-white">All Theatres ({theatres.length})</h2>
                      <button onClick={() => setModalConfig({isOpen: true, type: 'theatre', title: 'Add Theatre', endpoint: '/api/admin/theatres', fields: [ {name: 'name', label: 'Theatre Name', type: 'text', required: true}, {name: 'location', label: 'Location', type: 'text', required: true} ]})} className="flex items-center gap-2 px-4 py-2 bg-brand-crimson/20 text-brand-crimson hover:bg-brand-crimson hover:text-white rounded-lg transition-colors text-sm font-medium"><Plus className="w-4 h-4"/> Add Theatre</button>
                    </div>
                    {theatres.map((theatre) => (
                      <div
                        key={theatre.id}
                        className="bg-brand-bg-alt/60 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-display font-semibold text-white">{theatre.name}</h3>
                            <p className="text-xs text-brand-slate mt-0.5">{theatre.location}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs bg-white/5 px-3 py-1 rounded-full text-brand-slate border border-white/5">
                              {theatre.screens?.length || 0} screens
                            </span>
                            <button onClick={() => deleteEntity('theatre', theatre.id)} className="p-2 bg-brand-bg hover:bg-brand-crimson/20 text-brand-slate hover:text-brand-crimson rounded-lg border border-white/5 transition-colors"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </div>
                        {theatre.screens && theatre.screens.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {theatre.screens.map((screen: any) => (
                              <span key={screen.screenNo} className="text-[11px] px-3 py-1 bg-white/[0.03] border border-white/5 rounded-lg text-brand-slate">
                                {screen.name} ({screen.seats} seats)
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Bookings */}
                {activeTab === 'bookings' && (
                  <div className="space-y-4">
                    <h2 className="font-display font-bold text-xl text-white mb-6">Recent Bookings ({bookings.length})</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Booking ID</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Ticket#</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Customer</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Movie</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Theatre</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Date & Time</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Seat</th>
                            <th className="text-right py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Price</th>
                            <th className="py-3 px-4"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((b: any) => {
                            const bookingId = `BKG-${b.Customer_ID}-${new Date(b.BookedAt).getTime().toString().slice(-6)}`;
                            return (
                            <tr key={b.Ticket_No} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                              <td className="py-3 px-4 text-brand-slate font-mono">{bookingId}</td>
                              <td className="py-3 px-4 text-white font-mono">#{b.Ticket_No}</td>
                              <td className="py-3 px-4 text-white">{b.F_Name} {b.L_Name}</td>
                              <td className="py-3 px-4 text-white">{b.Movie_Title}</td>
                              <td className="py-3 px-4 text-brand-slate">{b.Theatre_Name}</td>
                              <td className="py-3 px-4 text-brand-slate">
                                {new Date(b.Show_date).toLocaleDateString()} {b.Show_time ? b.Show_time.slice(0, 5) : ''}
                              </td>
                              <td className="py-3 px-4 text-brand-slate font-mono">{b.Seat_No}</td>
                              <td className="py-3 px-4 text-brand-gold text-right font-medium">₹{b.Price}</td>
                              <td className="py-3 px-4 text-right">
                                <button onClick={() => deleteEntity('booking', b.Ticket_No)} className="p-2 hover:bg-brand-crimson/20 text-brand-slate hover:text-brand-crimson rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Customers */}
                {activeTab === 'customers' && (
                  <div className="space-y-4">
                    <h2 className="font-display font-bold text-xl text-white mb-6">All Customers ({customers.length})</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">ID</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Name</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Email</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Phone</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Age</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Joined</th>
                            <th className="py-3 px-4"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {customers.map((c: any) => (
                            <tr key={c.Customer_ID} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                              <td className="py-3 px-4 text-white font-mono">#{c.Customer_ID}</td>
                              <td className="py-3 px-4 text-white">{c.F_Name} {c.L_Name}</td>
                              <td className="py-3 px-4 text-brand-slate">{c.Email_ID}</td>
                              <td className="py-3 px-4 text-brand-slate">{c.Mobile_No || '-'}</td>
                              <td className="py-3 px-4 text-brand-slate">{c.Age || '-'}</td>
                              <td className="py-3 px-4 text-brand-slate">{new Date(c.CreatedAt).toLocaleDateString()}</td>
                              <td className="py-3 px-4 text-right">
                                <button onClick={() => deleteEntity('customer', c.Customer_ID)} className="p-2 hover:bg-brand-crimson/20 text-brand-slate hover:text-brand-crimson rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Admins */}
                {activeTab === 'admins' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-display font-bold text-xl text-white">Administrators ({admins.length})</h2>
                      <button onClick={() => setModalConfig({isOpen: true, type: 'admin', title: 'Add Admin', endpoint: '/api/admin/admins', fields: [ {name: 'name', label: 'Name', type: 'text', required: true}, {name: 'email', label: 'Email', type: 'text', required: true}, {name: 'password', label: 'Password', type: 'password', required: true} ]})} className="flex items-center gap-2 px-4 py-2 bg-brand-crimson/20 text-brand-crimson hover:bg-brand-crimson hover:text-white rounded-lg transition-colors text-sm font-medium"><Plus className="w-4 h-4"/> Add Admin</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">ID</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Name</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Email</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Role</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Added</th>
                            <th className="py-3 px-4"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {admins.map((a: any) => (
                            <tr key={a.Admin_ID} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                              <td className="py-3 px-4 text-white font-mono">#{a.Admin_ID}</td>
                              <td className="py-3 px-4 text-white flex items-center gap-2">
                                <Shield className="w-3 h-3 text-brand-gold" />
                                {a.Admin_name}
                              </td>
                              <td className="py-3 px-4 text-brand-slate">{a.Email}</td>
                              <td className="py-3 px-4 text-brand-slate uppercase text-[10px] tracking-wider"><span className="px-2 py-1 bg-white/5 rounded border border-white/10">{a.Admin_Role}</span></td>
                              <td className="py-3 px-4 text-brand-slate">{new Date(a.CreatedAt).toLocaleDateString()}</td>
                              <td className="py-3 px-4 text-right">
                                <button onClick={() => deleteEntity('admin', a.Admin_ID)} className="p-2 hover:bg-brand-crimson/20 text-brand-slate hover:text-brand-crimson rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Shows */}
                {activeTab === 'shows' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-display font-bold text-xl text-white">Scheduled Shows ({shows.length})</h2>
                      <button onClick={() => setModalConfig({isOpen: true, type: 'show', title: 'Schedule Show', endpoint: '/api/admin/shows', fields: [ {name: 'movieId', label: 'Movie ID', type: 'number', required: true}, {name: 'screenNo', label: 'Screen Number', type: 'number', required: true}, {name: 'showDate', label: 'Show Date (YYYY-MM-DD)', type: 'date', required: true}, {name: 'startTime', label: 'Start Time (HH:MM)', type: 'time', required: true}, {name: 'endTime', label: 'End Time (HH:MM)', type: 'time'} ]})} className="flex items-center gap-2 px-4 py-2 bg-brand-crimson/20 text-brand-crimson hover:bg-brand-crimson hover:text-white rounded-lg transition-colors text-sm font-medium"><Plus className="w-4 h-4"/> Add Show</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">ID</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Date</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Movie</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Time</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-widest text-brand-slate font-medium">Theatre & Screen</th>
                            <th className="py-3 px-4"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {shows.map((s: any) => (
                            <tr key={s.Show_ID} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                              <td className="py-3 px-4 text-white font-mono">#{s.Show_ID}</td>
                              <td className="py-3 px-4 text-white whitespace-nowrap">{new Date(s.Show_date).toLocaleDateString()}</td>
                              <td className="py-3 px-4 text-brand-slate font-medium">{s.Movie_Title}</td>
                              <td className="py-3 px-4 text-brand-slate whitespace-nowrap">{s.Show_starttime.slice(0,5)} - {s.Show_endtime.slice(0,5)}</td>
                              <td className="py-3 px-4 text-brand-slate">{s.Theatre_Name} <span className="text-xs opacity-60">({s.Screen_Name})</span></td>
                              <td className="py-3 px-4 text-right">
                                <button onClick={() => deleteEntity('show', s.Show_ID)} className="p-2 hover:bg-brand-crimson/20 text-brand-slate hover:text-brand-crimson rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Website */}
                {activeTab === 'website' && website && (
                  <div className="space-y-6 max-w-2xl">
                    <h2 className="font-display font-bold text-xl text-white mb-6">Website Configuration</h2>
                    
                    <div className="bg-brand-bg-alt/60 border border-white/5 rounded-2xl p-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-brand-slate mb-1">Website ID</label>
                          <div className="text-white font-mono bg-white/5 px-4 py-2 rounded border border-white/5 inline-block">#{website.Website_ID}</div>
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-brand-slate mb-1">Platform Name</label>
                          <div className="text-lg text-white font-medium">{website.Website_name}</div>
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-brand-slate mb-1">Base URL</label>
                          <div className="text-brand-indigo hover:underline cursor-pointer">{website.Website_URL}</div>
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-brand-slate mb-1">Support Contact</label>
                          <div className="text-white">{website.Contact_No}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        </motion.div>
      )}
      <GenericAdminModal
        isOpen={modalConfig?.isOpen || false}
        onClose={() => setModalConfig(null)}
        title={modalConfig?.title || ''}
        fields={modalConfig?.fields || []}
        onSubmit={handleModalSubmit}
      />
    </AnimatePresence>,
    document.body
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-brand-bg-alt/60 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.split(' ')[1]}`}>
          <Icon className={`w-5 h-5 ${color.split(' ')[0]}`} />
        </div>
        <div>
          <p className="text-xs text-brand-slate uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-display font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
