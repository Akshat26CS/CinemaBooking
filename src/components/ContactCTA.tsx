import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import gsap from "gsap";

export default function ContactCTA() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // Usually an API call happens here
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Subtle ambient glow floating effect
    gsap.to(".ambient-glow", {
      y: "15px",
      x: "-10px",
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 3
    });
  }, []);

  return (
    <footer ref={containerRef} className="relative w-full min-h-[90vh] bg-[#050505] flex flex-col justify-between overflow-hidden pt-32 pb-12">
      
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-brand-crimson/8 rounded-full blur-[80px] pointer-events-none ambient-glow -translate-y-1/2" />
      <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-brand-indigo/8 rounded-full blur-[90px] pointer-events-none ambient-glow -translate-y-1/2" />
      
      {/* Main Content */}
      <div className="flex-grow flex flex-col items-center justify-center px-6 relative z-10 w-full max-w-4xl mx-auto">
        <h2 className="font-display font-bold text-5xl sm:text-7xl md:text-8xl tracking-tighter uppercase text-center mb-12 text-white">
          Your Seat<br/>Awaits.
        </h2>
        
        <form onSubmit={handleSubmit} className="w-full max-w-md relative group">
          <input 
            type="email" 
            required
            placeholder="Enter Email for Early Access" 
            className="w-full bg-transparent border-b border-white/20 px-4 py-4 text-center text-lg text-white placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-text transition-colors peer"
            disabled={isSubmitted}
          />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-brand-crimson to-brand-indigo transition-all duration-500 peer-focus:w-full" />
          
          <div className="mt-8 flex justify-center">
            <button 
              disabled={isSubmitted}
              className="relative flex items-center justify-center w-auto min-w-[160px] h-12 bg-white text-black rounded-full font-medium tracking-widest uppercase text-sm hover:scale-105 transition-transform disabled:hover:scale-100 disabled:opacity-90 overflow-hidden"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {!isSubmitted ? (
                  <motion.div
                    key="default"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    Request Access
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="submitted"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center gap-2 text-green-600"
                  >
                    <Check className="w-5 h-5 flex-shrink-0" />
                    Confirmed
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </form>
      </div>

      {/* Grid Layout Footer */}
      <div className="relative z-10 w-full grid grid-cols-2 md:grid-cols-4 gap-6 px-8 mt-24 text-xs font-mono text-brand-slate/60 uppercase tracking-widest">
        <div className="flex flex-col gap-2">
          <a href="#" className="hover:text-white transition-colors">Instagram</a>
          <a href="#" className="hover:text-white transition-colors">Twitter (X)</a>
        </div>
        <div className="flex flex-col gap-2 md:text-center md:items-center">
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
        <div className="flex flex-col gap-2 hidden md:flex md:items-center md:text-center">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
        </div>
        <div className="flex flex-col gap-2 items-end md:text-right">
          <a href="#" className="hover:text-white transition-colors">Contact</a>
          <a href="#" className="hover:text-white transition-colors">Press</a>
        </div>
      </div>
    </footer>
  );
}
