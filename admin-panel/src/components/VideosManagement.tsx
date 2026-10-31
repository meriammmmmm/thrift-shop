import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { API_BASE_URL } from '../config';
import { useNotifications } from '../hooks/useNotifications';

/**
 * "Videos".
 *
 * A clip is attached to a product and shown in the video section of the shop.
 * The file is uploaded from here and kept by the backend, which serves it
 * back with range support so the browser can play and seek it.
 */

interface VideosManagementProps {
  authToken: string;
}

interface ProductOption {
  id: number;
  name: string;
  brand: string;
  price: number;
  images?: string[];
}

interface VideoRow {
  id: number;
  product_id: number;
  title: string | null;
  mime: string;
  size: number;
  is_active: boolean;
  display_order: number;
  video_url: string;
  poster_url: string | null;
  product: {
    id: number;
    name: string;
    price: number;
    original_price: number | null;
    brand: string;
    category: string;
    image: string | null;
  };
}

/** The biggest clip the backend takes. */
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
/** The biggest still the backend takes. */
const MAX_POSTER_BYTES = 3 * 1024 * 1024;

const formatSize = (bytes: number): string => {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

/** Read a file into a data URI, the way the panel sends the worn-outfit photo. */
const readAsDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('That file could not be read'));
    reader.readAsDataURL(file);
  });

