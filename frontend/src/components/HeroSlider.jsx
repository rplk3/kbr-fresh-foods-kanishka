import { useState, useEffect, useCallback } from 'react';

/**
 * HeroSlider — Full-width hero banner with auto-sliding background images.
 *
 * Props:
 *   images   – Array of 3 image URLs
 *   badge    – { icon: ReactNode, text: string }
 *   title    – string | ReactNode
 *   subtitle – string | ReactNode
 *   interval – ms between slides (default 5000)
 */
export default function HeroSlider({ images = [], badge, title, subtitle, interval = 5000 }) {
  const [current, setCurrent] = useState(0);
  const count = images.length || 1;

  const next = useCallback(() => setCurrent((c) => (c + 1) % count), [count]);

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(next, interval);
    return () => clearInterval(id);
  }, [next, interval, count]);

  return (
    <div className="relative overflow-hidden rounded-3xl mb-10 text-white shadow-xl">
      {/* Sliding background images */}
      <div className="absolute inset-0">
        {images.map((src, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out bg-cover bg-center"
            style={{
              backgroundImage: `url('${src}')`,
              opacity: current === i ? 1 : 0,
            }}
          />
        ))}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-900/85 via-brand-900/60 to-brand-700/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 px-8 md:px-14 py-14 md:py-20 text-center">
        {badge && (
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
            {badge.icon}
            {badge.text}
          </div>
        )}

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold mb-4 drop-shadow-lg">
          {title}
        </h1>

        {subtitle && (
          <p className="text-brand-100 text-base md:text-lg max-w-2xl mx-auto drop-shadow leading-relaxed">
            {subtitle}
          </p>
        )}

        {/* Dot indicators */}
        {count > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-500 ${
                  current === i
                    ? 'w-8 bg-brand-400'
                    : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
