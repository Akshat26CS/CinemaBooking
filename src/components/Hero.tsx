import { useEffect, useRef } from "react";
import HeroScene from "./HeroScene";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !textRef.current) return;

    let ctx = gsap.context(() => {
      // Scale up and fade out the whole text block as user scrolls down
      gsap.to(textRef.current, {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.5,
        },
        scale: 1.1,
        opacity: 0,
        y: 100,
        force3D: true,
        ease: "none",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative w-full h-screen overflow-hidden flex items-center justify-center p-6">
      {/* 3D Scene rendered in background */}
      <HeroScene />
      
      {/* Content */}
      <div 
        ref={textRef} 
        className="relative z-10 flex flex-col items-center justify-center text-center max-w-5xl mt-20 md:mt-24 pointer-events-none"
      >
        <div className="px-4 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm mb-6 uppercase tracking-widest text-[10px] md:text-xs">
          The Ultimate Ticketing Experience
        </div>

        <h1 className="font-display font-bold text-6xl sm:text-8xl md:text-[9rem] tracking-tighter leading-[0.85] uppercase mb-6">
          Cinema.
          <br className="md:hidden"/>
          <span className="bg-gradient-to-br from-brand-text via-brand-text to-brand-slate bg-clip-text text-transparent">
            Redefined.
          </span>
        </h1>
        
        <p className="text-lg md:text-2xl text-brand-slate font-light tracking-wide max-w-2xl mb-12">
          Experience movies in ultra-premium luxury. Book your seats in seconds with our immersive 3D layout.
        </p>
        
        {/* Magnetic/Liquid CTA Button */}
        <div className="relative group perspective-1000 pointer-events-auto">
          <div className="absolute inset-[-2px] rounded-full bg-gradient-to-r from-brand-crimson to-brand-indigo opacity-75 group-hover:opacity-100 transition-opacity duration-500 blur-sm group-hover:blur-md" />
          <button 
            onClick={() => gsap.to(window, { duration: 1.5, scrollTo: "#now-showing", ease: "power4.inOut" })}
            className="relative flex items-center gap-4 bg-brand-bg px-8 py-4 rounded-full font-display font-medium text-lg tracking-wide border border-transparent hover:border-brand-crimson hover:scale-105 transition-all duration-300"
          >
            Explore Now Showing
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-16 sm:bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 opacity-60">
        <span className="text-xs uppercase tracking-[0.2em] font-light">Explore</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-brand-text to-transparent animate-pulse" />
      </div>
    </section>
  );
}
