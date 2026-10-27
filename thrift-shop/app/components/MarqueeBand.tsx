'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '../../lib/motion/gsap';
import { EASE, prefersReducedMotion } from '../../lib/motion/tokens';

const WORDS = [
  'SUSTAINABLE LUXURY',
  'CURATED SECOND-HAND',
  'DESIGNER WITHOUT THE TAG',
  'STYLE THAT LASTS',
  'MERY ROSE',
];

/**
 * A drifting brand band.
 *
 * The ticker runs on its own clock, but it leans into the scroll: fast
 * scrolling winds it up, slow scrolling lets it settle. The content is
 * rendered twice and translated by exactly half, so the loop is seamless
 * without a single jump.
 */
export default function MarqueeBand() {
  const track = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !track.current) return;

      const ticker = gsap.to(track.current, {
        xPercent: -50,
        duration: 34,
        ease: 'none',
        repeat: -1,
      });

      // Scroll velocity feeds the time scale, so the band reacts to the
      // reader instead of floating past them at a fixed speed.
      const trigger = gsap.to({}, {
        scrollTrigger: {
          trigger: band.current,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            const velocity = self.getVelocity();
            const boost = gsap.utils.clamp(0, 4, Math.abs(velocity) / 850);
            gsap.to(ticker, {
              timeScale: 1 + boost,
              duration: 0.45,
              ease: EASE.standard,
              overwrite: true,
            });
          },
        },
      });

      return () => {
        trigger.scrollTrigger?.kill();
        trigger.kill();
        ticker.kill();
      };
    },
    [],
  );

  const strip = (
    <div className="flex shrink-0 items-center">
      {WORDS.map((word) => (
        <span key={word} className="flex items-center">
          <span className="px-6 sm:px-10 font-light tracking-[0.25em] uppercase text-sm sm:text-base md:text-lg whitespace-nowrap">
            {word}
          </span>
          <span className="text-xs opacity-40 select-none">✦</span>
        </span>
      ))}
    </div>
  );

  return (
    <section
      ref={band}
      aria-label="Mery Rose brand values"
      className="relative overflow-hidden border-y border-black/5 bg-white py-5 sm:py-7"
      style={{ color: 'var(--color-primary)' }}
    >
      <div ref={track} className="flex w-max will-change-transform">
        {strip}
        <div aria-hidden="true" className="flex">
          {strip}
        </div>
      </div>
    </section>
  );
}
