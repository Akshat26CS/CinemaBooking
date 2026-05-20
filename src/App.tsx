import { useEffect, lazy, Suspense } from "react";
import Navbar from "./components/Navbar";
const Hero = lazy(() => import("./components/Hero"));
const FiltersBar = lazy(() => import("./components/FiltersBar"));
const PremiumFormats = lazy(() => import("./components/PremiumFormats"));
const NowShowing = lazy(() => import("./components/NowShowing"));
const SeatTeaser = lazy(() => import("./components/SeatTeaser"));
const ContactCTA = lazy(() => import("./components/ContactCTA"));
const BookingFlow = lazy(() => import("./BookingFlow"));
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
      <Suspense fallback={null}><Hero /></Suspense>
      <Suspense fallback={null}><FiltersBar /></Suspense>
      <Suspense fallback={null}><PremiumFormats /></Suspense>
      <Suspense fallback={null}><NowShowing /></Suspense>
      <Suspense fallback={null}><SeatTeaser /></Suspense>
      <Suspense fallback={null}><ContactCTA /></Suspense>
      <Suspense fallback={null}><BookingFlow /></Suspense>
      
      {/* Example of prefetch trigger on interaction */}
      <button 
        onMouseEnter={() => import("./BookingFlow")} 
        className="hidden"
      >
        Prefetch
      </button>
    </main>
  );
}
