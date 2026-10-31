'use client';

import React, { useState, useRef } from 'react';
import { ShopVideo } from '../../lib/videos';

/**
 * The video section of the shop.
 *
 * Every clip belongs to a piece, so the card shows the piece it belongs to
 * and the price with it. The clip plays inside the card — nothing opens in a
 * new tab and the visitor keeps their place on the page.
 */

interface VideoSectionProps {
  videos: ShopVideo[];
  primary: string;
  currencySymbol: string;
  /** Opens the piece of the clip, when the page can show it. */
  onViewProduct?: (productId: number) => void;
}

const VideoSection: React.FC<VideoSectionProps> = ({
  videos,
  primary,
  currencySymbol,
  onViewProduct,
}) => {
  /** The clip that is playing right now — only one at a time. */
  const [playingId, setPlayingId] = useState<number | null>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});

  if (!videos.length) return null;

  const togglePlay = (video: ShopVideo) => {
    if (playingId === video.id) {
      videoRefs.current[video.id]?.pause();
      setPlayingId(null);
      return;
    }

    // Stop whatever was playing before.
    if (playingId !== null) {
      videoRefs.current[playingId]?.pause();
    }

    setPlayingId(video.id);
    // The element is only in the tree once it is playing, so the play call
    // has to wait for the render.
    window.setTimeout(() => {
      const element = videoRefs.current[video.id];
      if (element) {
        element.play().catch(() => {
          // The browser refused to start on its own — the controls stay
          // there, so the visitor can start the clip by hand.
        });
      }
    }, 0);
  };

  return (
    <section className="relative py-10 sm:py-16 md:py-20 bg-white overflow-hidden scroll-animate scroll-fadeInUp">
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
            A closer look at the pieces, filmed and styled for you
          </p>
        </div>

        {/* The clips, in a row that scrolls sideways on a small screen */}
        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
          {videos.map((video) => {
            const isPlaying = playingId === video.id;

            return (
              <div
                key={video.id}
                className="w-[78vw] max-w-[320px] sm:w-[300px] flex-shrink-0 snap-start"
              >
                <div className="group relative rounded-2xl overflow-hidden bg-gray-100 shadow-md aspect-[4/5]">
                  {isPlaying ? (
                    <video
                      ref={(element) => {
                        videoRefs.current[video.id] = element;
                      }}
                      src={video.video_url}
                      poster={video.poster_url || undefined}
                      controls
                      autoPlay
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover bg-black"
                    />
                  ) : (
                    <>
                      {video.poster_url ? (
                        <img
                          src={video.poster_url}
                          alt={video.title || video.product.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : video.product.image ? (
                        <img
                          src={video.product.image}
                          alt={video.product.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <svg
                            className="w-12 h-12 text-gray-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                            />
                          </svg>
                        </div>
                      )}

                      {/* The play button */}
                      <button
                        type="button"
                        onClick={() => togglePlay(video)}
                        aria-label={`Play ${video.title || video.product.name}`}
                        className="absolute inset-0 flex items-center justify-center focus:outline-none"
                      >
                        <span
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-xl transition-transform duration-300 group-hover:scale-110"
                          style={{ backgroundColor: primary }}
                        >
                          <svg
                            className="w-6 h-6 text-white translate-x-[1px]"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5.14v13.72a1 1 0 001.54.84l10.5-6.86a1 1 0 000-1.68L9.54 4.3A1 1 0 008 5.14z" />
                          </svg>
                        </span>
                      </button>

                      {/* The piece it belongs to */}
                      {video.product.name && (
                        <div className="absolute top-3 left-3 right-3">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-black/55 backdrop-blur-sm text-[10px] sm:text-xs font-medium uppercase tracking-wider text-white">
                            {video.product.category || video.product.brand}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="pt-3 space-y-1">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2">
                    {video.title || video.product.name}
                  </h3>
                  {video.product.name && video.title && (
                    <p className="text-xs text-gray-500 uppercase tracking-wide line-clamp-1">
                      {video.product.name}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-0.5">
                    <span
                      className="text-base font-semibold"
                      style={{ color: primary }}
                    >
                      {currencySymbol}
                      {video.product.price}
                    </span>
                    {video.product.original_price &&
                      video.product.original_price > video.product.price && (
                        <span className="text-xs text-gray-400 line-through">
                          {currencySymbol}
                          {video.product.original_price}
                        </span>
                      )}
                    {onViewProduct && (
                      <button
                        type="button"
                        onClick={() => onViewProduct(video.product.id)}
                        className="ml-auto text-xs font-medium underline underline-offset-2 hover:opacity-70 transition-opacity"
                        style={{ color: primary }}
                      >
                        View piece
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
