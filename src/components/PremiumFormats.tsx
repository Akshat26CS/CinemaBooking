import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X as XIcon } from "lucide-react";
import { createPortal } from "react-dom";

const FORMATS = [
  { 
    name: "IMAX with Laser", 
    desc: "Next-generation 4K laser projection system. Experience uncompromising image quality, extraordinary brightness, and a dramatically expanded color gamut.", 
    accent: "text-blue-400",
    bgAccent: "bg-blue-500/20",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2000&auto=format&fit=crop" 
  },
  { 
    name: "Director's Cut", 
    desc: "Intimate screening rooms with fully reclining leather seats. Enjoy our curated gourmet menu and artisanal cocktails delivered straight to your seat.", 
    accent: "text-yellow-500", 
    bgAccent: "bg-yellow-500/20",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2000&auto=format&fit=crop" 
  },
  { 
    name: "4DX Experience", 
    desc: "Engage all your senses. Synchronized motion seats and environmental effects like wind, fog, and scents put you directly inside the action.", 
    accent: "text-brand-crimson", 
    bgAccent: "bg-brand-crimson/20",
    image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2000&auto=format&fit=crop" 
  },
  { 
    name: "ScreenX 270°", 
    desc: "A revolutionary multi-projection system that extends the screen onto the theater walls, providing a truly panoramic and immersive 270-degree viewing experience.", 
    accent: "text-brand-indigo", 
    bgAccent: "bg-brand-indigo/30",
    image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=2000&auto=format&fit=crop" 
  }
];

export default function PremiumFormats() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<typeof FORMATS[0] | null>(null);

  // Lock scroll when modal is open
  useEffect(() => {
    if (selectedFormat) {
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
  }, [selectedFormat]);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo(".format-item",
        { opacity: 0, x: -30 },
        {
          opacity: 1, x: 0, duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          force3D: true,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 60%",
          }
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="premium-formats" ref={containerRef} className="w-full min-h-screen flex flex-col justify-center bg-brand-bg py-24 sm:py-32 border-y border-white/5 relative overflow-hidden">
      
      {/* Dynamic Background Image — only render the active one */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          key={FORMATS[activeIndex].name}
          src={FORMATS[activeIndex].image} 
          alt={FORMATS[activeIndex].name} 
          className="w-full h-full object-cover opacity-40 transition-opacity duration-700" 
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-bg via-brand-bg/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-transparent to-brand-bg" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full flex flex-col lg:flex-row gap-16 lg:items-center">
        
        {/* Left: Titles List */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <header className="mb-8">
            <h2 className="font-display font-medium text-brand-slate text-sm tracking-widest uppercase mb-6 flex items-center gap-4">
              <span className="w-8 h-[1px] bg-brand-slate"></span>
              Curated Experiences
            </h2>
            <p className="text-4xl sm:text-6xl font-bold uppercase tracking-tighter text-white leading-tight">
              Pinnacle of <br/> Luxury
            </p>
          </header>

          <div className="flex flex-col gap-4 mt-4">
            {FORMATS.map((format, i) => (
              <div 
                key={format.name}
                className="format-item group cursor-pointer py-2"
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => setActiveIndex(i)}
              >
                <div className="flex items-center gap-6">
                  {/* Indicator Dot */}
                  <div className={`w-2 h-2 rounded-full transition-all duration-500 ${i === activeIndex ? "bg-white scale-100" : "bg-transparent scale-0"}`} />
                  
                  <h3 className={`font-display text-4xl sm:text-5xl font-bold tracking-tight transition-all duration-500 ${i === activeIndex ? "text-white translate-x-2" : "text-white/20 hover:text-white/50"}`}>
                    {format.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Detail Panel */}
        <div className="w-full lg:w-1/2 min-h-[350px] flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-black/60 backdrop-blur-md p-8 sm:p-12 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden w-full group"
            >
              <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[80px] ${FORMATS[activeIndex].bgAccent} transition-colors duration-500 pointer-events-none`} />
              
              <div className={`text-xs tracking-widest uppercase font-mono mb-8 ${FORMATS[activeIndex].accent} flex items-center gap-3`}>
                <span className="opacity-60">Format</span>
                <span className="w-8 h-[1px] bg-current opacity-30"></span>
                <span>0{activeIndex + 1}</span>
              </div>
              
              <h4 className="text-3xl font-display font-bold text-white mb-6">
                {FORMATS[activeIndex].name}
              </h4>
              
              <p className="text-brand-slate/90 leading-relaxed font-light mb-10 text-lg">
                {FORMATS[activeIndex].desc}
              </p>
              
              <button 
                onClick={() => setSelectedFormat(FORMATS[activeIndex])}
                className="flex items-center gap-3 text-sm uppercase tracking-widest font-medium text-white group/btn">
                <span className="border-b border-transparent group-hover/btn:border-white transition-colors pb-1">
                  Explore Format
                </span>
                <ArrowRight className={`w-4 h-4 group-hover/btn:translate-x-2 transition-transform ${FORMATS[activeIndex].accent}`} />
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Modal Overlay */}
      {createPortal(
        <AnimatePresence>
          {selectedFormat && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-brand-bg/90 backdrop-blur-xl flex items-center justify-center p-6"
            >
              <div className="absolute inset-0" onClick={() => setSelectedFormat(null)} />
              
              <motion.div 
                initial={{ y: 20, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 20, scale: 0.95 }}
                className="relative max-w-2xl w-full bg-brand-bg-alt border border-white/10 rounded-[2rem] p-8 sm:p-12 overflow-hidden shadow-2xl"
              >
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] ${selectedFormat.bgAccent} pointer-events-none opacity-50`} />
                
                <button 
                  onClick={() => setSelectedFormat(null)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-brand-slate hover:text-white transition-colors z-10"
                >
                  <XIcon className="w-5 h-5" />
                </button>

                <div className={`text-xs tracking-widest uppercase font-mono mb-6 ${selectedFormat.accent} flex items-center gap-3`}>
                  <span>Premium Format</span>
                  <span className="w-8 h-[1px] bg-current opacity-30"></span>
                </div>

                <h3 className="font-display text-3xl sm:text-4xl font-bold text-white mb-6">
                  {selectedFormat.name}
                </h3>
                
                <p className="text-brand-slate text-lg leading-relaxed mb-8">
                  {selectedFormat.desc}
                </p>

                <div className="p-6 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-sm mb-8">
                  <h4 className="text-sm font-medium text-white uppercase tracking-widest mb-4">Why choose this format?</h4>
                  <ul className="flex flex-col gap-3 text-sm text-brand-slate">
                    <li className="flex items-center gap-3">
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedFormat.accent.replace('text-', 'bg-')}`}></span>
                      Unparalleled immersion and detail
                    </li>
                    <li className="flex items-center gap-3">
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedFormat.accent.replace('text-', 'bg-')}`}></span>
                      State-of-the-art audiovisual technology
                    </li>
                    <li className="flex items-center gap-3">
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedFormat.accent.replace('text-', 'bg-')}`}></span>
                      The ultimate cinematic experience
                    </li>
                  </ul>
                </div>

                <button 
                  onClick={() => setSelectedFormat(null)}
                  className="w-full py-4 rounded-full bg-white text-black font-medium text-sm tracking-widest uppercase hover:bg-white/90 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
}
