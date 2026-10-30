import React, { useState, useEffect, useCallback } from 'react';

type ReviewStatus = 'pending' | 'approved' | 'rejected';
type ReviewSource = 'customer' | 'admin';

interface Testimonial {
  id: number;
  name: string;
  image: string;
  title: string;
  description: string;
  isActive: boolean;
  status: ReviewStatus;
  source: ReviewSource;
  submitterEmail: string | null;
  createdAt: string | null;
  /** The stars the reviewer gave, 1-5. */
  rating: number;
  /** How many visitors found this review helpful. */
  likes: number;
}

interface TestimonialsManagementProps {
  authToken: string;
}

type Filter = 'pending' | 'live' | 'hidden' | 'all';

/**
 * Placeholder photos that used to be hardcoded as the "default" avatar.
 *
 * They are treated as "no image" so the panel draws the same initials
 * avatar the storefront does, instead of showing a stranger's face.
 */
const LEGACY_PLACEHOLDER_AVATARS = [
  'photo-1472099645785-5658abf4ff4e',
  'photo-1438761681033-6461ffad8d80',
  'photo-1494790108755-2616b612b786',
];

const isPlaceholderImage = (image: string | null | undefined): boolean => {
  if (!image) return true;
  return LEGACY_PLACEHOLDER_AVATARS.some((id) => image.includes(id));
};

/** Curated pairs that sit well with the brand palette. */
const AVATAR_PALETTE = [
  { from: '#8C1F3D', to: '#C4657E' },
  { from: '#5B2333', to: '#A34D64' },
  { from: '#7A3B52', to: '#C98C9C' },
  { from: '#2F4858', to: '#5C7C8A' },
  { from: '#4A3B6B', to: '#8B7BA8' },
  { from: '#3E5C45', to: '#7FA88C' },
  { from: '#6B4E3D', to: '#B08D6B' },
  { from: '#5A2E4A', to: '#A66E93' },
];

/** A stable hash so the same name always maps to the same colour. */
const hashName = (name: string): number => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

/** "Meriam Ben Youssef" becomes "MB", "meriam" becomes "M". */
export const getInitials = (name: string): string => {
  const cleaned = (name || '').trim();
  if (!cleaned) return '?';

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';

  const first = words[0][0] || '';
  const last = words.length > 1 ? words[words.length - 1][0] || '' : '';

  return `${first}${last}`.toUpperCase() || '?';
};

