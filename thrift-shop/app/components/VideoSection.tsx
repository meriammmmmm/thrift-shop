'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ShopVideo } from '../../lib/videos';

/**
 * The video section of the shop.
 *
 * A row of vertical clips, the one in the middle plays, and the arrows walk
 * through them. Every clip carries its own sound button and its own play and
 * stop buttons, the way the shop's other sections carry their own controls.
 *
 * THE STILL BEHIND EVERY CLIP
 *
 * A clip only shows a frame once the browser has decoded one. A phone is
 * slow and these clips are large, so for a while there is no frame at all —
 * and a video box with nothing in it is a black hole in the middle of the
 * shop. Every clip therefore stands on a still: the poster the merchant
 * uploaded, the picture of the piece the clip belongs to, or a branded
 * panel when there is neither. The clip is painted on top of that still,
 * so the shop never shows a black box, whatever the network is doing.
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
    className="w-4 h-4"
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
    className="w-4 h-4"
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
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5.2v13.6a.7.7 0 0 0 1.07.6l10.6-6.8a.7.7 0 0 0 0-1.2L9.07 4.6A.7.7 0 0 0 8 5.2Z" />
  </svg>
);

/** The pause mark. */
const PauseIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4.5" width="4.2" height="15" rx="1.2" />
    <rect x="13.8" y="4.5" width="4.2" height="15" rx="1.2" />
  </svg>
);

