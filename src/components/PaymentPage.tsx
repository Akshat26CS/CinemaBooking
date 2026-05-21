import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X as XIcon, CreditCard, Smartphone, Building2, ChevronRight, ShieldCheck, Clock, MapPin, Ticket, Check, Loader2 } from "lucide-react";
import type { Cinema, ShowtimeSlot } from "./CinemaHalls";
import MagneticButton from "./MagneticButton";
import ImageLoader from "./ImageLoader";

/* ─── Types ─── */
export interface SelectedSeat {
  row: string;
  number: number;
  price: number;
}

interface Props {
  movie: { id?: number; title: string; image: string; format: string; time: string };
  cinema: Cinema;
  showtime: ShowtimeSlot;
  date: string;
  seats: SelectedSeat[];
  totalPrice: number;
  onBack: () => void;
  onClose: () => void;
}

/* ─── Payment Methods ─── */
const UPI_APPS = [
  { name: "Google Pay", icon: "G", color: "bg-blue-500" },
  { name: "PhonePe", icon: "P", color: "bg-purple-600" },
  { name: "Paytm", icon: "₹", color: "bg-sky-500" },
  { name: "BHIM UPI", icon: "B", color: "bg-emerald-600" },
];

const CARD_OFFERS = [
  { bank: "HDFC Bank", discount: "10% off up to ₹150", code: "HDFC150" },
  { bank: "ICICI Bank", discount: "₹75 cashback", code: "ICICI75" },
  { bank: "SBI Card", discount: "5% off up to ₹100", code: "SBI100" },
];

type PaymentMethod = "upi" | "card" | "netbanking" | null;

/* ────────────────────────────── Component ────────────────────────────── */

