import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FiltersBar from "./components/FiltersBar";
import PremiumFormats from "./components/PremiumFormats";
import NowShowing from "./components/NowShowing";
import SeatTeaser from "./components/SeatTeaser";
import ContactCTA from "./components/ContactCTA";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

export default function App() {
  useEffect(() => {
    // Basic GSAP Setup — register before creating triggers
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis for smoother scrolling
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    lenis.on('scroll', ScrollTrigger.update);

    // Store ref so cleanup removes the same function
    const rafCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(rafCallback);
    gsap.ticker.lagSmoothing(0);
    
    // Refresh ScrollTrigger on resize to ensure pins align
    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      ScrollTrigger.getAll().forEach(t => t.kill());
      gsap.ticker.remove(rafCallback);
      lenis.destroy();
    };
  }, []);

  return (
    <main className="w-full min-h-screen bg-brand-bg text-brand-text selection:bg-brand-crimson selection:text-white">
      <Navbar />
      <Hero />
      <FiltersBar />
      <PremiumFormats />
      <NowShowing />
      <SeatTeaser />
      <ContactCTA />
    </main>
  );
}