/** The stop mark. */
const StopIcon = () => (
  <svg
    className="w-3.5 h-3.5"
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

/**
 * The still that stands behind a clip.
 *
 * The poster the merchant uploaded comes first, then the picture of the
 * piece the clip belongs to. A clip with neither still gets the branded
 * panel — a still, but never a black one.
 */
function posterFor(video: ShopVideo): string | null {
  return video.poster_url || video.product?.image || null;
}

const VideoSection: React.FC<VideoSectionProps> = ({ videos, primary }) => {
  /** The clip in the middle — the one that plays. */
  const [active, setActive] = useState(0);
  /** The sound starts off, the way every browser wants it, and stays as the
   * customer left it once they turn it on. */
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  /**
   * The clips that have actually played at least once.
   *
   * The still stands on top of a clip until that clip is running. A clip
   * that has not started yet has no frame to show, and a clip with no frame
   * is a black box — so the still holds the place until there is something
   * real behind it.
   */
  const [started, setStarted] = useState<Record<number, boolean>>({});
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const trackRef = useRef<HTMLDivElement | null>(null);
  /** The scroll listener measures the row; the measurement waits for the
   * next frame so a fast swipe never measures twice in one frame. */
  const measureRef = useRef<number | null>(null);

  /**
   * Put a clip in the middle of the row.
   *
   * The row is padded by half the leftover width on each side, so the
   * middle of the row is the middle of the screen. The scroll is done by
   * hand on the row itself: asking the browser to scroll an element into
   * view also scrolls the page around it, and it did nothing at all when
   * the row was still being measured.
   */
  const centerCard = useCallback((index: number, smooth = true) => {
    const track = trackRef.current;
    const card = cardRefs.current[index];
    if (!track || !card) return;

    const target = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
    track.scrollTo({
      left: Math.max(0, target),
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (!videos.length) return;
      const next = (index + videos.length) % videos.length;
      setActive(next);
      centerCard(next, true);
    },
    [videos.length, centerCard]
  );

  /** When the row is dragged by hand, the clip in the middle of it is the one
   * that plays. The scroll tells us which card that is. */
  const syncActiveFromScroll = useCallback(() => {
    if (measureRef.current !== null) return;

    measureRef.current = requestAnimationFrame(() => {
      measureRef.current = null;

      const track = trackRef.current;
      if (!track || !cardRefs.current.length) return;

      const middle = track.scrollLeft + track.clientWidth / 2;
      let nearest = 0;
      let smallest = Number.POSITIVE_INFINITY;

      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        /**
         * The card's place in the row, in the row's own coordinates. The
         * row is positioned, so this is measured against the row and not
         * against some ancestor further up — measuring against the wrong
         * box is what made the row activate the wrong clip while it was
         * being dragged, which left a black clip in front of the visitor.
         */
        const centre = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(centre - middle);
        if (distance < smallest) {
          smallest = distance;
          nearest = index;
        }
      });

      setActive((current) => (current === nearest ? current : nearest));
    });
  }, []);

  // The first clip starts in the middle, whatever the browser remembered from
  // the last visit.
  useEffect(() => {
    if (!videos.length) return;
    centerCard(0, false);
  }, [videos.length, centerCard]);

  // A phone turns around and a window is resized — the middle of the row
  // moves with it, so the clip that was in the middle goes back there.
  useEffect(() => {
    if (!videos.length) return;

    const onResize = () => centerCard(active, false);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [videos.length, active, centerCard]);

  useEffect(() => {
    return () => {
      if (measureRef.current !== null) cancelAnimationFrame(measureRef.current);
    };
  }, []);

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
    'w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/35 backdrop-blur-md text-white ring-1 ring-white/25 flex items-center justify-center hover:bg-black/55 active:bg-black/65 transition-colors';

  return (
    <section
      className="relative py-10 sm:py-16 md:py-20 overflow-hidden scroll-animate scroll-fadeInUp"
      style={{
        background: `linear-gradient(180deg, ${primary}12 0%, #ffffff 45%, #ffffff 100%)`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-12">
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
            className="video-track"
          >
            {videos.map((video, index) => {
              const isActive = index === active;
              const title = video.title || 'Video';
              const still = posterFor(video);

              return (
                <div
                  key={video.id}
                  ref={(element) => {
                    cardRefs.current[index] = element;
                  }}
                  onClick={() => !isActive && goTo(index)}
                  className={`video-card ${
                    isActive ? 'is-active' : ''
                  }`}
                >
                  {/* The still the clip stands on — never a black box. */}
                  <div
                    className="absolute inset-0 overflow-hidden transition-opacity duration-500"
                    style={{ opacity: started[video.id] ? 0 : 1 }}
                    aria-hidden="true"
                  >
                    {still ? (
                      <img
                        src={still}
                        alt=""
                        loading={index === active ? 'eager' : 'lazy'}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          // A dead still falls back to the branded panel.
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="video-placeholder absolute inset-0" />
                    )}
                  </div>

                  <video
                    ref={(element) => {
                      videoRefs.current[video.id] = element;
                    }}
                    src={video.video_url}
                    poster={still || undefined}
                    className="absolute inset-0 h-full w-full object-cover"
                    preload="metadata"
                    muted={isActive ? muted : true}
                    loop
                    playsInline
                    onPlay={() => isActive && setPlaying(true)}
                    onPause={() => isActive && setPlaying(false)}
                    onPlaying={() =>
                      setStarted((current) =>
                        current[video.id] ? current : { ...current, [video.id]: true }
                      )
                    }
                    onLoadedData={(event) => {
                      /**
                       * A clip that is not playing still shows its first
                       * frame — but only once the browser has been asked
                       * for one. Without this the waiting clips are blank
                       * boxes until they are played.
                       */
                      const element = event.currentTarget;
                      if (index !== active && element.currentTime === 0) {
                        try {
                          element.currentTime = 0.001;
                        } catch {
                          // A clip that is not ready yet cannot be rewound.
                        }
                      }
                    }}
                    onError={(event) => {
                      // A clip the phone cannot play leaves the still showing.
                      event.currentTarget.style.display = 'none';
                      setPlaying(false);
                    }}
                  />

                  {/* The name of the clip */}
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none">
                    <p className="text-white text-sm sm:text-base font-medium tracking-wide text-center line-clamp-2">
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
                className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white/90 shadow-lg text-gray-700 flex items-center justify-center hover:text-[var(--color-primary)] transition-colors"
              >
                <ArrowIcon direction="left" />
              </button>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                aria-label="Next video"
                className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white/90 shadow-lg text-gray-700 flex items-center justify-center hover:text-[var(--color-primary)] transition-colors"
              >
                <ArrowIcon direction="right" />
              </button>
            </>
          )}
        </div>

        {/* The dots */}
        {videos.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
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