export default function PaymentPage({ movie, cinema, showtime, date, seats, totalPrice, onBack, onClose }: Props) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [appliedOffer, setAppliedOffer] = useState<string | null>(null);

  const convenienceFee = 49;
  const gst = Math.round((totalPrice + convenienceFee) * 0.18);
  const discount = appliedOffer ? Math.min(Math.round(totalPrice * 0.1), 150) : 0;
  const finalAmount = totalPrice + convenienceFee + gst - discount;

  const seatLabels = seats.map(s => `${s.row}${s.number}`).join(", ");

  const [bookingId, setBookingId] = useState<string>('');

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('cinepassToken');
      // Try to persist booking to backend
      if (token) {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            showId: 1, // Fallback
            movieId: movie.id,
            theatreName: cinema.name,
            showTime: showtime.time,
            showDate: date,
            seats: seats.map(s => ({ seatNo: `${s.row}${s.number}`, price: s.price })),
            totalPrice: finalAmount,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setBookingId(data.bookingId || `CRD${Date.now().toString(36).toUpperCase().slice(-8)}`);
        } else {
          setBookingId(`CRD${Date.now().toString(36).toUpperCase().slice(-8)}`);
        }
      } else {
        setBookingId(`CRD${Date.now().toString(36).toUpperCase().slice(-8)}`);
      }
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsProcessing(false);
      setIsSuccess(true);
    } catch {
      // Fallback: show success even if API fails
      setBookingId(`CRD${Date.now().toString(36).toUpperCase().slice(-8)}`);
      setIsProcessing(false);
      setIsSuccess(true);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 16);
    return v.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) return v.slice(0, 2) + "/" + v.slice(2);
    return v;
  };

  /* ─── Success Screen ─── */
  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[9999] bg-brand-bg flex items-center justify-center"
        data-lenis-prevent
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="w-full max-w-md mx-4 text-center"
        >
          {/* Success animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-brand-green/20 border-2 border-brand-green flex items-center justify-center mx-auto mb-8"
          >
            <Check className="w-12 h-12 text-brand-green" />
          </motion.div>

          <h2 className="font-display font-bold text-3xl text-white mb-2">Booking Confirmed!</h2>
          <p className="text-brand-slate mb-8">Your tickets have been booked successfully</p>

          {/* Ticket card */}
          <div className="bg-brand-bg-alt border border-white/10 rounded-2xl overflow-hidden mb-8">
            {/* Movie header */}
            <div className="flex items-center gap-4 p-5 border-b border-white/5">
              <img src={movie.image} alt={movie.title} className="w-14 h-20 object-cover rounded-lg" />
              <div className="text-left">
                <h3 className="font-display font-bold text-lg text-white">{movie.title}</h3>
                <p className="text-xs text-brand-slate mt-1">{movie.format} • {movie.time}</p>
              </div>
            </div>

            {/* Booking details */}
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-brand-slate uppercase tracking-widest">Cinema</span>
                <span className="text-sm text-white font-medium text-right max-w-[200px] truncate">{cinema.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-brand-slate uppercase tracking-widest">Date & Time</span>
                <span className="text-sm text-white font-medium">{date}, {showtime.time}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-brand-slate uppercase tracking-widest">Seats</span>
                <span className="text-sm text-white font-medium">{seatLabels}</span>
              </div>
              <div className="border-t border-dashed border-white/10 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-brand-slate uppercase tracking-widest">Amount Paid</span>
                <span className="text-lg text-brand-gold font-display font-bold">₹{finalAmount}</span>
              </div>
            </div>

            {/* Booking ID */}
            <div className="bg-white/[0.03] px-5 py-3 border-t border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-brand-slate uppercase tracking-widest">Booking ID</span>
                <span className="text-sm text-white font-mono font-semibold">
                  {bookingId || `CRD${Date.now().toString(36).toUpperCase().slice(-8)}`}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 bg-white text-black rounded-full font-medium uppercase tracking-widest text-sm transition-colors hover:bg-white/90"
          >
            Done
          </button>
        </motion.div>
      </motion.div>
    );
  }

  /* ─── Main Payment UI ─── */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-brand-bg flex flex-col"
      data-lenis-prevent
    >
      {/* ─── Top Header ─── */}
      <div className="flex-shrink-0 bg-brand-bg/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center min-w-0">
            <h2 className="font-display font-bold text-lg text-white truncate tracking-tight">
              Payment
            </h2>
            <p className="text-xs text-brand-slate mt-0.5">
              Complete your booking
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="flex-1 overflow-y-auto hide-scrollbar" style={{ overscrollBehavior: "contain" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">

          {/* ═══ Left Column: Payment Methods ═══ */}
          <div className="flex-1 space-y-5">

            {/* ─── Booking Summary Card ─── */}
            <div className="bg-brand-bg-alt/60 border border-white/5 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <ImageLoader 
                  src={movie.image} 
                  alt={movie.title} 
                  containerClassName="w-12 h-16 flex-shrink-0"
                  className="w-full h-full object-cover rounded-lg border border-white/10" 
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-white text-sm truncate">{movie.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-brand-slate">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{cinema.name.split(",")[0]}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{date}, {showtime.time}</span>
                    <span className="flex items-center gap-1"><Ticket className="w-3 h-3" />{seatLabels}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Offers ─── */}
            <div className="bg-brand-bg-alt/60 border border-white/5 rounded-2xl p-4 sm:p-5">
              <h4 className="text-xs uppercase tracking-widest text-brand-slate font-medium mb-3">Available Offers</h4>
              <div className="space-y-2">
                {CARD_OFFERS.map((offer) => (
                  <button
                    key={offer.code}
                    onClick={() => setAppliedOffer(appliedOffer === offer.code ? null : offer.code)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors text-left ${
                      appliedOffer === offer.code
                        ? "bg-brand-green/10 border-brand-green/40"
                        : "bg-white/[0.02] border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div>
                      <p className="text-sm text-white font-medium">{offer.bank}</p>
                      <p className="text-xs text-brand-slate mt-0.5">{offer.discount}</p>
                    </div>
                    {appliedOffer === offer.code ? (
                      <div className="w-6 h-6 rounded-full bg-brand-green flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    ) : (
                      <span className="text-[10px] uppercase tracking-widest text-brand-crimson font-semibold">Apply</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Payment Methods ─── */}
            <div className="bg-brand-bg-alt/60 border border-white/5 rounded-2xl p-4 sm:p-5">
              <h4 className="text-xs uppercase tracking-widest text-brand-slate font-medium mb-4">Payment Method</h4>

              {/* UPI */}
              <button
                onClick={() => setSelectedMethod(selectedMethod === "upi" ? null : "upi")}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors mb-2 ${
                  selectedMethod === "upi" ? "bg-white/5 border-white/20" : "border-white/5 hover:border-white/15"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-white font-medium">UPI</p>
                    <p className="text-[11px] text-brand-slate">Google Pay, PhonePe, Paytm & more</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-brand-slate transition-transform ${selectedMethod === "upi" ? "rotate-90" : ""}`} />
              </button>

              <AnimatePresence>
                {selectedMethod === "upi" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-2 pb-3 space-y-3">
                      {/* UPI Apps */}
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {UPI_APPS.map((app) => (
                          <button key={app.name} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/20 transition-colors">
                            <div className={`w-10 h-10 ${app.color} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
                              {app.icon}
                            </div>
                            <span className="text-[10px] text-brand-slate">{app.name}</span>
                          </button>
                        ))}
                      </div>
                      {/* UPI ID input */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Enter UPI ID (e.g. name@upi)"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-indigo/50 transition-colors"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Card */}
              <button
                onClick={() => setSelectedMethod(selectedMethod === "card" ? null : "card")}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors mb-2 ${
                  selectedMethod === "card" ? "bg-white/5 border-white/20" : "border-white/5 hover:border-white/15"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-indigo/15 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-brand-indigo" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-white font-medium">Credit / Debit Card</p>
                    <p className="text-[11px] text-brand-slate">Visa, Mastercard, RuPay</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-brand-slate transition-transform ${selectedMethod === "card" ? "rotate-90" : ""}`} />
              </button>

              <AnimatePresence>
                {selectedMethod === "card" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-2 pb-3 space-y-3 mt-2">
                      <input
                        type="text"
                        placeholder="Card Number"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-indigo/50 transition-colors font-mono tracking-wider"
                      />
                      <input
                        type="text"
                        placeholder="Cardholder Name"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-indigo/50 transition-colors"
                      />
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          maxLength={5}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-indigo/50 transition-colors font-mono"
                        />
                        <input
                          type="password"
                          placeholder="CVV"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                          maxLength={3}
                          className="w-24 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-indigo/50 transition-colors font-mono"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Net Banking */}
              <button
                onClick={() => setSelectedMethod(selectedMethod === "netbanking" ? null : "netbanking")}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
                  selectedMethod === "netbanking" ? "bg-white/5 border-white/20" : "border-white/5 hover:border-white/15"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/15 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-brand-orange" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-white font-medium">Net Banking</p>
                    <p className="text-[11px] text-brand-slate">All major banks supported</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-brand-slate transition-transform ${selectedMethod === "netbanking" ? "rotate-90" : ""}`} />
              </button>

              <AnimatePresence>
                {selectedMethod === "netbanking" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-2 pb-3 mt-2 grid grid-cols-2 gap-2">
                      {["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak", "Yes Bank"].map((bank) => (
                        <button key={bank} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/20 transition-colors text-sm text-white text-left">
                          {bank}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Security note */}
            <div className="flex items-center gap-3 px-4 py-3">
              <ShieldCheck className="w-4 h-4 text-brand-green flex-shrink-0" />
              <p className="text-[11px] text-brand-slate">
                Your payment is secured with 256-bit SSL encryption. We never store your card details.
              </p>
            </div>
          </div>

          {/* ═══ Right Column: Price Breakdown (visible on lg+) ═══ */}
          <div className="w-full lg:w-80 lg:sticky lg:top-6 self-start">
            <div className="bg-brand-bg-alt/60 border border-white/5 rounded-2xl p-5">
              <h4 className="text-xs uppercase tracking-widest text-brand-slate font-medium mb-4">Order Summary</h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-slate">Tickets ({seats.length}×)</span>
                  <span className="text-white font-medium">₹{totalPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-slate">Convenience Fee</span>
                  <span className="text-white font-medium">₹{convenienceFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-slate">GST (18%)</span>
                  <span className="text-white font-medium">₹{gst}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-brand-green">
                    <span>Discount</span>
                    <span className="font-medium">-₹{discount}</span>
                  </div>
                )}
                <div className="border-t border-white/5 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Total</span>
                    <span className="text-xl font-display font-bold text-brand-gold">₹{finalAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Pay Bar ─── */}
      <div className="flex-shrink-0 bg-brand-bg-alt/95 backdrop-blur-md border-t border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-brand-slate uppercase tracking-wider">Total Amount</p>
            <p className="text-xl font-display font-bold text-brand-gold">₹{finalAmount}</p>
          </div>
          <MagneticButton disabled={!selectedMethod || isProcessing} onClick={handlePay}>
            <div
              className={`px-8 sm:px-10 py-3.5 bg-brand-crimson hover:bg-brand-crimson/90 text-white rounded-full font-medium uppercase tracking-widest text-sm transition-colors flex items-center gap-2 ${(!selectedMethod || isProcessing) ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Pay ₹{finalAmount}</>
              )}
            </div>
          </MagneticButton>
        </div>
      </div>
    </motion.div>
  );
}
