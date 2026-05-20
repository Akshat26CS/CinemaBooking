import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { X as XIcon, Compass, Sparkles, Ticket, Clock } from "lucide-react";
import { MOVIES } from "../data/movies";
import BookingFlow, { BookingState, INITIAL_BOOKING } from "./BookingFlow";

/* ─── Shared TiltCard (Copied from NowShowing for reuse here) ─── */
function TiltCard({ movie, onClick }: { movie: typeof MOVIES[0], onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="relative w-full aspect-[3/4] group rounded-2xl cursor-pointer will-change-transform"
    >
      <div 
        className={`absolute inset-0 bg-gradient-to-t ${movie.accent} to-transparent rounded-2xl opacity-0 group-hover:opacity-60 blur-xl transition-opacity duration-700`}
        style={{ transform: "translateZ(-50px)" }}
      />
      
      <div 
        className="absolute inset-0 rounded-2xl overflow-hidden bg-brand-bg-alt/50 border border-white/5 flex flex-col"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
        <img 
          src={movie.image} 
          alt={movie.title}
          loading="lazy"
          className="absolute inset-0 object-cover w-full h-full opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-500 ease-out will-change-transform"
        />
        
        <div 
          className="relative z-20 flex flex-col h-full justify-end p-6 md:p-8"
          style={{ transform: "translateZ(30px)" }}
        >
          <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-brand-slate mb-3">
            <span className="px-2 py-0.5 border border-white/20 rounded bg-black/50 backdrop-blur-sm">{movie.formats?.[0] || "Standard"}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {movie.time}</span>
          </div>
          <h3 className="font-display font-medium text-2xl sm:text-3xl leading-tight text-white mb-6">
            {movie.title}
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {movie.showtimes.map((time, i) => (
              <span key={i} className="text-xs font-mono bg-white/10 hover:bg-white/20 border border-white/5 hover:border-white/30 text-white px-2 py-1 rounded transition-colors">
                {time}
              </span>
            ))}
          </div>
          
          <div className="overflow-hidden">
            <button className="w-full py-3 sm:py-4 border border-white/20 rounded-full font-medium text-sm tracking-widest uppercase bg-white/5 translate-y-[120%] group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out hover:bg-white hover:text-black hover:border-white">
              View Details & Book
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface Props {
  title: string;
  type: "Category" | "Format" | "Genre";
  onClose: () => void;
}

export default function ExploreOverlay({ title, type, onClose }: Props) {
  const [booking, setBooking] = useState<BookingState>(INITIAL_BOOKING);

  // Determine if we should show the Movie Grid or the Coming Soon skeleton
  const isMovieSection = title === "Movies" || type === "Format" || type === "Genre";

  // Filter movies based on selection
  const filteredMovies = MOVIES.filter(movie => {
    if (title === "Movies") return true; // Show all
    if (type === "Format") {
      return movie.formats.some(f => f.toLowerCase().includes(title.toLowerCase()));
    }
    if (type === "Genre") {
      return movie.genres.some(g => g.toLowerCase().includes(title.toLowerCase()));
    }
    return true;
  });

  // Generate some placeholder cards for the "Coming Soon" vibe
  const placeholders = Array.from({ length: 8 });

  const openDetails = (movie: typeof MOVIES[0]) => {
    setBooking({ ...INITIAL_BOOKING, step: "details", movie });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-brand-bg flex flex-col overflow-y-auto hide-scrollbar"
      style={{ overscrollBehavior: "contain" }}
      data-lenis-prevent
    >
      {/* ─── Header ─── */}
      <div className="sticky top-0 z-50 flex-shrink-0 bg-brand-bg/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-brand-slate">
              {type === "Category" ? <Compass className="w-5 h-5" /> : type === "Format" ? <Sparkles className="w-5 h-5" /> : <Ticket className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-brand-slate font-medium">
                Exploring {type}
              </p>
              <h2 className="font-display font-bold text-lg sm:text-xl text-white tracking-tight">
                {title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-brand-slate transition-all group"
          >
            <XIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-12">
        
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-16 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-brand-indigo/20 blur-[60px] rounded-full pointer-events-none" />
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl sm:text-6xl font-bold text-white mb-4 tracking-tighter"
          >
            Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-indigo to-brand-crimson">{title}</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-brand-slate text-sm sm:text-base leading-relaxed"
          >
            {isMovieSection 
              ? `Explore our curated selection of ${title !== "Movies" ? title : ""} experiences. Book your tickets now for an unforgettable cinematic journey.`
              : `We're currently curating the best experiences for this section. Check back soon for exclusive ${title.toLowerCase()} content.`
            }
          </motion.p>
        </div>

        {isMovieSection ? (
          /* Real Movie Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMovies.length > 0 ? (
              filteredMovies.map((movie, idx) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(0.1 + idx * 0.05, 0.4), duration: 0.4 }}
                >
                  <TiltCard movie={movie} onClick={() => openDetails(movie)} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center text-brand-slate">
                <p className="text-lg">No movies found for "{title}"</p>
                <button onClick={onClose} className="mt-4 text-brand-crimson hover:text-white transition-colors">Go Back</button>
              </div>
            )}
          </div>
        ) : (
          /* Skeleton Grid for Non-Movie sections */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {placeholders.map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-brand-bg-alt border border-white/5"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="w-1/2 h-4 bg-white/10 rounded mb-2" />
                  <div className="w-3/4 h-3 bg-white/5 rounded" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>

      <BookingFlow booking={booking} setBooking={setBooking} />
    </motion.div>
  );
}
