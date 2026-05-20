import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, MapPin, Clock, Filter, SunMedium, Sunset, Armchair, Star } from "lucide-react";

/* ─── Types ─── */
export interface Cinema {
  id: number;
  name: string;
  location: string;
  distance: string;
  cancellable: boolean;
  formats: string[];
  showtimes: ShowtimeSlot[];
}

export interface ShowtimeSlot {
  time: string;
  format: string;
  availability: "available" | "filling-fast" | "almost-full";
}

export interface MovieData {
  id: number;
  title: string;
  format: string;
  time: string;
  image: string;
  genres?: string[];
}

/* ─── Mock cinema halls ─── */
const CINEMAS: Cinema[] = [
  {
    id: 1,
    name: "Cinepolis Orion Avenue Mall, Banaswadi",
    location: "Banaswadi, Bengaluru",
    distance: "0.4 km",
    cancellable: false,
    formats: ["DOLBY 7.1", "2K LASER DOLBY 7.1"],
    showtimes: [
      { time: "09:30 AM", format: "DOLBY 7.1", availability: "available" },
      { time: "12:45 PM", format: "DOLBY 7.1", availability: "available" },
      { time: "04:00 PM", format: "DOLBY 7.1", availability: "filling-fast" },
      { time: "04:40 PM", format: "DOLBY 7.1", availability: "available" },
      { time: "07:15 PM", format: "DOLBY 7.1", availability: "almost-full" },
      { time: "10:00 PM", format: "2K LASER DOLBY 7.1", availability: "available" },
      { time: "10:30 PM", format: "DOLBY 7.1", availability: "almost-full" },
    ],
  },
  {
    id: 2,
    name: "INOX Lido Mall, Ulsoor",
    location: "Ulsoor, Bengaluru",
    distance: "3.3 km",
    cancellable: true,
    formats: ["4K", "ATMOS"],
    showtimes: [
      { time: "08:00 AM", format: "4K", availability: "available" },
      { time: "09:00 AM", format: "4K", availability: "available" },
      { time: "12:15 PM", format: "ATMOS", availability: "filling-fast" },
      { time: "03:30 PM", format: "4K", availability: "available" },
      { time: "06:45 PM", format: "ATMOS", availability: "almost-full" },
      { time: "07:15 PM", format: "4K", availability: "available" },
      { time: "10:00 PM", format: "ATMOS", availability: "filling-fast" },
    ],
  },
  {
    id: 3,
    name: "Newfangled Miniplex, MG Road",
    location: "MG Road, Bengaluru",
    distance: "4.0 km",
    cancellable: false,
    formats: ["COUPLE SEATS"],
    showtimes: [
      { time: "12:00 PM", format: "COUPLE SEATS", availability: "available" },
      { time: "03:15 PM", format: "COUPLE SEATS", availability: "available" },
      { time: "06:30 PM", format: "COUPLE SEATS", availability: "filling-fast" },
      { time: "09:45 PM", format: "COUPLE SEATS", availability: "available" },
    ],
  },
  {
    id: 4,
    name: "INOX Garuda Mall, Magrath Road",
    location: "Magrath Road, Bengaluru",
    distance: "4.3 km",
    cancellable: true,
    formats: ["ATMOS", "IMAX"],
    showtimes: [
      { time: "09:25 AM", format: "ATMOS", availability: "available" },
      { time: "10:25 AM", format: "IMAX", availability: "filling-fast" },
      { time: "12:45 PM", format: "ATMOS", availability: "almost-full" },
      { time: "04:00 PM", format: "ATMOS", availability: "available" },
      { time: "07:15 PM", format: "ATMOS", availability: "available" },
      { time: "09:50 PM", format: "ATMOS", availability: "available" },
      { time: "10:30 PM", format: "ATMOS", availability: "filling-fast" },
    ],
  },
  {
    id: 5,
    name: "PVR Phoenix Marketcity",
    location: "Whitefield, Bengaluru",
    distance: "8.1 km",
    cancellable: true,
    formats: ["IMAX 3D", "4DX", "DOLBY ATMOS"],
    showtimes: [
      { time: "10:00 AM", format: "IMAX 3D", availability: "available" },
      { time: "01:15 PM", format: "4DX", availability: "available" },
      { time: "04:30 PM", format: "DOLBY ATMOS", availability: "filling-fast" },
      { time: "07:45 PM", format: "IMAX 3D", availability: "available" },
      { time: "10:30 PM", format: "4DX", availability: "almost-full" },
    ],
  },
  {
    id: 6,
    name: "Cinepolis Royal Meenakshi Mall",
    location: "Bannerghatta Road, Bengaluru",
    distance: "9.2 km",
    cancellable: true,
    formats: ["DOLBY 7.1", "SCREENX"],
    showtimes: [
      { time: "09:00 AM", format: "DOLBY 7.1", availability: "available" },
      { time: "11:45 AM", format: "SCREENX", availability: "filling-fast" },
      { time: "02:30 PM", format: "DOLBY 7.1", availability: "available" },
      { time: "05:15 PM", format: "SCREENX", availability: "available" },
      { time: "08:00 PM", format: "DOLBY 7.1", availability: "almost-full" },
      { time: "10:45 PM", format: "DOLBY 7.1", availability: "filling-fast" },
    ],
  },
  {
    id: 7,
    name: "PVR Vega City Mall",
    location: "Bannerghatta Road, Bengaluru",
    distance: "10.5 km",
    cancellable: false,
    formats: ["4K", "DOLBY ATMOS"],
    showtimes: [
      { time: "10:15 AM", format: "4K", availability: "available" },
      { time: "01:00 PM", format: "DOLBY ATMOS", availability: "available" },
      { time: "03:45 PM", format: "4K", availability: "filling-fast" },
      { time: "06:30 PM", format: "DOLBY ATMOS", availability: "almost-full" },
      { time: "09:15 PM", format: "4K", availability: "available" },
    ],
  },
  {
    id: 8,
    name: "INOX Mantri Square Mall",
    location: "Malleshwaram, Bengaluru",
    distance: "5.7 km",
    cancellable: true,
    formats: ["IMAX", "ATMOS", "4DX"],
    showtimes: [
      { time: "08:30 AM", format: "IMAX", availability: "available" },
      { time: "11:15 AM", format: "4DX", availability: "available" },
      { time: "02:00 PM", format: "ATMOS", availability: "filling-fast" },
      { time: "04:45 PM", format: "IMAX", availability: "available" },
      { time: "07:30 PM", format: "4DX", availability: "almost-full" },
      { time: "10:15 PM", format: "ATMOS", availability: "available" },
    ],
  },
  {
    id: 9,
    name: "Cinepolis Nexus Shantiniketan",
    location: "ITPL Road, Whitefield, Bengaluru",
    distance: "12.3 km",
    cancellable: false,
    formats: ["2K LASER", "DOLBY 7.1"],
    showtimes: [
      { time: "09:45 AM", format: "2K LASER", availability: "filling-fast" },
      { time: "12:30 PM", format: "DOLBY 7.1", availability: "available" },
      { time: "03:15 PM", format: "2K LASER", availability: "available" },
      { time: "06:00 PM", format: "DOLBY 7.1", availability: "almost-full" },
      { time: "08:45 PM", format: "2K LASER", availability: "available" },
      { time: "11:00 PM", format: "DOLBY 7.1", availability: "filling-fast" },
    ],
  },
  {
    id: 10,
    name: "PVR Orion East Mall",
    location: "Banaswadi, Bengaluru",
    distance: "1.8 km",
    cancellable: true,
    formats: ["DOLBY ATMOS", "4K LASER"],
    showtimes: [
      { time: "10:00 AM", format: "DOLBY ATMOS", availability: "available" },
      { time: "12:45 PM", format: "4K LASER", availability: "available" },
      { time: "03:30 PM", format: "DOLBY ATMOS", availability: "filling-fast" },
      { time: "06:15 PM", format: "4K LASER", availability: "available" },
      { time: "09:00 PM", format: "DOLBY ATMOS", availability: "almost-full" },
      { time: "11:15 PM", format: "4K LASER", availability: "available" },
    ],
  },
];

