import React, { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '../hooks/useNotifications';

/**
 * "Most Loved Pieces".
 *
 * The pieces the customers pressed the heart on the most, with the number of
 * loves on each one. The count comes from the real votes, so it matches what
 * the storefront shows next to the price.
 */

interface MostLovedPiecesProps {
  authToken: string;
}

interface LovedProduct {
  id: number;
  name: string;
  brand: string;
  category: string;
  size: string;
  price: number;
  original_price: number | null;
  images: string[];
  views: number;
  likes: number;
  visible: boolean;
  in_stock: boolean;
  reservation_status: string;
  created_at: string;
  rank: number;
}

interface Summary {
  total_loves: number;
  loved_pieces: number;
  catalogue_size: number;
  top_product: { id: number; name: string; likes: number } | null;
}

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  'https://backend-wild-skylark-9834.fly.dev/api';

/** The medal shown next to the first three pieces. */
const RANK_MEDAL: Record<number, { icon: string; className: string }> = {
  1: { icon: 'fas fa-crown', className: 'bg-amber-100 text-amber-600' },
  2: { icon: 'fas fa-medal', className: 'bg-gray-200 text-gray-500' },
  3: { icon: 'fas fa-medal', className: 'bg-orange-100 text-orange-500' },
};

const MostLovedPieces: React.FC<MostLovedPiecesProps> = ({ authToken }) => {
  const [products, setProducts] = useState<LovedProduct[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [onlyLoved, setOnlyLoved] = useState(false);
  const { showError } = useNotifications();

  const loadMostLoved = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_BASE_URL}/products/admin/most-loved?limit=100`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Could not load the most loved pieces');
      }

      const data = await response.json();
      setProducts(data.products || []);
      setSummary(data.summary || null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not load the most loved pieces';
      setError(message);
      setProducts([]);
      showError('Most loved pieces', message);
    } finally {
      setLoading(false);
    }
  }, [authToken, showError]);

  useEffect(() => {
    loadMostLoved();
  }, [loadMostLoved]);

  const lovedPieces = products.filter((product) => product.likes > 0);
  const shown = onlyLoved ? lovedPieces : products;

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex justify-between items-center compact-spacing">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] bg-clip-text text-transparent mb-2">
            Most Loved Pieces
          </h2>
          <p className="text-gray-600">
            The pieces your customers love the most, ranked by the number of loves
          </p>
        </div>
        <button
          onClick={loadMostLoved}
          className="px-6 py-3 bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] text-white font-semibold rounded-xl hover:from-[var(--color-primary)] hover:to-[var(--color-primary-hover)] shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
        >
          <i className="fas fa-refresh mr-2"></i>Refresh
        </button>
      </div>

      {/* The numbers */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-rose-400">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total loves
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {summary.total_loves}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <i className="fas fa-heart mr-1 text-rose-400"></i>
              pressed across the shop
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[var(--color-primary)]">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Loved pieces
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {summary.loved_pieces}
            </p>
            <p className="text-xs text-gray-500 mt-1">of {summary.catalogue_size} pieces</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-amber-400">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Most loved piece
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-1 truncate">
              {summary.top_product ? summary.top_product.likes : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1 truncate">
              {summary.top_product ? summary.top_product.name : 'No loves yet'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-gray-300">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Loved by
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {summary.loved_pieces > 0 ? '✓' : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {summary.loved_pieces > 0
                ? 'customers have loved a piece'
                : 'waiting for the first love'}
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-md">
        <label className="text-sm font-medium text-gray-700">Show:</label>
        <button
          onClick={() => setOnlyLoved(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            !onlyLoved
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Whole catalogue ({products.length})
        </button>
        <button
          onClick={() => setOnlyLoved(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            onlyLoved
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Loved only ({lovedPieces.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <i className="fas fa-exclamation-triangle text-3xl text-amber-400 mb-3"></i>
          <p className="text-gray-700">{error}</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <i className="fas fa-heart text-4xl text-gray-300 mb-4"></i>
          <p className="text-lg font-medium text-gray-700">No loves yet</p>
          <p className="text-sm text-gray-500">
            When a customer presses the heart on a piece, it shows up here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {shown.map((product) => {
            const medal = RANK_MEDAL[product.rank];

            return (
              <div
                key={product.id}
                className={`bg-white rounded-xl shadow-md p-4 flex items-center gap-4 transition-shadow hover:shadow-lg ${
                  product.likes > 0 ? '' : 'opacity-70'
                }`}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-12 text-center">
                  {medal ? (
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${medal.className}`}
                      title={`Number ${product.rank}`}
                    >
                      <i className={`${medal.icon} text-sm`} aria-hidden="true"></i>
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-400">
                      {product.rank}
                    </span>
                  )}
                </div>

                {/* Picture */}
                <div className="h-20 w-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border-2 border-gray-200 shadow-sm">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name || 'Product'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <i className="fas fa-image text-gray-400 text-xl"></i>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {product.name || 'Unnamed Product'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {product.brand || 'No Brand'}
                    {product.size ? ` · Size ${product.size}` : ''}
                    {product.category ? ` · ${product.category}` : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <i className="fas fa-eye mr-1"></i>
                    {product.views || 0} views
                  </p>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-sm font-bold text-gray-900">
                    {(parseFloat(product.price as any) || 0).toFixed(2)}
                  </p>
                  {product.original_price ? (
                    <p className="text-xs text-gray-400 line-through">
                      {(parseFloat(product.original_price as any) || 0).toFixed(2)}
                    </p>
                  ) : null}
                </div>

                {/* The count */}
                <div className="flex-shrink-0">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold ${
                      product.likes > 0
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    title={`${product.likes} visitors loved this piece`}
                  >
                    <i className="fas fa-heart" aria-hidden="true"></i>
                    {product.likes}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MostLovedPieces;
