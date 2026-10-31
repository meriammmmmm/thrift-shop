'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ShopVideo } from '../../lib/videos';

/**
 * The video section of the shop.
 *
 * A row of vertical clips, the one in the middle plays, and the arrows walk
 * through them. Every clip carries its own sound button and its own play and
 * stop buttons, the way the shop's other sections carry their own controls.
 */

interface VideoSectionProps {
  videos: ShopVideo[];
  primary: string;
}

/** The marks of the controls. The shop draws its own icons inline, the same
 * way the rest of the storefront does. */

/** The speaker with sound. */
const SoundOnIcon = () => (
  <svg
    className="w-3.5 h-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
);

/** The speaker without sound. */
const SoundOffIcon = () => (
  <svg
    className="w-3.5 h-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 5 6 9H3v6h3l5 4V5Z" />
    <path d="m16 9 5 6" />
    <path d="m21 9-5 6" />
  </svg>
);

/** The play mark. */
const PlayIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5.2v13.6a.7.7 0 0 0 1.07.6l10.6-6.8a.7.7 0 0 0 0-1.2L9.07 4.6A.7.7 0 0 0 8 5.2Z" />
  </svg>
);

/** The pause mark. */
const PauseIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4.5" width="4.2" height="15" rx="1.2" />
    <rect x="13.8" y="4.5" width="4.2" height="15" rx="1.2" />
  </svg>
);

/** The stop mark. */
const StopIcon = () => (
  <svg
    className="w-3 h-3"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
  >
    <path d="m6.5 6.5 11 11" />
    <path d="m17.5 6.5-11 11" />
  </svg>
);

/** The arrow that walks the row. */
const ArrowIcon = ({ direction }: { direction: 'left' | 'right' }) => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={direction === 'left' ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'} />
  </svg>
);