const FILTERS = [
  { label: "Morning", icon: SunMedium },
  { label: "After 5 PM", icon: Sunset },
  { label: "Recliners", icon: Armchair },
  { label: "Premium Seats", icon: Star },
];

/* ─── Helper: generate next 7 dates ─── */
function getDateRange(): { label: string; day: string; dayName: string; full: Date }[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const result = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    result.push({
      label: `${d.getDate()} ${months[d.getMonth()]}`,
      day: String(d.getDate()),
      dayName: i === 0 ? "Today" : i === 1 ? "Tomorrow" : days[d.getDay()],
      full: d,
    });
  }
  return result;
}

/* helper to check if a showtime is "morning" (<12) or "after 5" */
function parseHour(time: string): number {
  const [h, rest] = time.split(":");
  const isPM = rest.includes("PM");
  let hour = parseInt(h, 10);
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  return hour;
}

/* ─── Availability dot color ─── */
function availabilityColor(a: ShowtimeSlot["availability"]) {
  switch (a) {
    case "available": return "bg-brand-green";
    case "filling-fast": return "bg-brand-orange";
    case "almost-full": return "bg-brand-crimson";
  }
}

function availabilityBorder(a: ShowtimeSlot["availability"]) {
  switch (a) {
    case "available": return "border-white/10 hover:border-brand-green/60";
    case "filling-fast": return "border-brand-orange/30 hover:border-brand-orange/60";
    case "almost-full": return "border-brand-crimson/30 hover:border-brand-crimson/60 text-brand-crimson";
  }
}

/* ────────────────────────────── Component ────────────────────────────── */

