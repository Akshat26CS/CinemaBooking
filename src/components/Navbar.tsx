import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, Menu, User, LogOut, Shield } from "lucide-react";
import { cn } from "../lib/utils";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { MOVIES } from "../data/movies";
import BookingFlow, { BookingState, INITIAL_BOOKING } from "./BookingFlow";
import AuthModal, { AuthUser } from "./AuthModal";
import AdminPanel from "./AdminPanel";
import LocationModal from "./LocationModal";

gsap.registerPlugin(ScrollToPlugin);

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [booking, setBooking] = useState<BookingState>(INITIAL_BOOKING);

  // Auth state
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('cinepassToken') || '');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem('cinepassUser');
    return raw ? JSON.parse(raw) : null;
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Location state
  const [location, setLocation] = useState(() => localStorage.getItem("userLocation") || "New York");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const searchResults = MOVIES.filter(movie => 
    movie.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    movie.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock scroll when location modal is open
  useEffect(() => {
    if (isLocationModalOpen) {
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
  }, [isLocationModalOpen]);

  // Save location to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("userLocation", location);
  }, [location]);

  // Verify token on mount
  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Token invalid');
        return res.json();
      })
      .then(user => {
        if (!cancelled) {
          setCurrentUser(user);
          localStorage.setItem('cinepassUser', JSON.stringify(user));
        }
      })
      .catch(() => {
        if (!cancelled) {
          handleLogout();
        }
      });
    return () => { cancelled = true; };
  }, [authToken]);

  const handleAuthSuccess = ({ token, user }: { token: string; user: AuthUser }) => {
    setAuthToken(token);
    setCurrentUser(user);
    localStorage.setItem('cinepassToken', token);
    localStorage.setItem('cinepassUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setAuthToken('');
    setCurrentUser(null);
    localStorage.removeItem('cinepassToken');
    localStorage.removeItem('cinepassUser');
    setIsUserMenuOpen(false);
  };

  return (
    <nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
        scrolled ? "bg-brand-bg/95 border-white/5 py-4" : "bg-transparent py-6"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        
        {/* Left: Logo & Location */}
        <div className="flex items-center gap-8">
          <button 
            onClick={() => gsap.to(window, { duration: 1.5, scrollTo: 0, ease: "power4.inOut" })}
            className="font-display font-bold text-2xl tracking-tighter uppercase focus:outline-none"
          >
            Cinema<span className="text-brand-crimson">.</span>
          </button>
          
          <button 
            onClick={() => setIsLocationModalOpen(true)}
            className="hidden md:flex items-center gap-2 text-sm text-brand-slate hover:text-white transition-colors group"
          >
            <MapPin className="w-4 h-4 group-hover:text-brand-indigo transition-colors" />
            <span className="border-b border-brand-slate/30 group-hover:border-white transition-colors pb-0.5">
              {location}
            </span>
          </button>
        </div>

        {/* Center: Search */}
        <div ref={searchRef} className="hidden lg:flex flex-1 max-w-md mx-8 relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
            <Search className="w-4 h-4 text-brand-slate group-focus-within:text-brand-text transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search movies, formats, genres..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full relative z-0 bg-white/5 border border-white/10 rounded-full py-2.5 pl-12 pr-4 text-sm text-white placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-indigo/50 focus:bg-white/10 transition-all"
          />

          {/* Search Dropdown */}
          <AnimatePresence>
            {isDropdownOpen && searchQuery.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-brand-bg-alt border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto"
              >
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((movie) => (
                      <div 
                        key={movie.id}
                        onClick={() => {
                          setBooking({ ...INITIAL_BOOKING, step: "details", movie });
                          setIsDropdownOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <img src={movie.image} alt={movie.title} className="w-10 h-14 object-cover rounded" />
                        <div>
                          <h4 className="text-sm font-medium text-white">{movie.title}</h4>
                          <p className="text-xs text-brand-slate mt-1">{movie.formats?.[0]} • {movie.genres.join(", ")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-brand-slate text-sm">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 md:gap-6">
          <button className="lg:hidden text-brand-slate hover:text-white">
            <Search className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => gsap.to(window, { duration: 1.5, scrollTo: "#premium-formats", ease: "power4.inOut" })}
            className="hidden sm:flex text-sm font-medium hover:text-brand-crimson transition-colors"
          >
            Premium
          </button>
          <button 
            onClick={() => gsap.to(window, { duration: 1.5, scrollTo: "#seat-teaser", ease: "power4.inOut" })}
            className="hidden sm:flex text-sm font-medium hover:text-brand-indigo transition-colors"
          >
            Experience
          </button>

          <div className="w-[1px] h-4 bg-white/20 hidden sm:block"></div>

          {/* Auth Button / User Menu */}
          {currentUser ? (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity bg-white/10 text-white px-4 py-2 rounded-full border border-white/10"
              >
                <div className="w-6 h-6 rounded-full bg-brand-crimson flex items-center justify-center text-white text-xs font-bold">
                  {(currentUser.name || currentUser.email)?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {currentUser.name || currentUser.email.split('@')[0]}
                </span>
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-full mt-3 w-64 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden z-50 ring-1 ring-white/5"
                  >
                    {/* User info */}
                    <div className="px-5 py-4 border-b border-white/10 bg-white/5">
                      <p className="text-[15px] text-white font-semibold tracking-tight truncate">{currentUser.name || 'User'}</p>
                      <p className="text-xs text-white/60 truncate mt-0.5">{currentUser.email}</p>
                    </div>

                    <div className="p-2 space-y-1">
                      {/* Admin link */}
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => {
                            setIsAdminOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                        >
                          <div className="w-7 h-7 rounded-lg bg-brand-gold/10 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-4 h-4 text-brand-gold" />
                          </div>
                          <span className="font-medium">Admin Panel</span>
                        </button>
                      )}

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#ff453a] hover:bg-[#ff453a]/10 rounded-xl transition-all duration-200"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#ff453a]/10 flex items-center justify-center flex-shrink-0">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity bg-white text-black px-4 py-2 rounded-full"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
          
          <button className="sm:hidden text-brand-slate hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      <BookingFlow booking={booking} setBooking={setBooking} />

      <AnimatePresence>
        {isLocationModalOpen && (
          <LocationModal 
            currentLocation={location}
            onSelect={(loc) => {
              setLocation(loc);
              setIsLocationModalOpen(false);
            }}
            onClose={() => setIsLocationModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        open={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Admin Panel */}
      <AdminPanel
        open={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        token={authToken}
      />
    </nav>
  );
}
