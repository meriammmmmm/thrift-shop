import React, { useState, useEffect } from 'react';

interface Testimonial {
  id: number;
  name: string;
  image: string;
  title: string;
  description: string;
  isActive: boolean;
}

interface TestimonialsManagementProps {
  authToken: string;
}

const TestimonialsManagement: React.FC<TestimonialsManagementProps> = ({ authToken }) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [showTestimonials, setShowTestimonials] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // Default testimonials
  const defaultTestimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Recirculate',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face',
      title: 'Recirculate',
      description: 'Landfills are out. Keeping clothes in circulation is in. Send us your clothes, we\'ll do the rest.',
      isActive: true
    },
    {
      id: 2,
      name: 'Reimagine',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      title: 'Reimagine',
      description: 'Find yourself in our closet as we simplify secondhand. Let our features work for you.',
      isActive: true
    },
    {
      id: 3,
      name: 'Repeat',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
      title: 'Repeat',
      description: 'Where your old fave becomes someone\'s new fave and making an impact comes with the territory.',
      isActive: true
    }
  ];

  // Load testimonials from API
  const loadTestimonials = async () => {
    console.log('📥 Loading testimonials...');
    try {
      setLoading(true);
      
      // Load testimonials from API
      const response = await fetch('https://mery-rose-backend.onrender.comapi/testimonials', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('🌐 Load testimonials API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Raw testimonials data from API:', data.testimonials);
        
        // Transform API data to match component interface
        const transformedTestimonials = (data.testimonials || []).map((t: any) => ({
          id: t.id,
          name: t.name || t.title,
          image: t.image || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face',
          title: t.title,
          description: t.description,
          isActive: t.is_active === 1 // Convert database boolean to component boolean
        }));
        
        console.log('🔄 Transformed testimonials for component:', transformedTestimonials);
        setTestimonials(transformedTestimonials);
      } else {
        console.log('⚠️ API failed, using default testimonials');
        // Fallback to default testimonials if API fails
        setTestimonials(defaultTestimonials);
      }
      
      // Load testimonials visibility setting
      const settingsResponse = await fetch('https://mery-rose-backend.onrender.comapi/companies/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setShowTestimonials(settingsData.company?.show_testimonials !== 0);
      }
      
    } catch (error) {
      console.error('❌ Failed to load testimonials:', error);
      // Fallback to default testimonials
      setTestimonials(defaultTestimonials);
    } finally {
      setLoading(false);
    }
  };

  // Load testimonials on component mount
  useEffect(() => {
    console.log('🎬 TestimonialsManagement component mounted, loading testimonials...');
    loadTestimonials();
  }, [authToken]);

  const handleToggleTestimonials = async () => {
    try {
      const response = await fetch('https://mery-rose-backend.onrender.comapi/testimonials/section/visibility', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ showTestimonials: !showTestimonials })
      });
      
      if (response.ok) {
        setShowTestimonials(!showTestimonials);
        console.log('Testimonials visibility toggled:', !showTestimonials);
      } else {
        console.error('Failed to toggle testimonials visibility');
      }
    } catch (error) {
      console.error('Failed to toggle testimonials:', error);
    }
  };

  const handleAddNew = () => {
    const newTestimonial: Testimonial = {
      id: Date.now(), // Simple ID generation
      name: '',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      title: '',
      description: '',
      isActive: true
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

  const handleSaveTestimonial = async (testimonial: Testimonial) => {
    try {
      if (isAddingNew) {
        // Add new testimonial
        const response = await fetch('https://mery-rose-backend.onrender.comapi/testimonials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            title: testimonial.title,
            name: testimonial.name,
            description: testimonial.description,
            image: testimonial.image,
            isActive: testimonial.isActive,
            displayOrder: testimonial.id
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          // Transform the returned testimonial data
          const newTestimonial = {
            id: data.testimonial.id,
            name: data.testimonial.name || data.testimonial.title,
            image: data.testimonial.image,
            title: data.testimonial.title,
            description: data.testimonial.description,
            isActive: data.testimonial.is_active === 1
          };
          setTestimonials([...testimonials, newTestimonial]);
          console.log('New testimonial added:', newTestimonial);
        } else {
          console.error('Failed to add testimonial');
          return;
        }
      } else {
        // Update existing testimonial
        const response = await fetch(`https://mery-rose-backend.onrender.comapi/testimonials/${testimonial.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            title: testimonial.title,
            name: testimonial.name,
            description: testimonial.description,
            image: testimonial.image,
            isActive: testimonial.isActive,
            displayOrder: testimonial.id
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          // Transform the returned testimonial data
          const updatedTestimonial = {
            id: data.testimonial.id,
            name: data.testimonial.name || data.testimonial.title,
            image: data.testimonial.image,
            title: data.testimonial.title,
            description: data.testimonial.description,
            isActive: data.testimonial.is_active === 1
          };
          
          const updatedTestimonials = testimonials.map(t => 
            t.id === testimonial.id ? updatedTestimonial : t
          );
          setTestimonials(updatedTestimonials);
          console.log('Testimonial updated:', updatedTestimonial);
        } else {
          console.error('Failed to update testimonial');
          return;
        }
      }
      
      setIsModalOpen(false);
      setEditingTestimonial(null);
      setIsAddingNew(false);
    } catch (error) {
      console.error('Failed to save testimonial:', error);
    }
  };

  const handleDeleteTestimonial = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this testimonial?')) {
      try {
        const response = await fetch(`https://mery-rose-backend.onrender.comapi/testimonials/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (response.ok) {
          const updatedTestimonials = testimonials.filter(t => t.id !== id);
          setTestimonials(updatedTestimonials);
          console.log('Testimonial deleted:', id);
        } else {
          console.error('Failed to delete testimonial');
        }
      } catch (error) {
        console.error('Failed to delete testimonial:', error);
      }
    }
  };

  const handleToggleActive = async (id: number) => {
    console.log('🔄 Toggle clicked for testimonial ID:', id);
    console.log('📊 Current testimonials state:', testimonials.map(t => ({ id: t.id, title: t.title, isActive: t.isActive })));
    
    try {
      const response = await fetch(`https://mery-rose-backend.onrender.comapi/testimonials/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('🌐 Toggle API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Toggle API response data:', data);
        
        // Transform the returned testimonial data
        const updatedTestimonial = {
          id: data.testimonial.id,
          name: data.testimonial.name || data.testimonial.title,
          image: data.testimonial.image,
          title: data.testimonial.title,
          description: data.testimonial.description,
          isActive: data.testimonial.is_active === 1 // Convert database boolean
        };
        
        console.log('🔄 Transformed testimonial:', updatedTestimonial);
        
        const updatedTestimonials = testimonials.map(t => 
          t.id === id ? updatedTestimonial : t
        );
        
        console.log('📊 Updated testimonials state:', updatedTestimonials.map(t => ({ id: t.id, title: t.title, isActive: t.isActive })));
        
        setTestimonials(updatedTestimonials);
        console.log('✅ Testimonial toggled successfully:', updatedTestimonial);
      } else {
        const errorData = await response.json();
        console.error('❌ Toggle API failed:', response.status, errorData);
      }
    } catch (error) {
      console.error('❌ Toggle error:', error);
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Testimonials Management</h1>
        <p className="text-gray-600">Manage the "Fashion, meet Forever" section on your homepage</p>
      </div>

      {/* Toggle Section Visibility */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Section Visibility</h3>
            <p className="text-gray-600 text-sm">Show or hide the testimonials section on your homepage</p>
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

      {/* Testimonials List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Testimonials Content</h3>
            <p className="text-gray-600 text-sm mt-1">Add, edit, or remove testimonial cards</p>
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

        {testimonials.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl text-gray-300 mb-4">📝</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Testimonials Yet</h4>
            <p className="text-gray-600 mb-6">Add your first testimonial to get started</p>
            <div className="flex justify-center">
              <button
                onClick={handleAddNew}
                className="px-6 py-3 text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm theme-btn-primary"
              >
                Add First Testimonial
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="p-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{testimonial.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          testimonial.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {testimonial.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={testimonial.isActive || false}
                            onChange={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🔄 Toggle clicked for testimonial:', testimonial.id, 'current state:', testimonial.isActive);
                              handleToggleActive(testimonial.id);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                        </label>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🔄 Button toggle clicked for testimonial:', testimonial.id);
                            handleToggleActive(testimonial.id);
                          }}
                          className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                          {testimonial.isActive ? 'ON' : 'OFF'}
                        </button>
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
            ))}
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
            padding: '16px'
          }}
        >
          {/* Backdrop */}
          <div 
            onClick={() => {
              setIsModalOpen(false);
              setEditingTestimonial(null);
              setIsAddingNew(false);
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)'
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
              overflowY: 'auto'
            }}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setIsModalOpen(false);
                setEditingTestimonial(null);
                setIsAddingNew(false);
              }}
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
                color: '#9CA3AF'
              }}
            >
              ✕
            </button>
            
            <div style={{ padding: '24px' }}>
              {/* Icon */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                margin: '0 auto 16px',
                borderRadius: '50%',
                backgroundColor: '#F0F9FF'
              }}>
                <i className="fas fa-quote-left text-blue-500 text-xl"></i>
              </div>
              
              {/* Title */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '8px'
                }}>{isAddingNew ? 'Add New Testimonial' : 'Edit Testimonial'}</h3>
                <p style={{
                  color: '#6B7280',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>Fill in the testimonial details below</p>
              </div>
              
              {/* Form */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>Title</label>
                  <input
                    type="text"
                    value={editingTestimonial.title}
                    onChange={(e) => setEditingTestimonial({
                      ...editingTestimonial,
                      title: e.target.value
                    })}
                    placeholder="e.g., Recirculate, Customer Review, etc."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>Name (Internal)</label>
                  <input
                    type="text"
                    value={editingTestimonial.name}
                    onChange={(e) => setEditingTestimonial({
                      ...editingTestimonial,
                      name: e.target.value
                    })}
                    placeholder="Internal reference name"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>Description</label>
                  <textarea
                    value={editingTestimonial.description}
                    onChange={(e) => setEditingTestimonial({
                      ...editingTestimonial,
                      description: e.target.value
                    })}
                    rows={4}
                    placeholder="Write the testimonial content or description..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>Image URL</label>
                  <input
                    type="url"
                    value={editingTestimonial.image}
                    onChange={(e) => setEditingTestimonial({
                      ...editingTestimonial,
                      image: e.target.value
                    })}
                    placeholder="https://example.com/image.jpg"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  {editingTestimonial.image && (
                    <div style={{ marginTop: '8px', textAlign: 'center' }}>
                      <img 
                        src={editingTestimonial.image} 
                        alt="Preview" 
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingTestimonial.isActive}
                    onChange={(e) => setEditingTestimonial({
                      ...editingTestimonial,
                      isActive: e.target.checked
                    })}
                    style={{ marginRight: '8px' }}
                  />
                  <label htmlFor="isActive" style={{
                    fontSize: '14px',
                    color: '#374151'
                  }}>
                    Active (show on website)
                  </label>
                </div>
              </div>
              
              {/* Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => handleSaveTestimonial(editingTestimonial)}
                  disabled={!editingTestimonial.title.trim() || !editingTestimonial.description.trim()}
                  className="theme-btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    cursor: editingTestimonial.title.trim() && editingTestimonial.description.trim() ? 'pointer' : 'not-allowed',
                    opacity: editingTestimonial.title.trim() && editingTestimonial.description.trim() ? 1 : 0.5
                  }}
                >
                  {isAddingNew ? 'Add Testimonial' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTestimonial(null);
                    setIsAddingNew(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    color: '#374151',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontWeight: '500',
                    cursor: 'pointer'
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