'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '../../lib/motion/gsap';
import { DURATION, EASE, prefersReducedMotion } from '../../lib/motion/tokens';

type Chapter = {
  index: string;
  kicker: string;
  title: string;
  body: string;
  image: string;
  alt: string;
  position: string;
};

const CHAPTERS: Chapter[] = [
  {
    index: '01',
    kicker: 'The sourcing',
    title: 'Chosen one piece at a time',
    body: 'We walk the rails of independent boutiques and private closets across the Mediterranean and Europe, looking for pieces that still carry the hand of their maker.',
    image: '/images/premium-7ba67846.webp',
    alt: 'A hand selecting a garment from a rail of clothes',
    position: 'center 35%',
  },
  {
    index: '02',
    kicker: 'The inspection',
    title: 'Checked, mended, honest',
    body: 'Every piece is inspected by hand: seams, labels, hardware, drape. Anything that fails the standard is repaired or retired, and we say which.',
    image: '/images/Hero-1-8fadc9f2.webp',
    alt: 'A flat lay of folded garments, a leather bag and sunglasses',
    position: 'center 45%',
  },
  {
    index: '03',
    kicker: 'The second life',
    title: 'Given a wardrobe to belong to',
    body: 'A good coat should outlive the season it arrived in. We price, list and restyle pre-loved pieces so they can be worn again — properly, and for longer.',
    image: '/images/hero-closet.webp',
    alt: 'A well kept wardrobe of clothes, knitwear and shoes',
    position: 'center 55%',
  },
];

/**
 * ============================================================
 *  THE CRAFT — scroll-based storytelling
 * ============================================================
 *  A three-chapter narrative told by scrolling.
 *
 *  Desktop: the left rail sticks while the chapters scroll past on the
 *  right. Each chapter hands the rail its spotlight, and the images
 *  drift inside their frames so the page has depth rather than depth
 *  suggested.
 *
 *  Mobile: the sticky rail would eat the screen, so the chapters stack
 *  and simply reveal.
 *
 *  Colour comes from the merchant's runtime theme (`--color-primary`),
 *  so a rebrand does not require touching this component.
 * ============================================================
 */
export default function StoryScroll() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !root.current) return;

      const scope = root.current;
      const panels = Array.from(scope.querySelectorAll<HTMLElement>('[data-story-panel]'));
      const steps = Array.from(scope.querySelectorAll<HTMLElement>('[data-story-step]'));
      const progress = scope.querySelector<HTMLElement>('[data-story-progress]');

      const mm = gsap.matchMedia();

      const activate = (index: number) => {
        steps.forEach((step, i) => {
          gsap.to(step, {
            opacity: i === index ? 1 : 0.34,
            x: i === index ? 0 : -8,
            duration: 0.55,
            ease: EASE.standard,
            overwrite: 'auto',
          });
        });

        if (progress) {
          gsap.to(progress, {
            scaleY: (index + 1) / steps.length,
            duration: 0.7,
            ease: EASE.standard,
            overwrite: 'auto',
          });
        }
      };

      mm.add('(min-width: 1024px)', () => {
        gsap.set(steps, { opacity: 0.34, x: -8 });

        panels.forEach((panel, index) => {
          const image = panel.querySelector<HTMLElement>('[data-story-image]');

          if (image) {
            gsap.fromTo(
              image,
              { yPercent: -7, scale: 1.06 },
              {
                yPercent: 7,
                scale: 1.14,
                ease: EASE.linear,
                scrollTrigger: {
                  trigger: panel,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              },
            );
          }

          ScrollTrigger.create({
            trigger: panel,
            start: 'top 58%',
            end: 'bottom 42%',
            onToggle: (self) => {
              if (self.isActive) activate(index);
            },
          });
        });
      });

      mm.add('(max-width: 1023px)', () => {
        panels.forEach((panel) => {
          const image = panel.querySelector<HTMLElement>('[data-story-image]');

          if (image) {
            gsap.fromTo(
              image,
              { yPercent: -5, scale: 1.05 },
              {
                yPercent: 5,
                scale: 1.1,
                ease: EASE.linear,
                scrollTrigger: {
                  trigger: panel,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              },
            );
          }

          gsap.fromTo(
            panel,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: DURATION.reveal,
              ease: EASE.expo,
              scrollTrigger: { trigger: panel, start: 'top 88%', once: true },
            },
          );
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative overflow-hidden bg-[#0b0a0b] text-white py-20 sm:py-28 lg:py-36"
      aria-label="How Mery Rose curates"
    >
      {/* Soft burgundy bloom behind the rail */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/4 h-[36rem] w-[36rem] rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          {/* ---------------- Sticky rail ---------------- */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-white/50">
                The craft
              </p>
              <h2 className="mt-5 text-3xl sm:text-4xl lg:text-[2.9rem] font-light leading-[1.12] tracking-tight">
                Every piece has a{' '}
                <span className="font-serif italic" style={{ color: 'var(--color-primary-light)' }}>
                  past
                </span>{' '}
                before it has a future.
              </h2>
              <p className="mt-6 max-w-md text-sm sm:text-base text-white/55 leading-relaxed">
                We are in the business of the second life — the one where a good coat
                finds the person who was always going to wear it.
              </p>

              <div className="relative mt-10 pl-6 sm:mt-12">
                <div
                  aria-hidden="true"
                  className="absolute left-0 top-0 h-full w-px bg-white/10"
                />
                <div
                  data-story-progress
                  aria-hidden="true"
                  className="absolute left-0 top-0 h-full w-px origin-top"
                  style={{ background: 'var(--color-primary)', transform: 'scaleY(0.2)' }}
                />

                <ol className="space-y-5 sm:space-y-7">
                  {CHAPTERS.map((chapter) => (
                    <li key={chapter.index} data-story-step className="will-change-transform">
                      <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
                        {chapter.index} — {chapter.kicker}
                      </p>
                      <p className="mt-1 text-base sm:text-lg font-light text-white/90">
                        {chapter.title}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* ---------------- Chapters ---------------- */}
          <div className="lg:col-span-7">
            <div className="space-y-12 sm:space-y-16 lg:space-y-28">
              {CHAPTERS.map((chapter) => (
                <figure key={chapter.index} data-story-panel className="relative">
                  <div className="relative overflow-hidden rounded-2xl aspect-[4/3] sm:aspect-[16/9] lg:aspect-[2/1] bg-white/[0.06]">
                    <img
                      data-story-image
                      src={chapter.image}
                      alt={chapter.alt}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover will-change-transform"
                      style={{ objectPosition: chapter.position }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-white/55">
                        {chapter.kicker}
                      </p>
                      <p className="mt-2 max-w-md text-sm sm:text-base text-white/85 leading-relaxed">
                        {chapter.body}
                      </p>
                    </figcaption>
                  </div>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
