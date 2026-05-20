import { useState } from "react";
import { motion } from "framer-motion";
import { X, MapPin, Navigation, Search, Loader2 } from "lucide-react";

const POPULAR_CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", 
  "Chennai", "Kolkata", "Surat", "Pune", "Jaipur",
  "New York", "London", "Dubai", "Singapore", "Sydney"
];

interface Props {
  currentLocation: string;
  onSelect: (location: string) => void;
  onClose: () => void;
}

export default function LocationModal({ currentLocation, onSelect, onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const filteredCities = POPULAR_CITIES.filter(city => 
    city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAutoDetect = () => {
    setIsLoading(true);
    setErrorMsg("");

    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use OpenStreetMap Nominatim API for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10&addressdetails=1`
          );
          const data = await response.json();
          
          const city = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state;
          
          if (city) {
            onSelect(city);
          } else {
            setErrorMsg("Could not determine city from coordinates.");
          }
        } catch (error) {
          setErrorMsg("Failed to fetch location data.");
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setIsLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMsg("Location access denied. Please allow location access or select manually.");
        } else {
          setErrorMsg("Failed to get your location.");
        }
      },
      { timeout: 10000 }
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-brand-bg/90 backdrop-blur-md"
      onClick={onClose}
      data-lenis-prevent
    >
      <motion.div 
        initial={{ y: 20, scale: 0.95, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 20, scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-brand-bg-alt border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-brand-slate hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="font-display font-bold text-2xl text-white mb-2">
            Select Location
          </h3>
          <p className="text-brand-slate text-sm">
            Current location: <span className="text-white font-medium">{currentLocation}</span>
          </p>
        </div>

        {/* Search & Auto Detect */}
        <div className="p-6 border-b border-white/5 space-y-4">
          <button 
            onClick={handleAutoDetect}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-indigo/10 hover:bg-brand-indigo/20 text-brand-indigo border border-brand-indigo/30 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Navigation className="w-5 h-5" />
            )}
            Auto Detect My Location
          </button>
          
          {errorMsg && (
            <p className="text-brand-crimson text-xs text-center">{errorMsg}</p>
          )}

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate" />
            <input 
              type="text"
              placeholder="Search for your city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-indigo/50 transition-colors"
            />
          </div>
        </div>

        {/* Popular Cities List */}
        <div className="p-6 overflow-y-auto hide-scrollbar flex-1">
          <h4 className="text-xs uppercase tracking-widest text-brand-slate font-medium mb-4">
            {searchQuery ? "Search Results" : "Popular Cities"}
          </h4>
          
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {filteredCities.length > 0 ? (
              filteredCities.map(city => (
                <button
                  key={city}
                  onClick={() => onSelect(city)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                    currentLocation === city 
                      ? "bg-white/10 border-white/30 text-white" 
                      : "bg-white/5 border-white/5 text-brand-slate hover:text-white hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <MapPin className="w-4 h-4 opacity-70" />
                  <span className="text-sm font-medium">{city}</span>
                </button>
              ))
            ) : (
              <p className="col-span-2 text-center text-brand-slate text-sm py-4">
                No cities found matching "{searchQuery}"
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
