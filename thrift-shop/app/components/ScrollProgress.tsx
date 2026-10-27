'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '../../lib/motion/gsap';
import { EASE, prefersReducedMotion } from '../../lib/motion/tokens';

/**
 * A hairline that tracks reading progress across the whole page.
 *
 * It is the smallest possible proof that the scroll position is a first
 * class input to this site: everything on screen is a function of it.
 */
export default function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !bar.current) return;

      gsap.fromTo(
        bar.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: EASE.linear,
          scrollTrigger: {
            start: 0,
            end: 'max',
            scrub: 0.25,
          },
        },
      );
    },
    [],
  );

  return (
    <div
      className="fixed top-0 inset-x-0 h-[3px] z-[70] pointer-events-none"
      aria-hidden="true"
    >
      <div
        ref={bar}
        className="h-full w-full origin-left"
        style={{
          background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-light) 60%, var(--color-primary) 100%)',
          transform: 'scaleX(0)',
        }}
      />
    </div>
  );
}
