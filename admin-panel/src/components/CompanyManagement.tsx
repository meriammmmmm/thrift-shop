import React, { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import { useNotifications } from '../hooks/useNotifications';

interface CompanyManagementProps {
  authToken: string;
}

interface Company {
  id: number;
  name: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  commission_rate: number;
  logo: string | null;
  status: string;
  admin_count: number;
  product_count: number;
  order_count: number;
  created_at: string;
}

const API_BASE_URL = 'https://mertrosebackend-7wop5nev.b4a.run/api';

const CompanyManagement: React.FC<CompanyManagementProps> = ({ authToken }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<{ id: number; name: string } | null>(null);
  const { showSuccess, showError } = useNotifications();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    commission_rate: 0.05,
    admin_email: '',
    admin_password: '',
    admin_name: '',
    logo: ''
  });

  useEffect(() => {
    loadCompanies();
  }, [authToken]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/companies`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies);
      }
    } catch (error) {
      console.error('Companies load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'commission_rate' ? parseFloat(value) : value
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFormData(prev => ({ ...prev, logo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const createCompany = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Success', `Company "${result.company.name}" created successfully!`);
        resetForm();
        loadCompanies();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to create company');
      }
    } catch (error) {
      console.error('Create company error:', error);
      showError('Error', 'Failed to create company');
    }
  };

  const updateCompany = async () => {
    if (!editingCompany) return;

    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        commission_rate: formData.commission_rate,
        logo: formData.logo
      };

      const response = await fetch(`${API_BASE_URL}/companies/${editingCompany.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Success', `Company "${result.company.name}" updated successfully!`);
        resetForm();
        loadCompanies();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to update company');
      }
    } catch (error) {
      console.error('Update company error:', error);
      showError('Error', 'Failed to update company');
    }
  };

  const updateCompanyStatus = async (companyId: number, status: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies/${companyId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Success', result.message);
        loadCompanies();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to update company status');
      }
    } catch (error) {
      console.error('Update company status error:', error);
      showError('Error', 'Failed to update company status');
    }
  };

  const deleteCompany = async (companyId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Success', result.message);
        loadCompanies();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to delete company');
      }
    } catch (error) {
      console.error('Delete company error:', error);
      showError('Error', 'Failed to delete company');
    }
    
    setShowDeleteConfirm(false);
    setCompanyToDelete(null);
  };

  const handleDeleteClick = (companyId: number, companyName: string) => {
    setCompanyToDelete({ id: companyId, name: companyName });
    setShowDeleteConfirm(true);
  };

  const startEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      description: company.description,
      email: company.email,
      phone: company.phone,
      address: company.address,
      city: company.city,
      country: company.country,
      commission_rate: company.commission_rate,
      admin_email: '',
      admin_password: '',
      admin_name: '',
      logo: company.logo || ''
    });
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      commission_rate: 0.05,
      admin_email: '',
      admin_password: '',
      admin_name: '',
      logo: ''
    });
    setShowCreateForm(false);
    setEditingCompany(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCompany) {
      updateCompany();
    } else {
      createCompany();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] bg-clip-text text-transparent">
            {editingCompany ? 'Edit Company' : 'Create New Company'}
          </h2>
          <button
            onClick={resetForm}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            <i className="fas fa-arrow-left mr-2"></i>Back to Companies
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modern-card p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="modern-input w-full"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="modern-input w-full"
                  placeholder="Brief description of the company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="modern-input w-full"
                  placeholder="company@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="modern-input w-full"
                  placeholder="+1-555-0123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate</label>
                <input
                  type="number"
                  name="commission_rate"
                  value={formData.commission_rate}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max="1"
                  className="modern-input w-full"
                  placeholder="0.05 (5%)"
                />
              </div>
            </div>

            {/* Location & Admin */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Location & Admin</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="modern-input w-full"
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="modern-input w-full"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="modern-input w-full"
                    placeholder="Country"
                  />
                </div>
              </div>

              {!editingCompany && (
                <>
                  <h4 className="text-md font-semibold text-gray-900 mt-6">Admin Account</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email *</label>
                    <input
                      type="email"
                      name="admin_email"
                      value={formData.admin_email}
                      onChange={handleInputChange}
                      required={!editingCompany}
                      className="modern-input w-full"
                      placeholder="admin@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Password *</label>
                    <input
                      type="password"
                      name="admin_password"
                      value={formData.admin_password}
                      onChange={handleInputChange}
                      required={!editingCompany}
                      className="modern-input w-full"
                      placeholder="Strong password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Name</label>
                    <input
                      type="text"
                      name="admin_name"
                      value={formData.admin_name}
                      onChange={handleInputChange}
                      className="modern-input w-full"
                      placeholder="Admin full name"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Company Logo</h3>
            <div className="flex items-center space-x-4">
              {formData.logo && (
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                  <img src={formData.logo} alt="Logo preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition-colors"
                >
                  <i className="fas fa-upload mr-2"></i>
                  {formData.logo ? 'Change Logo' : 'Upload Logo'}
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <i className={`fas ${editingCompany ? 'fa-save' : 'fa-plus'} mr-2`}></i>
              {editingCompany ? 'Update Company' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] bg-clip-text text-transparent mb-2">
            Company Management
          </h2>
          <p className="text-gray-600">Manage companies and their admin accounts</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
        >
          <i className="fas fa-plus mr-2"></i>Create Company
        </button>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div key={company.id} className="modern-card p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {company.logo ? (
                  <img src={company.logo} alt={company.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] flex items-center justify-center">
                    <i className="fas fa-building text-white"></i>
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{company.name}</h3>
                  <p className="text-sm text-gray-500">{company.city}, {company.country}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                company.status === 'active' ? 'bg-green-100 text-green-800' : 
                company.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                company.status === 'rejected' ? 'bg-red-100 text-red-800' :
                company.status === 'suspended' ? 'bg-gray-100 text-gray-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {company.status === 'pending' && <i className="fas fa-clock mr-1"></i>}
                {company.status === 'active' && <i className="fas fa-check mr-1"></i>}
                {company.status === 'rejected' && <i className="fas fa-times mr-1"></i>}
                {company.status === 'suspended' && <i className="fas fa-pause mr-1"></i>}
                {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
              </span>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{company.description}</p>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--color-primary)]">{company.admin_count}</div>
                <div className="text-xs text-gray-500">Admins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--color-primary)]">{company.product_count}</div>
                <div className="text-xs text-gray-500">Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--color-primary)]">{company.order_count}</div>
                <div className="text-xs text-gray-500">Orders</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>Commission: {(company.commission_rate * 100).toFixed(1)}%</span>
              <span>{new Date(company.created_at).toLocaleDateString()}</span>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => startEdit(company)}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm font-medium"
              >
                <i className="fas fa-edit mr-1"></i>Edit
              </button>
              
              {company.status === 'pending' && (
                <>
                  <button
                    onClick={() => updateCompanyStatus(company.id, 'active')}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 text-sm font-medium"
                  >
                    <i className="fas fa-check mr-1"></i>Approve
                  </button>
                  <button
                    onClick={() => updateCompanyStatus(company.id, 'rejected')}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-sm font-medium"
                  >
                    <i className="fas fa-times mr-1"></i>Reject
                  </button>
                </>
              )}
              
              {company.status === 'active' && (
                <button
                  onClick={() => updateCompanyStatus(company.id, 'suspended')}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 text-sm font-medium"
                >
                  <i className="fas fa-pause mr-1"></i>Suspend
                </button>
              )}
              
              {company.status === 'suspended' && (
                <button
                  onClick={() => updateCompanyStatus(company.id, 'active')}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 text-sm font-medium"
                >
                  <i className="fas fa-play mr-1"></i>Activate
                </button>
              )}
              
              <button
                onClick={() => handleDeleteClick(company.id, company.name)}
                className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-sm font-medium"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="text-center py-12">
          <i className="fas fa-building text-4xl text-gray-300 mb-4"></i>
          <p className="text-lg font-medium text-gray-500">No companies found</p>
          <p className="text-gray-400">Create your first company to get started</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Company"
        message={`Are you sure you want to delete company "${companyToDelete?.name}"? This will also delete all associated admins, products, and orders. This action cannot be undone.`}
        confirmText="DELETE COMPANY"
        cancelText="Cancel"
        onConfirm={() => companyToDelete && deleteCompany(companyToDelete.id)}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setCompanyToDelete(null);
        }}
        icon="fas fa-building"
        iconColor="text-red-500"
      />
    </div>
  );
};

export default CompanyManagement;