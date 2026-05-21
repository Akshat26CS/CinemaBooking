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

export default function App() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Refresh ScrollTrigger on resize to ensure pins align
    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      ScrollTrigger.getAll().forEach(t => t.kill());
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
