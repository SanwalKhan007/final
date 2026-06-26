import { useEffect, useRef, useState } from "react";
import heroSuit from "@/assets/hero-suit.jpg";
import heroShirt from "@/assets/hero-shirt.jpg";
import heroDenim from "@/assets/hero-denim.jpg";

type Slide = {
  image: string;
  kicker: string;
  title: string;
  subtitle: string;
};

const SLIDES: Slide[] = [
  {
    image: heroSuit,
    kicker: "Signature",
    title: "Formal Collection",
    subtitle: "Sharp tailoring for the modern gentleman.",
  },
  {
    image: heroShirt,
    kicker: "Everyday",
    title: "Essential Shirts",
    subtitle: "Precision-cut cotton, built to last.",
  },
  {
    image: heroDenim,
    kicker: "Heritage",
    title: "Selvedge Denim",
    subtitle: "Raw indigo, woven with intent.",
  },
];

export default function HeroCarousel({ onShop }: { onShop?: () => void }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) setIndex((i) => (i + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const go = (i: number) => setIndex((i + SLIDES.length) % SLIDES.length);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-black select-none"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
    >
      <div className="relative aspect-[16/9] md:aspect-[21/9] w-full">
        <div
          className="flex h-full w-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {SLIDES.map((s, i) => (
            <div key={i} className="relative h-full w-full flex-shrink-0">
              <img
                src={s.image}
                alt={s.title}
                width={1920}
                height={1080}
                loading={i === 0 ? "eager" : "lazy"}
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              <div className="relative z-10 h-full max-w-7xl mx-auto px-6 md:px-10 flex flex-col justify-end pb-16 md:pb-24 text-white">
                <span className="text-[10px] md:text-xs font-mono uppercase tracking-[0.3em] opacity-80 mb-3">
                  — {s.kicker}
                </span>
                <h2 className="text-4xl md:text-7xl font-extrabold tracking-tighter leading-[0.95] max-w-[14ch]">
                  {s.title}
                </h2>
                <p className="mt-4 text-sm md:text-base opacity-80 max-w-[40ch]">
                  {s.subtitle}
                </p>
                <button
                  onClick={onShop}
                  className="mt-6 self-start bg-white text-black px-7 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors"
                >
                  Shop Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Arrows */}
        <button
          aria-label="Previous slide"
          onClick={() => go(index - 1)}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-colors"
        >
          ‹
        </button>
        <button
          aria-label="Next slide"
          onClick={() => go(index + 1)}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-colors"
        >
          ›
        </button>

        {/* Dots */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => go(i)}
              className={`h-1.5 transition-all duration-300 ${
                i === index ? "w-8 bg-white" : "w-3 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
