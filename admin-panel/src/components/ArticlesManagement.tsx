import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://backend-wild-skylark-9834.fly.dev/api';

interface Article {
  id: number;
  title: string;
  summary: string;
  content: string;
  image: string;
  author: string;
  isActive: boolean;
}

interface ArticlesManagementProps {
  authToken: string;
}

const transformArticle = (a: any): Article => ({
  id: a.id,
  title: a.title,
  summary: a.summary || '',
  content: a.content || '',
  image: a.image || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=400&fit=crop',
  author: a.author || 'Admin',
  isActive: a.is_active === 1 || a.is_active === true
});

const ArticlesManagement: React.FC<ArticlesManagementProps> = ({ authToken }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/articles`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setArticles((data.articles || []).map(transformArticle));
      } else {
        setArticles([]);
      }
    } catch (error) {
      console.error('Failed to load articles:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [authToken]);

  const handleAddNew = () => {
    setEditingArticle({
      id: Date.now(),
      title: '',
      summary: '',
      content: '',
      image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=400&fit=crop',
      author: 'Admin',
      isActive: true
    });
    setIsAddingNew(true);
    setIsModalOpen(true);
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setIsAddingNew(false);
    setIsModalOpen(true);
  };

  const handleSaveArticle = async (article: Article) => {
    try {
      const payload = {
        title: article.title,
        summary: article.summary,
        content: article.content,
        image: article.image,
        author: article.author,
        isActive: article.isActive,
        displayOrder: article.id
      };

      if (isAddingNew) {
        const response = await fetch(`${API_BASE_URL}/articles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          setArticles([...articles, transformArticle(data.article)]);
        } else {
          console.error('Failed to add article');
          return;
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/articles/${article.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          const updated = transformArticle(data.article);
          setArticles(articles.map(a => a.id === article.id ? updated : a));
        } else {
          console.error('Failed to update article');
          return;
        }
      }

      setIsModalOpen(false);
      setEditingArticle(null);
      setIsAddingNew(false);
    } catch (error) {
      console.error('Failed to save article:', error);
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
          setArticles(articles.filter(a => a.id !== id));
        } else {
          console.error('Failed to delete article');
        }
      } catch (error) {
        console.error('Failed to delete article:', error);
      }
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/articles/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        const updated = transformArticle(data.article);
        setArticles(articles.map(a => a.id === id ? updated : a));
      } else {
        console.error('Failed to toggle article');
      }
    } catch (error) {
      console.error('Toggle error:', error);
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Articles Management</h1>
        <p className="text-gray-600">Add and manage "What to do" articles and guides shown on your website</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Articles Content</h3>
            <p className="text-gray-600 text-sm mt-1">Add, edit, or remove articles</p>
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

        {articles.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl text-gray-300 mb-4">📰</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Articles Yet</h4>
            <p className="text-gray-600 mb-6">Add your first article to get started</p>
            <div className="flex justify-center">
              <button
                onClick={handleAddNew}
                className="px-6 py-3 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm theme-btn-primary"
              >
                Add First Article
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {articles.map((article) => (
              <div key={article.id} className="p-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-24 h-16 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=400&fit=crop';
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{article.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          article.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {article.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleToggleActive(article.id)}
                          className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                          {article.isActive ? 'ON' : 'OFF'}
                        </button>
                        <button
                          onClick={() => handleEditArticle(article)}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {article.summary && (
                      <p className="text-gray-800 text-sm font-medium mb-1">{article.summary}</p>
                    )}
                    <p className="text-gray-600 text-sm line-clamp-2">{article.content}</p>
                    {article.author && (
                      <p className="text-gray-400 text-xs mt-2">By {article.author}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && editingArticle && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }}
        >
          <div
            onClick={() => { setIsModalOpen(false); setEditingArticle(null); setIsAddingNew(false); }}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)'
            }}
          />

          <div
            style={{
              position: 'relative', backgroundColor: 'white', borderRadius: '16px',
              maxWidth: '560px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              zIndex: 100000, maxHeight: '90vh', overflowY: 'auto'
            }}
          >
            <button
              onClick={() => { setIsModalOpen(false); setEditingArticle(null); setIsAddingNew(false); }}
              style={{
                position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none',
                background: 'none', cursor: 'pointer', color: '#9CA3AF'
              }}
            >
              ✕
            </button>

            <div style={{ padding: '24px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '48px', height: '48px', margin: '0 auto 16px', borderRadius: '50%', backgroundColor: '#F0F9FF'
              }}>
                <i className="fas fa-newspaper text-blue-500 text-xl"></i>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                  {isAddingNew ? 'Add New Article' : 'Edit Article'}
                </h3>
                <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: '1.5' }}>
                  Fill in the article details below
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Title</label>
                  <input
                    type="text"
                    value={editingArticle.title}
                    onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                    placeholder="e.g., How to Style Thrifted Denim"
                    style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Summary (short intro)</label>
                  <input
                    type="text"
                    value={editingArticle.summary}
                    onChange={(e) => setEditingArticle({ ...editingArticle, summary: e.target.value })}
                    placeholder="One-line summary shown in the article card"
                    style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Content</label>
                  <textarea
                    value={editingArticle.content}
                    onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                    rows={6}
                    placeholder="Write the full article / what-to-do guide here..."
                    style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Author</label>
                  <input
                    type="text"
                    value={editingArticle.author}
                    onChange={(e) => setEditingArticle({ ...editingArticle, author: e.target.value })}
                    placeholder="Author name"
                    style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Image URL</label>
                  <input
                    type="url"
                    value={editingArticle.image}
                    onChange={(e) => setEditingArticle({ ...editingArticle, image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                  {editingArticle.image && (
                    <div style={{ marginTop: '8px', textAlign: 'center' }}>
                      <img
                        src={editingArticle.image}
                        alt="Preview"
                        style={{ width: '160px', height: '90px', borderRadius: '8px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=400&fit=crop';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    id="articleIsActive"
                    checked={editingArticle.isActive}
                    onChange={(e) => setEditingArticle({ ...editingArticle, isActive: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  <label htmlFor="articleIsActive" style={{ fontSize: '14px', color: '#374151' }}>
                    Active (show on website)
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => handleSaveArticle(editingArticle)}
                  disabled={!editingArticle.title.trim() || !editingArticle.content.trim()}
                  className="theme-btn-primary"
                  style={{
                    width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', fontWeight: '500',
                    cursor: editingArticle.title.trim() && editingArticle.content.trim() ? 'pointer' : 'not-allowed',
                    opacity: editingArticle.title.trim() && editingArticle.content.trim() ? 1 : 0.5
                  }}
                >
                  {isAddingNew ? 'Add Article' : 'Save Changes'}
                </button>
                <button
                  onClick={() => { setIsModalOpen(false); setEditingArticle(null); setIsAddingNew(false); }}
                  style={{
                    width: '100%', padding: '12px 16px', backgroundColor: 'transparent', color: '#374151',
                    border: '1px solid #D1D5DB', borderRadius: '8px', fontWeight: '500', cursor: 'pointer'
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

export default ArticlesManagement;
