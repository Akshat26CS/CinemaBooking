import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import ExploreOverlay from "./ExploreOverlay";

const CATEGORIES = ["Movies", "Events", "Plays", "Sports", "Activities", "Buzz"];
const FORMATS = ["IMAX 2D", "IMAX 3D", "4DX", "Dolby Atmos", "ScreenX"];
const GENRES = ["Action", "Sci-Fi", "Drama", "Thriller", "Horror", "Comedy"];

export default function FiltersBar() {
  const [activeFilter, setActiveFilter] = useState<{ title: string; type: "Category" | "Format" | "Genre" } | null>(null);

  // Lock page scroll when overlay is open
  useEffect(() => {
    if (activeFilter) {
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
  }, [activeFilter]);

  // Listen for custom event to open explore overlay from anywhere
  useEffect(() => {
    const handleOpenExplore = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string; type: "Category" | "Format" | "Genre" }>;
      setActiveFilter(customEvent.detail);
    };
    window.addEventListener("open-explore", handleOpenExplore);
    return () => window.removeEventListener("open-explore", handleOpenExplore);
  }, []);

  return (
    <>
      <div className="relative z-20 w-full bg-brand-bg-alt/80 border-y border-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row gap-4 md:items-center justify-between">
          
          {/* Categories (District.in / BookMyShow style) */}
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-2 md:pb-0 hide-scrollbar">
            {CATEGORIES.map((cat, i) => (
              <button 
                key={cat}
                onClick={() => setActiveFilter({ title: cat, type: "Category" })}
                className={`text-sm font-medium whitespace-nowrap transition-colors ${i === 0 ? 'text-brand-crimson' : 'text-brand-slate hover:text-white'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="hidden md:block w-[1px] h-6 bg-white/10"></div>

          {/* Formats & Genres */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar hide-scrollbar">
            {FORMATS.slice(0,3).map(format => (
              <button 
                key={format} 
                onClick={() => setActiveFilter({ title: format, type: "Format" })}
                className="text-xs uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/10 text-brand-slate whitespace-nowrap hover:border-white/30 hover:text-white transition-colors cursor-pointer"
              >
                {format}
              </button>
            ))}
            <div className="w-[1px] h-4 bg-white/10 mx-2"></div>
            {GENRES.slice(0,3).map(genre => (
              <button 
                key={genre} 
                onClick={() => setActiveFilter({ title: genre, type: "Genre" })}
                className="text-xs uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/10 text-brand-slate whitespace-nowrap hover:border-white/30 hover:text-white transition-colors cursor-pointer"
              >
                {genre}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Portal for Explore Overlay */}
      {createPortal(
        <AnimatePresence>
          {activeFilter && (
            <ExploreOverlay
              title={activeFilter.title}
              type={activeFilter.type}
              onClose={() => setActiveFilter(null)}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
