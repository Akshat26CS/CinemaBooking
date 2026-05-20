import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, X, Play, Users, Info, Ticket } from "lucide-react";
import CinemaHalls from "./CinemaHalls";
import SeatSelector from "./SeatSelector";
import PaymentPage from "./PaymentPage";
import ImageLoader from "./ImageLoader";
import MagneticButton from "./MagneticButton";
import type { Cinema, ShowtimeSlot } from "./CinemaHalls";
import type { SelectedSeat } from "./PaymentPage";

export type BookingStep = null | "details" | "cinemas" | "seats" | "payment";

export interface BookingState {
  step: BookingStep;
  movie: any | null;
  cinema: Cinema | null;
  showtime: ShowtimeSlot | null;
  date: string;
  selectedSeats: SelectedSeat[];
  totalPrice: number;
}

export const INITIAL_BOOKING: BookingState = {
  step: null,
  movie: null,
  cinema: null,
  showtime: null,
  date: "",
  selectedSeats: [],
  totalPrice: 0,
};

interface BookingFlowProps {
  booking: BookingState;
  setBooking: React.Dispatch<React.SetStateAction<BookingState>>;
}

export default function BookingFlow({ booking, setBooking }: BookingFlowProps) {
  const closeAll = () => setBooking(INITIAL_BOOKING);
  const goToCinemas = () => setBooking((prev) => ({ ...prev, step: "cinemas" }));
  const goToSeats = (cinema: Cinema, showtime: ShowtimeSlot, date: string) => 
    setBooking((prev) => ({ ...prev, step: "seats", cinema, showtime, date }));
  const goToPayment = (seats: SelectedSeat[], totalPrice: number) =>
    setBooking((prev) => ({ ...prev, step: "payment", selectedSeats: seats, totalPrice }));
  const backToDetails = () => 
    setBooking((prev) => ({ ...prev, step: "details", cinema: null, showtime: null, date: "" }));
  const backToCinemas = () => 
    setBooking((prev) => ({ ...prev, step: "cinemas", showtime: null }));
  const backToSeats = () =>
    setBooking((prev) => ({ ...prev, step: "seats", selectedSeats: [], totalPrice: 0 }));

  if (!booking.step) return null;

  return createPortal(
    <>
      {/* ═════════════════ Movie Details Modal ═════════════════ */}
      <AnimatePresence>
        {booking.step === "details" && booking.movie && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-brand-bg/90 backdrop-blur-md"
            onClick={closeAll}
            data-lenis-prevent
          >
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 15, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-brand-bg-alt border border-white/10 rounded-2xl shadow-2xl hide-scrollbar"
            >
              {/* Close Button */}
              <button 
                onClick={closeAll}
                className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white transition-colors hover:text-black rounded-full backdrop-blur-md text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col md:flex-row">
                {/* Image Section */}
                <div className="w-full md:w-2/5 relative aspect-video md:aspect-[3/4]">
                  <ImageLoader 
                    src={booking.movie.image} 
                    alt={booking.movie.title} 
                    containerClassName="absolute inset-0 w-full h-full"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-brand-bg-alt via-brand-bg-alt/50 to-transparent" />
                </div>

                {/* Content Section */}
                <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col justify-center relative">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-2 py-1 text-[10px] uppercase tracking-widest border border-white/20 rounded text-brand-slate font-medium">
                      {booking.movie.formats?.[0] || booking.movie.format || "Standard"}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-brand-slate font-mono">
                      <Clock className="w-4 h-4"/> {booking.movie.time}
                    </span>
                  </div>
                  
                  <h3 className="font-display font-bold text-3xl sm:text-5xl text-white mb-6 uppercase tracking-tighter">
                    {booking.movie.title}
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <h4 className="flex items-center gap-2 text-sm uppercase tracking-widest text-brand-slate mb-2">
                        <Info className="w-4 h-4"/> Synopsis
                      </h4>
                      <p className="text-white/80 leading-relaxed font-light text-sm sm:text-base">
                        {booking.movie.synopsis}
                      </p>
                    </div>

                    <div>
                      <h4 className="flex items-center gap-2 text-sm uppercase tracking-widest text-brand-slate mb-2">
                        <Users className="w-4 h-4"/> Key Cast
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {booking.movie.cast.map((actor: string) => (
                          <span key={actor} className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-white/90">
                            {actor}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 flex flex-col sm:flex-row gap-4">
                    {booking.movie.comingSoon ? (
                      <div className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 text-brand-slate rounded-full font-medium uppercase tracking-widest text-sm cursor-default">
                        <Clock className="w-4 h-4" /> Coming Soon
                      </div>
                    ) : (
                      <MagneticButton className="flex-1 w-full" onClick={goToCinemas}>
                        <div className="flex items-center justify-center gap-2 py-4 bg-brand-crimson hover:bg-brand-crimson/90 text-white rounded-full font-medium uppercase tracking-widest text-sm transition-all text-center">
                          <Ticket className="w-4 h-4" /> Book Now
                        </div>
                      </MagneticButton>
                    )}
                    {booking.movie.trailerLink && (
                      <a 
                        href={booking.movie.trailerLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-4 border border-white/20 hover:border-white rounded-full font-medium uppercase tracking-widest text-sm transition-colors text-white"
                      >
                        <Play className="w-4 h-4" /> Watch Trailer
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═════════════════ Cinema Halls View ═════════════════ */}
      <AnimatePresence>
        {booking.step === "cinemas" && booking.movie && (
          <CinemaHalls
            movie={booking.movie}
            onBack={backToDetails}
            onSelectShowtime={goToSeats}
          />
        )}
      </AnimatePresence>

      {/* ═════════════════ Seat Selector View ═════════════════ */}
      <AnimatePresence>
        {booking.step === "seats" && booking.movie && booking.cinema && booking.showtime && (
          <SeatSelector
            movie={booking.movie}
            cinema={booking.cinema}
            showtime={booking.showtime}
            date={booking.date}
            onBack={backToCinemas}
            onClose={closeAll}
            onProceed={goToPayment}
          />
        )}
      </AnimatePresence>

      {/* ═════════════════ Payment View ═════════════════ */}
      <AnimatePresence>
        {booking.step === "payment" && booking.movie && booking.cinema && booking.showtime && (
          <PaymentPage
            movie={booking.movie}
            cinema={booking.cinema}
            showtime={booking.showtime}
            date={booking.date}
            seats={booking.selectedSeats}
            totalPrice={booking.totalPrice}
            onBack={backToSeats}
            onClose={closeAll}
          />
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
