import { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Clock } from "lucide-react";
import { MOVIES } from "../data/movies";
import BookingFlow, { BookingState, INITIAL_BOOKING } from "./BookingFlow";
import ImageLoader from "./ImageLoader";

function TiltCard({ movie, onClick }: { movie: typeof MOVIES[0] & { comingSoon?: boolean }, onClick: () => void }) {
  const isComingSoon = !!(movie as any).comingSoon;
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
        <ImageLoader 
          src={movie.image} 
          alt={movie.title}
          containerClassName="absolute inset-0 w-full h-full"
          className="w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-500 ease-out will-change-transform"
          loading="lazy"
        />
        
        <div 
          className="relative z-20 flex flex-col h-full justify-end p-6 md:p-8"
          style={{ transform: "translateZ(30px)" }}
        >
          <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-brand-slate mb-3">
            <span className="px-2 py-0.5 border border-white/20 rounded bg-black/50 backdrop-blur-sm">{movie.format}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {movie.time}</span>
          </div>
          <h3 className="font-display font-medium text-2xl sm:text-3xl leading-tight text-white mb-6">
            {movie.title}
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {isComingSoon ? (
              <span className="text-xs font-mono bg-brand-crimson/20 border border-brand-crimson/40 text-brand-crimson px-3 py-1 rounded backdrop-blur-md">
                Coming Soon
              </span>
            ) : (
              movie.showtimes.map((time, i) => (
                <span key={i} className="text-xs font-mono bg-white/10 hover:bg-white/20 border border-white/5 hover:border-white/30 text-white px-2 py-1 rounded transition-colors">
                  {time}
                </span>
              ))
            )}
          </div>
          
          <div className="overflow-hidden">
            <button className="w-full py-3 sm:py-4 border border-white/20 rounded-full font-medium text-sm tracking-widest uppercase bg-white/5 translate-y-[120%] group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out hover:bg-white hover:text-black hover:border-white">
              {isComingSoon ? "View Details" : "View Details & Book"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function NowShowing() {
  const containerRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [booking, setBooking] = useState<BookingState>(INITIAL_BOOKING);
  const [activeFilter, setActiveFilter] = useState("Showing Now");

  /* ─── GSAP animations ─── */
  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo(headingRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 1,
          ease: "power2.out",
          force3D: true,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
          }
        }
      );

      const cards = gsap.utils.toArray(".grid-item");
      gsap.fromTo(cards,
        { y: 80, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          force3D: true,
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 85%",
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);  // Run once

  // Lock page scroll when any overlay is open
  useEffect(() => {
    if (booking.step) {
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
  }, [booking.step]);

  /* ─── Navigation helpers ─── */
  const openDetails = (movie: typeof MOVIES[0]) => {
    setBooking({ ...INITIAL_BOOKING, step: "details", movie });
  };

  const moviesToShow =
    activeFilter === "Showing Now"
      ? MOVIES.slice(0, 3)
      : activeFilter === "Trending"
      ? MOVIES.slice(0, 3)
      : activeFilter === "Coming Soon"
      ? MOVIES.filter((m) => (m as any).comingSoon)
      : MOVIES.slice(0, 3);

  return (
    <section id="now-showing" ref={containerRef} className="relative z-10 w-full bg-brand-bg px-6 py-24 sm:py-32">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div ref={headingRef}>
            <h2 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter text-white">
              Recommended<br/><span className="text-brand-slate font-light">For You</span>
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar">
            {["Showing Now", "Trending", "Coming Soon"].map((filter) => (
              <button 
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`whitespace-nowrap uppercase tracking-widest text-xs sm:text-sm font-medium transition-colors pb-1 border-b ${
                  activeFilter === filter 
                    ? "text-white border-white" 
                    : "text-brand-slate border-transparent hover:text-white hover:border-white/50"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </header>

        <div 
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 perspective-[2000px]"
        >
          {moviesToShow.map((movie) => (
            <div key={movie.id} className="grid-item">
              <TiltCard movie={movie} onClick={() => openDetails(movie)} />
            </div>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-explore", { detail: { title: "Movies", type: "Category" } }))}
            className="px-8 py-4 border border-brand-crimson/50 text-brand-crimson hover:bg-brand-crimson hover:text-white rounded-full font-medium tracking-widest uppercase text-sm transition-all duration-300"
          >
            View All Movies
          </button>
        </div>
      </div>

      <BookingFlow booking={booking} setBooking={setBooking} />
    </section>
  );
}