interface Props {
  movie: MovieData;
  onBack: () => void;
  onSelectShowtime: (cinema: Cinema, showtime: ShowtimeSlot, date: string) => void;
}

export default function CinemaHalls({ movie, onBack, onSelectShowtime }: Props) {
  const dates = useMemo(() => getDateRange(), []);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const toggleFilter = (f: string) => {
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  /* Filter cinemas: show only those with at least one matching showtime */
  const filteredCinemas = useMemo(() => {
    return CINEMAS.map((cinema) => {
      let times = cinema.showtimes;
      if (activeFilters.includes("Morning")) {
        times = times.filter((s) => parseHour(s.time) < 12);
      }
      if (activeFilters.includes("After 5 PM")) {
        times = times.filter((s) => parseHour(s.time) >= 17);
      }
      return { ...cinema, showtimes: times };
    }).filter((c) => c.showtimes.length > 0);
  }, [activeFilters]);

  const selectedDateLabel = dates[selectedDateIdx].label;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-brand-bg overflow-y-auto hide-scrollbar"
      style={{ overscrollBehavior: "contain" }}
      data-lenis-prevent
    >
      {/* ─── Top Bar ─── */}
      <div className="sticky top-0 z-50 bg-brand-bg/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Movie mini-info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <img
              src={movie.image}
              alt={movie.title}
              className="w-12 h-16 rounded-lg object-cover border border-white/10 flex-shrink-0"
            />
            <div className="min-w-0">
              <h2 className="font-display font-bold text-lg sm:text-xl text-white truncate tracking-tight">
                {movie.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-brand-slate mt-0.5">
                <span className="px-1.5 py-0.5 border border-white/10 rounded text-[10px] uppercase tracking-wider">
                  {movie.format}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {movie.time}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Date Picker Strip ─── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3">
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {dates.map((d, i) => (
              <button
                key={i}
                onClick={() => setSelectedDateIdx(i)}
                className={`flex flex-col items-center px-4 py-2 rounded-xl text-xs transition-all flex-shrink-0 ${
                  selectedDateIdx === i
                    ? "bg-brand-crimson text-white"
                    : "bg-white/5 text-brand-slate hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="font-bold text-sm">{d.day}</span>
                <span className="text-[10px] uppercase tracking-wider mt-0.5">{d.dayName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Filter Pills ─── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-xs text-brand-slate hover:text-white hover:border-white/30 transition-colors flex-shrink-0">
              <Filter className="w-3.5 h-3.5" /> Filters
            </button>
            {FILTERS.map((f) => {
              const Icon = f.icon;
              const isActive = activeFilters.includes(f.label);
              return (
                <button
                  key={f.label}
                  onClick={() => toggleFilter(f.label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all flex-shrink-0 ${
                    isActive
                      ? "bg-white text-black border-white font-medium"
                      : "border-white/10 text-brand-slate hover:text-white hover:border-white/30"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Availability Legend ─── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-2">
        <div className="flex items-center gap-5 text-xs text-brand-slate">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-green" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-orange" /> Filling Fast</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-crimson" /> Almost Full</span>
        </div>
      </div>

      {/* ─── Cinema List ─── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-6">
        <div className="flex flex-col gap-4 mt-3">
          {filteredCinemas.length === 0 && (
            <div className="text-center py-20 text-brand-slate">
              <p className="text-lg">No shows found for the selected filters.</p>
              <p className="text-sm mt-2">Try adjusting your filters or selecting a different date.</p>
            </div>
          )}

          {filteredCinemas.map((cinema, idx) => (
            <motion.div
              key={cinema.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.04, 0.3), duration: 0.3 }}
              className="bg-brand-bg-alt/60 border border-white/5 rounded-2xl p-5 sm:p-6 hover:border-white/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-white text-base sm:text-lg leading-snug">
                    {cinema.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-brand-slate">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {cinema.distance} away
                    </span>
                    <span>•</span>
                    <span className={cinema.cancellable ? "text-brand-green" : "text-brand-slate"}>
                      {cinema.cancellable ? "Allows cancellation" : "Non-cancellable"}
                    </span>
                  </div>
                </div>
                <button className="p-2 rounded-full hover:bg-white/10 text-brand-slate hover:text-white transition-colors flex-shrink-0">
                  <Heart className="w-4 h-4" />
                </button>
              </div>

              {/* Showtime pills */}
              <div className="flex flex-wrap gap-2.5">
                {cinema.showtimes.map((st, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectShowtime(cinema, st, selectedDateLabel)}
                    className={`group relative flex flex-col items-center px-4 py-2.5 rounded-xl border transition-colors duration-150 hover:scale-[1.03] ${availabilityBorder(st.availability)}`}
                  >
                    <span className={`font-semibold text-sm tracking-wide ${
                      st.availability === "almost-full" ? "text-brand-crimson" : "text-white"
                    }`}>
                      {st.time}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-brand-slate mt-0.5">
                      {st.format}
                    </span>
                    <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${availabilityColor(st.availability)} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
