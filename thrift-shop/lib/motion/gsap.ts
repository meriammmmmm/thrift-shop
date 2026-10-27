'use client';

/**
 * ============================================================
 *  GSAP RUNTIME — Mery Rose
 * ============================================================
 *  Single place where the animation engine is booted.
 *
 *  WHY A MODULE INSTEAD OF IMPORTING DIRECTLY
 *  ------------------------------------------
 *  `gsap` and `gsap/ScrollTrigger` are separate bundles. Importing the
 *  plugin in one file and the core in another can end up with two copies
 *  of the core, which breaks `ScrollTrigger` (it registers itself against
 *  the core it was imported with). Everything funnels through here so
 *  the plugin and the core are guaranteed to be the same instance.
 * ============================================================
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let registered = false;

/** Idempotent plugin registration. Safe to call from any client component. */
export function registerPlugins() {
  if (registered || typeof window === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

registerPlugins();

export { gsap, ScrollTrigger };
