import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X as XIcon, Monitor } from "lucide-react";
import type { Cinema, ShowtimeSlot } from "./CinemaHalls";

/* ─── Types ─── */
interface SeatData {
  row: string;
  number: number;
  status: "available" | "occupied" | "gap";
}

interface PricingTier {
  label: string;
  price: number;
  rows: string[];
  seats: SeatData[][];
}

/* ─── Seeded PRNG (mulberry32) ─── */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ─── Convert showtime string to a numeric seed ─── */
function showtimeToSeed(time: string): number {
  let hash = 0;
  for (let i = 0; i < time.length; i++) {
    const char = time.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

/* ─── Generate seat layout with a seed so each showtime is different but consistent ─── */
function generateSeatLayout(seed: number): PricingTier[] {
  const rng = mulberry32(seed);

  function makeRow(row: string, count: number, startNum: number, occupiedRate: number): SeatData[] {
    const seats: SeatData[] = [];
    for (let i = 0; i < count; i++) {
      const num = startNum - i;
      if (num <= 0) break;
      const r = rng();
      if (r < 0.06) {
        seats.push({ row, number: num, status: "gap" });
      } else if (r < 0.06 + occupiedRate) {
        seats.push({ row, number: num, status: "occupied" });
      } else {
        seats.push({ row, number: num, status: "available" });
      }
    }
    return seats;
  }

  return [
    {
      label: "RECLINER LOUNGE",
      price: 350,
      rows: ["N", "M"],
      seats: [
        makeRow("N", 14, 14, 0.55),
        makeRow("M", 14, 14, 0.5),
      ],
    },
    {
      label: "PREMIUM PLUS",
      price: 290,
      rows: ["L", "K"],
      seats: [
        makeRow("L", 18, 18, 0.45),
        makeRow("K", 18, 18, 0.4),
      ],
    },
    {
      label: "PREMIUM",
      price: 270,
      rows: ["J", "I", "H", "G", "F", "E", "D"],
      seats: [
        makeRow("J", 20, 22, 0.42),
        makeRow("I", 20, 22, 0.38),
        makeRow("H", 22, 24, 0.35),
        makeRow("G", 22, 24, 0.32),
        makeRow("F", 22, 24, 0.28),
        makeRow("E", 24, 26, 0.25),
        makeRow("D", 24, 26, 0.2),
      ],
    },
  ];
}

/* ─── Seat SVG: rounded chair-back shape ─── */
function SeatIcon({ status, number, isSelected }: { status: string; number: number; isSelected: boolean }) {
  if (status === "occupied") {
    return (
      <svg viewBox="0 0 28 28" className="w-full h-full">
        <path
          d="M4 22 V10 Q4 4 14 4 Q24 4 24 10 V22"
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1.2"
          rx="4"
        />
        <rect x="3" y="21" width="22" height="4" rx="2" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      </svg>
    );
  }

  if (isSelected) {
    return (
      <svg viewBox="0 0 28 28" className="w-full h-full">
        <defs>
          <linearGradient id={`sel-${number}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E11D48" />
            <stop offset="100%" stopColor="#9f1239" />
          </linearGradient>
        </defs>
        <path
          d="M4 22 V10 Q4 4 14 4 Q24 4 24 10 V22"
          fill={`url(#sel-${number})`}
          stroke="#fb7185"
          strokeWidth="1.2"
        />
        <rect x="3" y="21" width="22" height="4" rx="2" fill="#E11D48" stroke="#fb7185" strokeWidth="1" />
        <text x="14" y="16" textAnchor="middle" fontSize="8" fontWeight="600" fill="white" fontFamily="monospace">{number}</text>
      </svg>
    );
  }

  // Available
  return (
    <svg viewBox="0 0 28 28" className="w-full h-full">
      <path
        d="M4 22 V10 Q4 4 14 4 Q24 4 24 10 V22"
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.2"
      />
      <rect x="3" y="21" width="22" height="4" rx="2" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <text x="14" y="16" textAnchor="middle" fontSize="8" fontWeight="500" fill="rgba(255,255,255,0.55)" fontFamily="monospace">{number}</text>
    </svg>
  );
}

/* ────────────────────────────── Component ────────────────────────────── */

interface Props {
  movie: { title: string; image: string; format: string; time: string };
  cinema: Cinema;
  showtime: ShowtimeSlot;
  date: string;
  onBack: () => void;
  onClose: () => void;
  onProceed: (seats: { row: string; number: number; price: number }[], totalPrice: number) => void;
}

export default function SeatSelector({ movie, cinema, showtime, date, onBack, onClose, onProceed }: Props) {
  const [selectedSeats, setSelectedSeats] = useState<Map<string, { row: string; number: number; price: number }>>(
    new Map()
  );
  const [activeShowtime, setActiveShowtime] = useState(showtime.time);

  // Each showtime gets a unique deterministic layout
  const layout = useMemo(() => generateSeatLayout(showtimeToSeed(activeShowtime)), [activeShowtime]);

  const handleShowtimeSwitch = useCallback((time: string) => {
    setActiveShowtime(time);
    setSelectedSeats(new Map()); // Clear selections when switching
  }, []);

  const toggleSeat = useCallback(
    (row: string, num: number, price: number) => {
      const key = `${row}${num}`;
      setSelectedSeats((prev) => {
        const next = new Map(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.set(key, { row, number: num, price });
        }
        return next;
      });
    },
    []
  );

  const totalPrice = useMemo(() => {
    let sum = 0;
    selectedSeats.forEach((s) => (sum += s.price));
    return sum;
  }, [selectedSeats]);

  const seatCount = selectedSeats.size;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-brand-bg flex flex-col"
      data-lenis-prevent
    >
      {/* ─── Top Header ─── */}
      <div className="flex-shrink-0 bg-brand-bg/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center min-w-0">
            <h2 className="font-display font-bold text-lg text-white truncate tracking-tight">
              {movie.title}
            </h2>
            <p className="text-xs text-brand-slate mt-0.5 truncate">
              {date}, {activeShowtime} at {cinema.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Showtime Strip ─── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-3">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {cinema.showtimes.map((st, i) => (
              <button
                key={i}
                onClick={() => handleShowtimeSwitch(st.time)}
                className={`flex flex-col items-center px-4 py-2 rounded-xl border text-xs transition-all flex-shrink-0 ${
                  activeShowtime === st.time
                    ? "bg-brand-crimson/15 border-brand-crimson/50 text-white"
                    : st.availability === "almost-full"
                    ? "border-brand-crimson/30 text-brand-crimson hover:border-brand-crimson/60"
                    : "border-white/10 text-brand-slate hover:border-white/30 hover:text-white"
                }`}
              >
                <span className="font-semibold text-sm">{st.time}</span>
                <span className="text-[9px] uppercase tracking-widest mt-0.5 opacity-70">
                  {st.format}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Seat Map ─── */}
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-32" style={{ overscrollBehavior: "contain" }}>
        <div className="max-w-4xl mx-auto px-2 sm:px-6 py-6">
          {layout.map((tier, tIdx) => (
            <div key={tIdx} className="mb-6">
              {/* Tier label */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/5" />
                <div className="px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
                  <span className="text-[11px] sm:text-xs font-display font-semibold uppercase tracking-[0.2em] text-brand-slate whitespace-nowrap">
                    {tier.label} &mdash; <span className="text-brand-gold">₹{tier.price}</span>
                  </span>
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/5" />
              </div>

              {/* Rows */}
              <div className="flex flex-col gap-[2px]">
                {tier.seats.map((row, rIdx) => {
                  const rowLabel = tier.rows[rIdx];
                  return (
                    <div key={rIdx} className="flex items-center gap-1 sm:gap-2 justify-center">
                      {/* Row label */}
                      <span className="w-5 sm:w-6 text-right text-[10px] sm:text-xs font-mono text-brand-slate/60 font-semibold flex-shrink-0">
                        {rowLabel}
                      </span>

                      {/* Seats */}
                      <div className="flex gap-[2px] sm:gap-[3px] justify-center">
                        {row.map((seat, sIdx) => {
                          const key = `${seat.row}${seat.number}`;
                          const isSelected = selectedSeats.has(key);

                          if (seat.status === "gap") {
                            return (
                              <div key={sIdx} className="w-6 h-7 sm:w-7 sm:h-8" />
                            );
                          }

                          if (seat.status === "occupied") {
                            return (
                              <div key={sIdx} className="w-6 h-7 sm:w-7 sm:h-8 opacity-40 cursor-not-allowed">
                                <SeatIcon status="occupied" number={seat.number} isSelected={false} />
                              </div>
                            );
                          }

                          return (
                            <button
                              key={sIdx}
                              onClick={() => toggleSeat(seat.row, seat.number, tier.price)}
                              className={`w-6 h-7 sm:w-7 sm:h-8 transition-transform duration-150 active:scale-90 ${
                                isSelected
                                  ? "scale-110"
                                  : "hover:scale-110"
                              }`}
                            >
                              <SeatIcon status="available" number={seat.number} isSelected={isSelected} />
                            </button>
                          );
                        })}
                      </div>

                      {/* Right row label */}
                      <span className="w-5 sm:w-6 text-left text-[10px] sm:text-xs font-mono text-brand-slate/60 font-semibold flex-shrink-0">
                        {rowLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* ─── Screen Indicator ─── */}
          <div className="mt-8 flex flex-col items-center">
            <div className="w-[65%] max-w-sm h-[3px] bg-gradient-to-r from-transparent via-brand-crimson/50 to-transparent rounded-full" />
            <div className="w-[55%] max-w-xs h-10 bg-gradient-to-b from-brand-crimson/8 to-transparent rounded-b-[60%]" />
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-brand-slate/70 font-semibold -mt-1">
              <Monitor className="w-3.5 h-3.5" /> Screen
            </div>
          </div>

          {/* ─── Legend ─── */}
          <div className="mt-8 flex items-center justify-center gap-5 sm:gap-8 flex-wrap pb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-7">
                <SeatIcon status="available" number={0} isSelected={false} />
              </div>
              <span className="text-[11px] text-brand-slate">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-7 opacity-40">
                <SeatIcon status="occupied" number={0} isSelected={false} />
              </div>
              <span className="text-[11px] text-brand-slate">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-7">
                <SeatIcon status="available" number={0} isSelected={true} />
              </div>
              <span className="text-[11px] text-brand-slate">Selected</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Booking Bar ─── */}
      <AnimatePresence>
        {seatCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[10000] bg-brand-bg-alt/95 backdrop-blur-md border-t border-white/10"
          >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-display font-semibold text-lg">
                  {seatCount} {seatCount === 1 ? "Seat" : "Seats"} Selected
                </p>
                <p className="text-brand-slate text-sm mt-0.5">
                  {Array.from(selectedSeats.values())
                    .map((s) => `${s.row}${s.number}`)
                    .join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-brand-slate uppercase tracking-wider">Total</p>
                  <p className="text-xl font-display font-bold text-brand-gold">
                    ₹{totalPrice}
                  </p>
                </div>
                <button
                  onClick={() => onProceed(Array.from(selectedSeats.values()), totalPrice)}
                  className="px-6 sm:px-8 py-3 bg-brand-crimson hover:bg-brand-crimson/90 text-white rounded-full font-medium uppercase tracking-widest text-sm transition-colors"
                >
                  Proceed
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
