'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../lib/theme';
import { StarPicker } from './StarRating';
import { prepareReviewImage, ReviewImageError } from '../../lib/reviewImage';

interface ReviewDialogProps {
  /** Controlled by the parent so any trigger (header, CTA card) can open it. */
  open: boolean;
  onClose: () => void;
  companyId?: number | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-wild-skylark-9834.fly.dev/api';

const MAX_MESSAGE = 800;
const MAX_TITLE = 80;

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function ReviewDialog({ open, onClose, companyId }: ReviewDialogProps) {
  const { theme } = useTheme();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  /** The stars the reviewer picked, 1-5. */
  const [rating, setRating] = useState(5);
  const [mounted, setMounted] = useState(false);
  /** Set when the visitor is signed in — the review is then linked to their account. */
  const [authToken, setAuthToken] = useState<string | null>(null);
  /** The photo the reviewer attached, as a data URI. Optional. */
  const [image, setImage] = useState<string | null>(null);
  /** True while the chosen photo is being shrunk before it is sent. */
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  /** What went wrong with the photo, if anything. */
  const [imageError, setImageError] = useState('');

  const nameRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // The parent passes a fresh arrow on every render, so the callback is kept
  // in a ref — otherwise the open/close effect below would re-run on each
  // parent render and re-lock the page scroll.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const requestClose = () => {
    if (status === 'submitting') return;
    onCloseRef.current();
  };

  // While the dialog is open: Escape closes it, the page behind must not
  // scroll, and focus stays trapped inside the panel.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        requestClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);

      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    const focusTimer = window.setTimeout(() => nameRef.current?.focus(), 50);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
      // Send focus back where it came from so keyboard users are not dumped
      // at the top of the page.
      previouslyFocused?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // A fresh dialog always starts from a clean slate.
  useEffect(() => {
    if (!open) return;
    setStatus('idle');
    setError('');
    setName('');
    setTitle('');
    setMessage('');
    setRating(5);
    setImage(null);
    setImageError('');
    setIsPreparingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // A signed-in customer gets their name filled in and their review linked
    // to their account, so the admin knows exactly who wrote it.
    const token = localStorage.getItem('auth-token');
    setAuthToken(token);

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.name) {
          setName(parsed.name);
        } else if (parsed?.email) {
          setName(String(parsed.email).split('@')[0]);
        }
      } catch {
        // A stale cache entry must never block the form.
      }
    }
  }, [open]);

  /**
   * The photo the reviewer picked.
   *
   * It is shrunk in the browser before it is sent, so a photo straight from a
   * phone does not make the review request heavy.
   */
  const pickImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageError('');

    try {
      setIsPreparingImage(true);
      const prepared = await prepareReviewImage(file);
      setImage(prepared);
    } catch (err) {
      setImage(null);
      setImageError(
        err instanceof ReviewImageError ? err.message : 'We could not read that photo.',
      );
    } finally {
      setIsPreparingImage(false);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedMessage) {
      setError('Please add your name and your review.');
      return;
    }

    if (trimmedMessage.length < 10) {
      setError('Tell us a little more — at least 10 characters.');
      return;
    }

    setStatus('submitting');
    setError('');

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_URL}/testimonials/customer-submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: trimmedName,
          title: title.trim() || 'Customer Review',
          message: trimmedMessage,
          rating,
          companyId: companyId || 1,
          // The photo is optional — it is only sent when there is one.
          ...(image ? { image } : {}),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'We could not send your review. Please try again.');
      }

      setStatus('success');
      setName('');
      setTitle('');
      setMessage('');
      setRating(5);
      setImage(null);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-dialog-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={requestClose}
        aria-hidden="true"
      />

      <div className="relative flex min-h-full items-end justify-center sm:items-center sm:p-6">
        <div
          ref={panelRef}
          className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        >
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-6 py-5">
            <div>
              <h3 id="review-dialog-title" className="text-lg font-semibold text-gray-900">
                Share your experience
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Reviews are read by our team before they go live.
              </p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close review form"
              className="shrink-0 rounded-full p-2 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {status === 'success' ? (
            /* Thank you */
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-12 text-center">
              <span
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.primaryLight, color: theme.primary }}
              >
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </span>
              <h4 className="mb-2 text-lg font-semibold text-gray-900">Thank you!</h4>
              <p className="mx-auto mb-7 max-w-sm text-sm text-gray-500">
                Your review is with our team. Once it is approved it appears on this page — keep
                an eye out.
              </p>
              <button
                type="button"
                onClick={requestClose}
                className="rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:opacity-90"
                style={{ backgroundColor: theme.primary }}
              >
                Close
              </button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <div className="mb-4">
                  <label htmlFor="review-name" className="mb-1.5 block text-xs font-medium text-gray-700">
                    Your name
                  </label>
                  <input
                    id="review-name"
                    ref={nameRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={60}
                    placeholder="e.g. Amira B."
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div className="mb-4">
                  <StarPicker
                    value={rating}
                    onChange={setRating}
                    label="Your rating"
                    hint="Tap the stars to rate your experience"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="review-title" className="mb-1.5 block text-xs font-medium text-gray-700">
                    Review title <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="review-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={MAX_TITLE}
                    placeholder="e.g. Best vintage find in years"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="review-message" className="mb-1.5 block text-xs font-medium text-gray-700">
                    Your review
                  </label>
                  <textarea
                    id="review-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={MAX_MESSAGE}
                    rows={4}
                    placeholder="How was the piece? Fit, quality, the whole experience."
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <p className="mt-1 text-right text-[11px] text-gray-400">
                    {message.length}/{MAX_MESSAGE}
                  </p>
                </div>

                {/* The photo is optional — a review with only words is fine. */}
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Add a photo <span className="font-normal text-gray-400">(optional)</span>
                  </label>

                  <input
                    ref={fileInputRef}
                    id="review-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={pickImage}
                    className="sr-only"
                  />

                  {image ? (
                    <div className="relative overflow-hidden rounded-xl border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt="The photo you attached"
                        className="h-40 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isPreparingImage}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-5 text-sm font-medium text-gray-500 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M12 16V4m0 0L8 8m4-4 4 4" />
                        <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                      </svg>
                      {isPreparingImage ? 'Preparing your photo…' : 'Choose a photo'}
                    </button>
                  )}

                  {imageError && (
                    <p className="mt-1.5 text-[11px] text-red-600" role="alert">
                      {imageError}
                    </p>
                  )}
                  {!image && !imageError && (
                    <p className="mt-1.5 text-[11px] text-gray-400">
                      A photo of the piece you bought — JPG, PNG or WEBP.
                    </p>
                  )}
                </div>

                {error && (
                  <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-600" role="alert">
                    {error}
                  </p>
                )}
              </div>

              {/* Actions stay pinned so they never scroll out of reach */}
              <div className="flex shrink-0 gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  onClick={requestClose}
                  disabled={status === 'submitting'}
                  className="rounded-full border-2 border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition-all duration-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="flex-1 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-60"
                  style={{ backgroundColor: theme.primary }}
                >
                  {status === 'submitting' ? 'Sending…' : 'Submit review'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
