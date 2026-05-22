import React, { useState, useEffect } from 'react';
import { X, Loader2, Ticket, Calendar, Clock, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Booking {
  ticketNo: string;
  price: number;
  seatNo: string;
  showTime: string;
  showDate: string;
  movieTitle: string;
  movieImage: string;
  movieDuration: string;
  theatreName: string;
  screenName: string;
}

interface MyBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export default function MyBookingsModal({ isOpen, onClose, token }: MyBookingsModalProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !token) return;
    
    let isMounted = true;
    const fetchBookings = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/bookings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch bookings');
        const data = await res.json();
        if (isMounted) setBookings(data);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error fetching bookings');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchBookings();
    
    return () => { isMounted = false; };
  }, [isOpen, token]);

  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-brand-bg border border-white/10 rounded-3xl p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-crimson/20 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-brand-crimson" />
              </div>
              <h2 className="text-xl font-display font-bold text-white">My Bookings</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-brand-slate transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto hide-scrollbar -mx-2 px-2">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-brand-crimson animate-spin" />
              </div>
            ) : error ? (
              <div className="p-4 bg-brand-crimson/20 border border-brand-crimson/50 text-brand-crimson rounded-xl text-center">
                {error}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-20">
                <Ticket className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No tickets found</h3>
                <p className="text-sm text-brand-slate">You haven't booked any movies yet.</p>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {bookings.map((booking, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col sm:flex-row">
                    {booking.movieImage && (
                      <div className="sm:w-32 h-48 sm:h-auto flex-shrink-0 relative">
                        <img src={booking.movieImage} alt={booking.movieTitle} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent sm:hidden" />
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-display font-bold text-white leading-tight">{booking.movieTitle}</h3>
                          <span className="text-xs bg-brand-crimson/20 text-brand-crimson px-2 py-1 rounded font-mono border border-brand-crimson/20">
                            #{booking.ticketNo}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="flex items-center gap-2 text-sm text-brand-slate">
                            <Calendar className="w-4 h-4 text-white/40" />
                            {new Date(booking.showDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-brand-slate">
                            <Clock className="w-4 h-4 text-white/40" />
                            {booking.showTime ? booking.showTime.slice(0, 5) : ''}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-brand-slate col-span-2">
                            <MapPin className="w-4 h-4 text-white/40" />
                            {booking.theatreName} <span className="opacity-50">({booking.screenName})</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-5 pt-4 border-t border-white/10 flex justify-between items-center">
                        <div className="text-sm">
                          <span className="text-brand-slate">Seat: </span>
                          <span className="text-white font-mono font-medium bg-white/10 px-2 py-0.5 rounded">{booking.seatNo}</span>
                        </div>
                        <div className="text-lg font-bold text-brand-gold">
                          ₹{booking.price}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