const VideoSection: React.FC<VideoSectionProps> = ({ videos, primary }) => {
  /** The clip in the middle — the one that plays. */
  const [active, setActive] = useState(0);
  /** The sound starts off, the way every browser wants it, and stays as the
   * customer left it once they turn it on. */
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const trackRef = useRef<HTMLDivElement | null>(null);

  const goTo = useCallback(
    (index: number) => {
      if (!videos.length) return;
      const next = (index + videos.length) % videos.length;
      setActive(next);
      cardRefs.current[next]?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    },
    [videos.length]
  );

  /** When the row is dragged by hand, the clip in the middle of it is the one
   * that plays. The scroll tells us which card that is. */
  const syncActiveFromScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || !cardRefs.current.length) return;

    const middle = track.scrollLeft + track.clientWidth / 2;
    let nearest = 0;
    let smallest = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const centre = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(centre - middle);
      if (distance < smallest) {
        smallest = distance;
        nearest = index;
      }
    });

    setActive((current) => (current === nearest ? current : nearest));
  }, []);

  // The first clip starts in the middle, whatever the browser remembered from
  // the last visit.
  useEffect(() => {
    if (!videos.length) return;
    const card = cardRefs.current[0];
    if (!card) return;
    card.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
  }, [videos.length]);

  // Only the clip in the middle runs. The others wait with their first frame
  // showing, so the row looks like a row of films and not a row of blanks.
  useEffect(() => {
    videos.forEach((video, index) => {
      const element = videoRefs.current[video.id];
      if (!element) return;

      if (index === active) {
        element.muted = muted;
        const started = element.play();
        if (started && typeof started.catch === 'function') {
          started.catch(() => setPlaying(false));
        }
      } else {
        element.pause();
        element.muted = true;
      }
    });
  }, [active, muted, videos]);

  if (!videos.length) return null;

  /** Pause or resume the clip in the middle. */
  const togglePlay = (index: number) => {
    const element = videoRefs.current[videos[index].id];
    if (!element) return;

    if (index !== active) {
      goTo(index);
      return;
    }

    if (element.paused) {
      const started = element.play();
      if (started && typeof started.catch === 'function') {
        started.catch(() => setPlaying(false));
      }
      setPlaying(true);
    } else {
      element.pause();
      setPlaying(false);
    }
  };

  /** Stop the clip and put it back at its first frame. */
  const stopVideo = (index: number) => {
    const element = videoRefs.current[videos[index].id];
    if (!element) return;

    element.pause();
    try {
      element.currentTime = 0;
    } catch {
      // A clip that is not ready yet cannot be rewound, but it is stopped.
    }
    setPlaying(false);
  };

  /** The sound on or off. Clicking it on a card that is not playing also brings
   * that card to the middle, so the customer hears what they pressed. */
  const toggleSound = (index: number) => {
    const nextMuted = !muted;
    setMuted(nextMuted);

    if (index !== active) {
      goTo(index);
      return;
    }

    const element = videoRefs.current[videos[index].id];
    if (element) element.muted = nextMuted;
  };

  /** The round button every clip carries in its top corner. The dark back
   * keeps the white mark readable over a bright frame. */
  const controlClass =
    'w-8 h-8 rounded-full bg-black/35 backdrop-blur-md text-white ring-1 ring-white/25 flex items-center justify-center hover:bg-black/55 active:bg-black/65 transition-colors';

  return (
    <section
      className="relative py-12 sm:py-16 md:py-20 overflow-hidden scroll-animate scroll-fadeInUp"
      style={{
        background: `linear-gradient(180deg, ${primary}12 0%, #ffffff 45%, #ffffff 100%)`,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <span
            className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.1em] sm:tracking-[0.15em] mb-2 sm:mb-4"
            style={{ backgroundColor: `${primary}15`, color: primary }}
          >
            See It In Motion
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-2 sm:mb-3 tracking-tight">
            Videos
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm tracking-wide">
            A closer look, filmed and styled for you
          </p>
        </div>

        {/* The row of clips */}
        <div className="relative">
          <div
            ref={trackRef}
            onScroll={syncActiveFromScroll}
            className="flex items-center gap-3 sm:gap-6 overflow-x-auto scrollbar-hide px-12 sm:px-16"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {videos.map((video, index) => {
              const isActive = index === active;
              const title = video.title || 'Video';

              return (
                <div
                  key={video.id}
                  ref={(element) => {
                    cardRefs.current[index] = element;
                  }}
                  onClick={() => !isActive && goTo(index)}
                  className={`relative flex-shrink-0 w-[210px] sm:w-[250px] aspect-[9/16] rounded-[22px] overflow-hidden bg-gray-200 transition-all duration-500 ease-out cursor-pointer ${
                    isActive
                      ? 'scale-100 opacity-100 z-10 shadow-2xl'
                      : 'scale-[0.86] opacity-45 hover:opacity-70 z-0'
                  }`}
                  style={{ scrollSnapAlign: 'center' }}
                >
                  <video
                    ref={(element) => {
                      videoRefs.current[video.id] = element;
                    }}
                    src={video.video_url}
                    poster={video.poster_url || undefined}
                    className="w-full h-full object-cover bg-black"
                    preload="metadata"
                    muted={isActive ? muted : true}
                    loop
                    playsInline
                    onPlay={() => isActive && setPlaying(true)}
                    onPause={() => isActive && setPlaying(false)}
                  />

                  {/* The name of the clip */}
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none">
                    <p className="text-white text-xs sm:text-sm font-medium tracking-wide text-center line-clamp-2">
                      {title}
                    </p>
                  </div>

                  {/* The controls of the clip */}
                  <div
                    className="absolute top-3 right-3 flex items-center gap-2"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {/* The sound */}
                    <button
                      type="button"
                      onClick={() => toggleSound(index)}
                      aria-label={muted ? 'Turn the sound on' : 'Turn the sound off'}
                      title={muted ? 'Turn the sound on' : 'Turn the sound off'}
                      className={controlClass}
                    >
                      {muted ? <SoundOffIcon /> : <SoundOnIcon />}
                    </button>

                    {/* The stop */}
                    {isActive && (
                      <button
                        type="button"
                        onClick={() => stopVideo(index)}
                        aria-label="Stop the clip"
                        title="Stop the clip"
                        className={controlClass}
                      >
                        <StopIcon />
                      </button>
                    )}

                    {/* The play and the pause */}
                    <button
                      type="button"
                      onClick={() => togglePlay(index)}
                      aria-label={
                        isActive
                          ? playing
                            ? 'Pause the clip'
                            : 'Play the clip'
                          : 'Play this clip'
                      }
                      title={
                        isActive
                          ? playing
                            ? 'Pause the clip'
                            : 'Play the clip'
                          : 'Play this clip'
                      }
                      className={controlClass}
                    >
                      {isActive && playing ? <PauseIcon /> : <PlayIcon />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* The arrows */}
          {videos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                aria-label="Previous video"
                className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white shadow-xl text-gray-700 flex items-center justify-center hover:text-[var(--color-primary)] transition-colors"
              >
                <ArrowIcon direction="left" />
              </button>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                aria-label="Next video"
                className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white shadow-xl text-gray-700 flex items-center justify-center hover:text-[var(--color-primary)] transition-colors"
              >
                <ArrowIcon direction="right" />
              </button>
            </>
          )}
        </div>

        {/* The dots */}
        {videos.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {videos.map((video, index) => (
              <button
                key={video.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Video ${index + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === active ? 'w-7' : 'w-1.5 opacity-40 hover:opacity-70'
                }`}
                style={{ backgroundColor: primary }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default VideoSection;