const VideosManagement: React.FC<VideosManagementProps> = ({ authToken }) => {
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');

  const [productId, setProductId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [search, setSearch] = useState('');

  const { showSuccess, showError } = useNotifications();

  const authHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    }),
    [authToken]
  );

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/videos/admin/list`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Could not load the videos');
      }

      const data = await response.json();
      setVideos(data.videos || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not load the videos';
      setError(message);
      showError('Videos', message);
    } finally {
      setLoading(false);
    }
  }, [authToken, showError]);

  const loadProducts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/admin/products?limit=500`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setProducts(data.products || []);
    } catch {
      // The picker simply stays empty; the videos still work.
    }
  }, [authToken]);

  useEffect(() => {
    loadVideos();
    loadProducts();
  }, [loadVideos, loadProducts]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products.slice(0, 100);
    return products
      .filter(
        (product) =>
          product.name?.toLowerCase().includes(term) ||
          product.brand?.toLowerCase().includes(term)
      )
      .slice(0, 100);
  }, [products, search]);

  const selectedProduct = products.find(
    (product) => String(product.id) === productId
  );

  const handleUpload = async () => {
    if (!productId) {
      showError('Videos', 'Pick the product this clip belongs to');
      return;
    }
    if (!videoFile) {
      showError('Videos', 'Choose a video file to upload');
      return;
    }
    if (videoFile.size > MAX_VIDEO_BYTES) {
      showError('Videos', 'That video is too large (25 MB is the limit)');
      return;
    }
    if (posterFile && posterFile.size > MAX_POSTER_BYTES) {
      showError('Videos', 'That poster is too large (3 MB is the limit)');
      return;
    }

    try {
      setUploading(true);

      const video = await readAsDataUri(videoFile);
      const poster = posterFile ? await readAsDataUri(posterFile) : undefined;

      const response = await fetch(`${API_BASE_URL}/videos`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          product_id: parseInt(productId, 10),
          title: title.trim() || selectedProduct?.name || 'Video',
          video,
          poster,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'The video could not be uploaded');
      }

      showSuccess('Success', 'The video is uploaded and live in the shop');
      setTitle('');
      setVideoFile(null);
      setPosterFile(null);
      setProductId('');
      setSearch('');
      await loadVideos();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'The video could not be uploaded';
      showError('Videos', message);
    } finally {
      setUploading(false);
    }
  };

  const updateVideo = async (id: number, changes: Record<string, unknown>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(changes),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'The video could not be updated');
      }

      await loadVideos();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'The video could not be updated';
      showError('Videos', message);
    }
  };

  const deleteVideo = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'The video could not be removed');
      }

      showSuccess('Success', 'The video is removed');
      await loadVideos();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'The video could not be removed';
      showError('Videos', message);
    }
  };

  /** Move a clip one place up or down in the section. */
  const moveVideo = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= videos.length) return;

    const next = [...videos];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);

    try {
      const response = await fetch(`${API_BASE_URL}/videos/reorder`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          videos: next.map((video, position) => ({
            id: video.id,
            display_order: position,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'The order could not be saved');
      }

      await loadVideos();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'The order could not be saved';
      showError('Videos', message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex justify-between items-center compact-spacing">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] bg-clip-text text-transparent mb-2">
            Videos
          </h2>
          <p className="text-gray-600">
            Attach a clip to a product and it shows in the video section of your shop
          </p>
        </div>
        <button
          onClick={loadVideos}
          className="px-6 py-3 bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] text-white font-semibold rounded-xl hover:from-[var(--color-primary)] hover:to-[var(--color-primary-hover)] shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
        >
          <i className="fas fa-refresh mr-2"></i>Refresh
        </button>
      </div>

      {/* Upload */}
      <div className="modern-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          <i className="fas fa-cloud-arrow-up mr-2 text-[var(--color-primary)]"></i>
          Upload a video
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          MP4, WebM, MOV or OGG, up to 25 MB. A poster image is optional — it is
          the still shown before the clip is played.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent mb-2"
              />
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              >
                <option value="">Choose a product…</option>
                {filteredProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                    {product.brand ? ` — ${product.brand}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={selectedProduct?.name || 'The name of the video'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video file
              </label>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/ogg"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--color-primary)] file:px-5 file:py-2.5 file:text-white file:font-semibold hover:file:bg-[var(--color-primary-hover)]"
              />
              {videoFile && (
                <p className="text-xs text-gray-500 mt-2">
                  {videoFile.name} — {formatSize(videoFile.size)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poster image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-gray-200 file:px-5 file:py-2.5 file:text-gray-700 file:font-semibold hover:file:bg-gray-300"
              />
              {posterFile && (
                <p className="text-xs text-gray-500 mt-2">
                  {posterFile.name} — {formatSize(posterFile.size)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-6 py-3 bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] text-white font-semibold rounded-xl hover:from-[var(--color-primary)] hover:to-[var(--color-primary-hover)] shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center"
          >
            {uploading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>Uploading…
              </>
            ) : (
              <>
                <i className="fas fa-upload mr-2"></i>Upload video
              </>
            )}
          </button>
        </div>
      </div>

      {/* The clips */}
      <div className="modern-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            <i className="fas fa-film mr-2 text-[var(--color-primary)]"></i>
            Your videos
          </h3>
          <span className="text-sm text-gray-500">{videos.length} total</span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            <i className="fas fa-spinner fa-spin text-2xl mb-3"></i>
            <p>Loading your videos…</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center text-red-600">
            <i className="fas fa-exclamation-circle text-2xl mb-3"></i>
            <p>{error}</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <i className="fas fa-video text-3xl mb-3 text-gray-300"></i>
            <p>No videos yet. Upload the first clip above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {videos.map((video, index) => (
              <div
                key={video.id}
                className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                {/* The still */}
                <div className="w-full md:w-40 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                  {video.poster_url ? (
                    <img
                      src={video.poster_url}
                      alt={video.title || video.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : video.product.image ? (
                    <img
                      src={video.product.image}
                      alt={video.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <i className="fas fa-video text-2xl"></i>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center">
                      <i className="fas fa-play text-xs"></i>
                    </span>
                  </div>
                </div>

                {/* The details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">
                    {video.title || video.product.name}
                  </h4>
                  <p className="text-sm text-gray-500 truncate">
                    {video.product.name}
                    {video.product.brand ? ` — ${video.product.brand}` : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatSize(video.size)} · {video.mime}
                  </p>
                </div>

                {/* The actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      video.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {video.is_active ? 'Live' : 'Hidden'}
                  </span>

                  <button
                    onClick={() =>
                      updateVideo(video.id, { is_active: !video.is_active })
                    }
                    title={video.is_active ? 'Hide from the shop' : 'Show in the shop'}
                    className="w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <i className={`fas ${video.is_active ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                  </button>

                  <button
                    onClick={() => moveVideo(index, -1)}
                    disabled={index === 0}
                    title="Move up"
                    className="w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-arrow-up"></i>
                  </button>

                  <button
                    onClick={() => moveVideo(index, 1)}
                    disabled={index === videos.length - 1}
                    title="Move down"
                    className="w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-arrow-down"></i>
                  </button>

                  <a
                    href={video.video_url}
                    target="_blank"
                    rel="noreferrer"
                    title="Open the clip"
                    className="w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
                  >
                    <i className="fas fa-external-link-alt"></i>
                  </a>

                  <button
                    onClick={() => deleteVideo(video.id)}
                    title="Remove"
                    className="w-9 h-9 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideosManagement;