/** The reviewer's photo when there is one, their initials when there is not. */
const Avatar = ({
  name,
  image,
  size = 64,
}: {
  name: string;
  image: string | null;
  size?: number;
}) => {
  if (!isPlaceholderImage(image)) {
    return (
      <img
        src={image as string}
        alt={name || 'Reviewer avatar'}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
        onError={(e) => {
          // A dead photo falls back to the initials avatar.
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  const palette = AVATAR_PALETTE[hashName(name || '?') % AVATAR_PALETTE.length];

  return (
    <div
      role="img"
      aria-label={name ? `${name}'s avatar` : 'Reviewer avatar'}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        fontWeight: 600,
        fontSize: Math.round(size * 0.36),
        backgroundImage: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`,
      }}
    >
      {getInitials(name)}
    </div>
  );
};

/** The stars of a review, drawn with Font Awesome. */
const Stars = ({ value, size = 12 }: { value: number; size?: number }) => {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`Rated ${rounded} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={star <= rounded ? 'fas fa-star' : 'far fa-star'}
          style={{ color: star <= rounded ? '#F59E0B' : '#D1D5DB', fontSize: size }}
          aria-hidden="true"
        />
      ))}
    </span>
  );
};

/**
 * SQLite hands back 0/1, Postgres hands back true/false. Reading both here is
 * what keeps the approval queue honest — a review that is already live must
 * never look like it is still waiting.
 */
const parseBool = (value: unknown, fallback = false): boolean => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

const transform = (raw: any): Testimonial => {
  const isActive = parseBool(raw.isActive ?? raw.is_active, false);
  const status = (raw.status || (isActive ? 'approved' : 'pending')) as ReviewStatus;
  const rating = Number(raw.rating);
  const likes = Number(raw.likes);

  return {
    id: raw.id,
    name: raw.name || raw.title,
    // An empty image means the initials avatar is used.
    image: raw.image || '',
    title: raw.title,
    description: raw.description,
    isActive,
    status,
    source: raw.source === 'customer' ? 'customer' : 'admin',
    submitterEmail: raw.submitter_email || null,
    createdAt: raw.created_at || null,
    rating: Number.isFinite(rating) && rating > 0 ? Math.min(5, Math.round(rating)) : 5,
    likes: Number.isFinite(likes) ? likes : 0,
  };
};

const formatDate = (value: string | null): string => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const TestimonialsManagement: React.FC<TestimonialsManagementProps> = ({ authToken }) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [showTestimonials, setShowTestimonials] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>('pending');
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // Load testimonials from API
  const loadTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');

      const response = await fetch('/api/testimonials', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Could not load reviews');
      }

      const data = await response.json();
      setTestimonials((data.testimonials || []).map(transform));

      // Load testimonials visibility setting
      const settingsResponse = await fetch('/api/companies/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setShowTestimonials(parseBool(settingsData.company?.show_testimonials, true));
      }
    } catch (error) {
      // No silent fallback to fake reviews: an approval queue that shows
      // sample content is worse than an empty queue with an error.
      setTestimonials([]);
      setLoadError(
        error instanceof Error ? error.message : 'Could not load reviews'
      );
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  const handleToggleTestimonials = async () => {
    const nextValue = !showTestimonials;
    try {
      const response = await fetch('/api/testimonials/section/visibility', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ showTestimonials: nextValue }),
      });

      if (response.ok) {
        setShowTestimonials(nextValue);
      }
    } catch (error) {
      console.error('Failed to toggle testimonials visibility:', error);
    }
  };

  const handleAddNew = () => {
    const newTestimonial: Testimonial = {
      id: Date.now(),
      name: '',
      image: '',
      title: '',
      description: '',
      isActive: true,
      status: 'approved',
      source: 'admin',
      submitterEmail: null,
      createdAt: null,
      rating: 5,
      likes: 0,
    };
    setEditingTestimonial(newTestimonial);
    setIsAddingNew(true);
    setIsModalOpen(true);
  };

  const handleEditTestimonial = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setIsAddingNew(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTestimonial(null);
    setIsAddingNew(false);
  };

  const handleSaveTestimonial = async (testimonial: Testimonial) => {
    try {
      if (isAddingNew) {
        const response = await fetch('/api/testimonials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            title: testimonial.title,
            name: testimonial.name,
            description: testimonial.description,
            image: testimonial.image,
            isActive: testimonial.isActive,
            rating: testimonial.rating,
          }),
        });

        if (!response.ok) {
          console.error('Failed to add testimonial');
          return;
        }

        const data = await response.json();
        setTestimonials(prev => [transform(data.testimonial), ...prev]);
      } else {
        const response = await fetch(`/api/testimonials/${testimonial.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            title: testimonial.title,
            name: testimonial.name,
            description: testimonial.description,
            image: testimonial.image,
            isActive: testimonial.isActive,
            rating: testimonial.rating,
          }),
        });

        if (!response.ok) {
          console.error('Failed to update testimonial');
          return;
        }

        const data = await response.json();
        const updated = transform(data.testimonial);
        setTestimonials(prev =>
          prev.map(t => (t.id === updated.id ? updated : t))
        );
      }

      closeModal();
    } catch (error) {
      console.error('Failed to save testimonial:', error);
    }
  };

  const handleDeleteTestimonial = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      const response = await fetch(`/api/testimonials/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        setTestimonials(prev => prev.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete testimonial:', error);
    }
  };

  /** Run a workflow action (approve / reject / toggle) and sync the row. */
  const runAction = async (
    id: number,
    action: 'approve' | 'reject' | 'toggle'
  ): Promise<boolean> => {
    setBusyId(id);

    try {
      const response = await fetch(`/api/testimonials/${id}/${action}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error(`Failed to ${action} testimonial:`, errorData);
        return false;
      }

      const data = await response.json();
      const updated = transform(data.testimonial);
      setTestimonials(prev => prev.map(t => (t.id === updated.id ? updated : t)));
      return true;
    } catch (error) {
      console.error(`Failed to ${action} testimonial:`, error);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = (id: number) => runAction(id, 'approve');
  const handleReject = (id: number) => runAction(id, 'reject');
  const handleToggleActive = (id: number) => runAction(id, 'toggle');

  const pendingTestimonials = testimonials.filter(t => t.status === 'pending');
  const pendingCount = pendingTestimonials.length;
  const liveTestimonials = testimonials.filter(t => t.isActive);
  const hiddenTestimonials = testimonials.filter(
    t => !t.isActive && t.status !== 'pending'
  );

  const visibleTestimonials =
    filter === 'pending'
      ? pendingTestimonials
      : filter === 'live'
      ? liveTestimonials
      : filter === 'hidden'
      ? hiddenTestimonials
      : testimonials;

  const handleApproveAll = async () => {
    for (const testimonial of pendingTestimonials) {
      await handleApprove(testimonial.id);
    }
  };

  const handleRejectAll = async () => {
    if (
      !window.confirm(
        `Reject all ${pendingTestimonials.length} waiting reviews? They stay off the storefront.`
      )
    ) {
      return;
    }

    for (const testimonial of pendingTestimonials) {
      await handleReject(testimonial.id);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'pending', label: 'Waiting for approval', count: pendingTestimonials.length },
    { id: 'live', label: 'Live on storefront', count: liveTestimonials.length },
    { id: 'hidden', label: 'Not published', count: hiddenTestimonials.length },
    { id: 'all', label: 'All', count: testimonials.length },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reviews</h1>
        <p className="text-gray-600">
          Customer reviews submitted from the storefront wait here. Approve one and it
          goes live on the storefront.
        </p>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center justify-between gap-3">
          <p className="text-sm text-red-700">Could not load reviews: {loadError}</p>
          <button
            onClick={loadTestimonials}
            className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg bg-red-600 hover:bg-red-700 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Customer reviews waiting for approval */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-sm font-bold">
              {pendingCount}
            </span>
            <div>
              <h3 className="text-sm font-semibold text-amber-900">
                {pendingCount === 1 ? 'Customer review' : 'Customer reviews'} waiting
                for approval
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Approve a review to publish it on the storefront.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRejectAll}
              className="px-4 py-2 text-sm font-semibold text-amber-800 rounded-lg border border-amber-300 bg-white hover:bg-amber-100 transition-colors"
            >
              Reject all
            </button>
            <button
              onClick={handleApproveAll}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm"
            >
              Approve all
            </button>
          </div>
        </div>
      )}

      {/* Toggle Section Visibility */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Section Visibility
            </h3>
            <p className="text-gray-600 text-sm">
              Show or hide the reviews section on your homepage
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showTestimonials}
              onChange={handleToggleTestimonials}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map(option => (
          <button
            key={option.id}
            onClick={() => setFilter(option.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
              filter === option.id
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {option.label} ({option.count})
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {filters.find(f => f.id === filter)?.label}
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Customer submissions and your own testimonial cards
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleAddNew}
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-2 shadow-sm theme-btn-primary"
            >
              <span>+</span>
              <span>Add New</span>
            </button>
          </div>
        </div>

        {visibleTestimonials.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl text-gray-300 mb-4">📝</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'pending'
                ? 'No reviews waiting'
                : 'No reviews yet'}
            </h4>
            <p className="text-gray-600 mb-6">
              {filter === 'pending'
                ? 'Customer reviews sent from your storefront appear here for approval.'
                : 'Customer reviews sent from your storefront appear here for approval.'}
            </p>
            {filter !== 'pending' && (
              <div className="flex justify-center">
                <button
                  onClick={handleAddNew}
                  className="px-6 py-3 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm theme-btn-primary"
                >
                  Add First Testimonial
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {visibleTestimonials.map((testimonial) => {
              const isBusy = busyId === testimonial.id;

              return (
                <div key={testimonial.id} className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar
                      name={testimonial.name}
                      image={testimonial.image}
                      size={64}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {testimonial.title}
                          </h4>
                          <p className="text-sm text-gray-500 mt-0.5">
                            by {testimonial.name}
                            {testimonial.createdAt && (
                              <span className="text-gray-400">
                                {' '}
                                · {formatDate(testimonial.createdAt)}
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <Stars value={testimonial.rating} />
                            {testimonial.likes > 0 && (
                              <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                                <i className="fas fa-thumbs-up" aria-hidden="true" />
                                {testimonial.likes} found this helpful
                              </span>
                            )}
                          </div>
                          {testimonial.source === 'customer' && (
                            <p className="text-xs text-blue-600 mt-1">
                              Customer submission
                              {testimonial.submitterEmail
                                ? ` · ${testimonial.submitterEmail}`
                                : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              testimonial.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : testimonial.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {testimonial.status === 'pending'
                              ? 'Waiting for approval'
                              : testimonial.isActive
                              ? 'Live'
                              : 'Not published'}
                          </span>

                          {testimonial.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(testimonial.id)}
                                disabled={isBusy}
                                className="px-3 py-1 text-xs font-semibold text-white rounded transition-colors bg-green-600 hover:bg-green-700 disabled:opacity-50"
                              >
                                {isBusy ? 'Saving…' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleReject(testimonial.id)}
                                disabled={isBusy}
                                className="px-3 py-1 text-xs font-semibold text-gray-700 rounded border border-gray-300 transition-colors hover:bg-gray-100 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {testimonial.status !== 'pending' && (
                            <button
                              onClick={() => handleToggleActive(testimonial.id)}
                              disabled={isBusy}
                              className={`px-3 py-1 text-xs font-semibold text-white rounded transition-colors disabled:opacity-50 ${
                                testimonial.isActive
                                  ? 'bg-gray-500 hover:bg-gray-600'
                                  : 'bg-amber-600 hover:bg-amber-700'
                              }`}
                            >
                              {isBusy ? 'Saving…' : testimonial.isActive ? 'Unpublish' : 'Publish'}
                            </button>
                          )}

                          <button
                            onClick={() => handleEditTestimonial(testimonial)}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTestimonial(testimonial.id)}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{testimonial.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && editingTestimonial && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={closeModal}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          />

          {/* Modal */}
          <div
            style={{
              position: 'relative',
              backgroundColor: 'white',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              zIndex: 100000,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: '#9CA3AF',
              }}
            >
              ✕
            </button>

            <div style={{ padding: '24px' }}>
              {/* Icon */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 16px',
                  borderRadius: '50%',
                  backgroundColor: '#F0F9FF',
                }}
              >
                <i className="fas fa-quote-left text-blue-500 text-xl"></i>
              </div>

              {/* Title */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3
                  style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '8px',
                  }}
                >
                  {isAddingNew ? 'Add New Testimonial' : 'Edit Testimonial'}
                </h3>
                <p
                  style={{
                    color: '#6B7280',
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                >
                  Fill in the testimonial details below
                </p>
              </div>

              {/* Form */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px',
                    }}
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    value={editingTestimonial.title}
                    onChange={(e) =>
                      setEditingTestimonial({
                        ...editingTestimonial,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g., Recirculate, Customer Review, etc."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px',
                    }}
                  >
                    Reviewer name
                  </label>
                  <input
                    type="text"
                    value={editingTestimonial.name}
                    onChange={(e) =>
                      setEditingTestimonial({
                        ...editingTestimonial,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g., Amira B."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px',
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    value={editingTestimonial.description}
                    onChange={(e) =>
                      setEditingTestimonial({
                        ...editingTestimonial,
                        description: e.target.value,
                      })
                    }
                    rows={4}
                    placeholder="Write the testimonial content or description..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px',
                    }}
                  >
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={editingTestimonial.image}
                    onChange={(e) =>
                      setEditingTestimonial({
                        ...editingTestimonial,
                        image: e.target.value,
                      })
                    }
                    placeholder="https://example.com/image.jpg"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#6B7280',
                      marginTop: '6px',
                    }}
                  >
                    Leave this empty and the reviewer gets an avatar built
                    from their initials.
                  </p>
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <Avatar
                      name={editingTestimonial.name || editingTestimonial.title}
                      image={editingTestimonial.image}
                      size={64}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px',
                    }}
                  >
                    Rating
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setEditingTestimonial({
                            ...editingTestimonial,
                            rating: star,
                          })
                        }
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        aria-pressed={editingTestimonial.rating === star}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          fontSize: '20px',
                          lineHeight: 1,
                          color: star <= editingTestimonial.rating ? '#F59E0B' : '#D1D5DB',
                        }}
                      >
                        <i
                          className={
                            star <= editingTestimonial.rating
                              ? 'fas fa-star'
                              : 'far fa-star'
                          }
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                    <span
                      style={{
                        marginLeft: '8px',
                        fontSize: '13px',
                        color: '#6B7280',
                        alignSelf: 'center',
                      }}
                    >
                      {editingTestimonial.rating} / 5
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingTestimonial.isActive}
                    onChange={(e) =>
                      setEditingTestimonial({
                        ...editingTestimonial,
                        isActive: e.target.checked,
                      })
                    }
                    style={{ marginRight: '8px' }}
                  />
                  <label htmlFor="isActive" style={{ fontSize: '14px', color: '#374151' }}>
                    Active (show on website)
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => handleSaveTestimonial(editingTestimonial)}
                  disabled={
                    !editingTestimonial.title.trim() ||
                    !editingTestimonial.description.trim()
                  }
                  className="theme-btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    cursor:
                      editingTestimonial.title.trim() &&
                      editingTestimonial.description.trim()
                        ? 'pointer'
                        : 'not-allowed',
                    opacity:
                      editingTestimonial.title.trim() &&
                      editingTestimonial.description.trim()
                        ? 1
                        : 0.5,
                  }}
                >
                  {isAddingNew ? 'Add Testimonial' : 'Save Changes'}
                </button>
                <button
                  onClick={closeModal}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    color: '#374151',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestimonialsManagement;
