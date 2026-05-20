import { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import SeatScene from "./SeatScene";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Environment } from "@react-three/drei";

export default function SeatTeaser() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const [isVisible, setIsVisible] = useState(false);

  // Only render 3D canvas when section is near viewport
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: "200px" } // Start loading 200px before visible
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    let ctx = gsap.context(() => {
      // Pinning the section & driving rotation via scroll
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "+=150%", // Scroll distance
        pin: true,
        scrub: 1, // Smooth scrub
        onUpdate: (self) => {
          // Map scroll progress to a rotation (e.g., PI/2 rads)
          rotationRef.current = self.progress * (Math.PI / 1.5);
        }
      });

      // Text fade in and slide up
      gsap.fromTo(textRef.current, 
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 1, ease: "power2.out",
          force3D: true,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 50%",
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="seat-teaser" ref={containerRef} className="relative w-full h-screen bg-brand-bg flex items-center justify-center overflow-hidden">
      
      {/* Absolute positioning for R3F Canvas — only render when visible */}
      <div className="absolute inset-0 z-0">
        {isVisible && (
          <Canvas 
            camera={{ position: [0, 8, 12], fov: 40 }}
            dpr={[1, 1.25]}
            gl={{ powerPreference: "high-performance", antialias: false, alpha: false }}
          >
            <color attach="background" args={["#0A0A0A"]} />
            <ambientLight intensity={0.1} />
            
            <spotLight position={[0, 10, 0]} intensity={50} color="#F8FAFC" angle={0.6} penumbra={1} />
            
            <SeatScene rotationRef={rotationRef} />
            
            <Environment preset="night" />
          </Canvas>
        )}
      </div>

      {/* Foreground UI overlay */}
      <div 
        ref={textRef}
        className="relative z-10 w-full max-w-7xl mx-auto px-6 pointer-events-none mt-[40vh] md:mt-0 flex flex-col items-center md:items-start text-center md:text-left"
      >
        <h2 className="font-display font-bold text-4xl sm:text-6xl md:text-7xl uppercase tracking-tighter leading-tight">
          Visual. <br />
          <span className="text-brand-crimson">Precision.</span>
        </h2>
        <p className="mt-6 text-brand-slate max-w-md text-lg tracking-wide bg-brand-bg/40 p-4 rounded-xl border border-white/5">
          Select your perfect view with our hyper-responsive 3D seat mapping engine. Every row, strictly defined in space.
        </p>

        {/* Legend */}
        <div className="mt-8 flex items-center justify-center md:justify-start gap-6 bg-brand-bg-alt/80 px-6 py-4 rounded-full border border-white/10">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-brand-crimson"></span>
            <span className="text-xs uppercase tracking-widest font-medium">VIP Premium</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-brand-indigo"></span>
            <span className="text-xs uppercase tracking-widest font-medium">Standard</span>
          </div>
        </div>
      </div>

    </section>
  );
}
