// Admin Panel JavaScript
const API_BASE_URL = 'https://mery-rose-backend.onrender.com'; // Direct backend connection
let authToken = localStorage.getItem('admin-token');
let currentUser = null;
let currentThemeData = null;

// Test API connection on load
async function testAPIConnection() {
    try {
        console.log('Testing API connection to:', `${API_BASE_URL}/health`);
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        console.log('API Health Check:', data);
    } catch (error) {
        console.error('API connection test failed:', error);
    }
}

// Load and apply current theme
async function loadAndApplyCurrentTheme() {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/theme`);
        if (response.ok) {
            const data = await response.json();
            if (data.theme) {
                currentThemeData = data.theme;
                applyThemeToAdminPanel(data.theme);
                console.log('Admin panel theme loaded:', data.theme.primary);
            }
        }
    } catch (error) {
        console.error('Failed to load theme for admin panel:', error);
    }
}

// Apply theme colors to admin panel
function applyThemeToAdminPanel(theme) {
    const root = document.documentElement;
    
    // Update CSS custom properties
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-primary-hover', theme.primaryHover);
    root.style.setProperty('--color-primary-light', theme.primaryLight);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-background', theme.background);
    root.style.setProperty('--color-text', theme.text);
    root.style.setProperty('--color-text-light', theme.textLight);
    root.style.setProperty('--color-success', theme.success);
    root.style.setProperty('--color-error', theme.error);
    root.style.setProperty('--color-warning', theme.warning);
    root.style.setProperty('--color-info', theme.info);
    
    console.log('Theme applied to admin panel:', theme.primary);
}

// Initialize the admin panel
document.addEventListener('DOMContentLoaded', function() {
    testAPIConnection();
    loadAndApplyCurrentTheme(); // Load theme first
    if (authToken) {
        checkAuthAndShowDashboard();
    } else {
        showLoginSection();
    }
});

// Show login section
function showLoginSection() {
    document.getElementById('login-section').classList.remove('hidden');
    // Hide the sidebar when showing login
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    sidebar.style.display = 'none';
    sidebar.classList.remove('open'); // Remove 'open' class for mobile
    if (backdrop) {
        backdrop.classList.remove('show');
    }
    hideAllSections();
}

// Hide all main sections
function hideAllSections() {
    const sections = ['dashboard-section', 'users-section', 'add-product-section', 'products-section', 'orders-section', 'transactions-section', 'theme-section'];
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            element.classList.add('hidden');
        }
    });
}

// Login function
async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    console.log('Attempting login with:', { email, password });
    console.log('API URL:', `${API_BASE_URL}/auth/login`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok && data.user.role === 'ADMIN') {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('admin-token', authToken);
            localStorage.setItem('admin-user', JSON.stringify(currentUser));
            
            // Hide login section and show sidebar
            console.log('Login successful, hiding login section and showing sidebar');
            document.getElementById('login-section').classList.add('hidden');
            
            // Show sidebar for both desktop and mobile
            const sidebar = document.getElementById('sidebar');
            sidebar.style.display = 'block';
            sidebar.classList.add('open'); // Add 'open' class for mobile
            
            console.log('Sidebar display set to block and open class added');
            document.getElementById('adminName').textContent = `Welcome, ${currentUser.name || currentUser.email}`;
            showSection('dashboard');
            console.log('Dashboard section should now be visible');
            loadDashboardData();
        } else {
            console.error('Login failed:', data);
            alert('Invalid credentials or insufficient permissions');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please check if the backend is running on http://localhost:5001');
    }
}

// Check authentication and show dashboard
async function checkAuthAndShowDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.user.role === 'ADMIN') {
                currentUser = data.user;
                // Hide login section and show sidebar
                document.getElementById('login-section').classList.add('hidden');
                
                // Show sidebar for both desktop and mobile
                const sidebar = document.getElementById('sidebar');
                sidebar.style.display = 'block';
                sidebar.classList.add('open'); // Add 'open' class for mobile
                
                document.getElementById('adminName').textContent = `Welcome, ${currentUser.name || currentUser.email}`;
                showSection('dashboard');
                loadDashboardData();
            } else {
                logout();
            }
        } else {
            logout();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        logout();
    }
}

// Logout function
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('admin-token');
    localStorage.removeItem('admin-user');
    showLoginSection();
}

// Show specific section
function showSection(sectionName) {
    console.log('Showing section:', sectionName);
    hideAllSections();
    const sectionElement = document.getElementById(`${sectionName}-section`);
    if (sectionElement) {
        sectionElement.classList.remove('hidden');
        console.log('Section element found and shown:', sectionName);
    } else {
        console.error('Section element not found:', `${sectionName}-section`);
    }
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('bg-teal-50', 'text-teal-600');
    });
    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeLink) {
        activeLink.classList.add('bg-teal-50', 'text-teal-600');
    }
    
    // Load section-specific data
    switch(sectionName) {
        case 'users':
            loadUsers();
            break;
        case 'products':
            loadProducts();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'transactions':
            loadTransactions();
            break;
        case 'theme':
            initializeThemeSettings();
            break;
        case 'dashboard':
            loadDashboardData();
            break;
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Update stats
            document.getElementById('total-users').textContent = data.stats.totalUsers;
            document.getElementById('total-products').textContent = data.stats.totalProducts;
            document.getElementById('total-orders').textContent = data.stats.totalOrders;
            document.getElementById('total-revenue').textContent = `${data.stats.totalRevenue.toFixed(2)}`;
            
            // Create charts
            createSalesChart(data.charts.dailySales);
            createCategoriesChart(data.charts.topCategories);
        }
    } catch (error) {
        console.error('Dashboard data error:', error);
    }
}

// Create sales chart
function createSalesChart(salesData) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: salesData.map(item => item.date),
            datasets: [{
                label: 'Revenue',
                data: salesData.map(item => item.revenue || 0),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }, {
                label: 'Orders',
                data: salesData.map(item => item.orders || 0),
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Create categories chart
function createCategoriesChart(categoriesData) {
    const ctx = document.getElementById('categoriesChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categoriesData.map(item => item.category),
            datasets: [{
                data: categoriesData.map(item => item.sales || 0),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ]
            }]
        },
        options: {
            responsive: true
        }
    });
}

// Load users
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayUsers(data.users);
        }
    } catch (error) {
        console.error('Users load error:', error);
    }
}

// Display users in table
function displayUsers(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-all duration-200';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-r from-teal-400 to-teal-600 flex items-center justify-center shadow-lg">
                        <i class="fas fa-user text-white"></i>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-semibold text-gray-900">${user.name || 'No name'}</div>
                        <div class="text-xs text-gray-500">ID: ${user.id}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 font-medium">${user.email}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="modern-badge ${user.role === 'ADMIN' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'}">
                    ${user.role}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center mr-2">
                        <span class="text-white text-xs font-bold">${user.order_count || 0}</span>
                    </div>
                    <span class="text-sm text-gray-900">${user.order_count || 0} orders</span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-semibold text-gray-900">${(user.total_spent || 0).toFixed(2)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Date(user.created_at).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center space-x-2">
                    <button onclick="viewUserDetails(${user.id})" class="action-btn action-btn-view" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editUser(${user.id})" class="action-btn action-btn-edit" title="Edit User">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${user.role !== 'ADMIN' ? `<button onclick="deleteUser(${user.id}, '${user.email}')" class="action-btn action-btn-delete" title="Delete User">
                        <i class="fas fa-trash"></i>
                    </button>` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// View user details
function viewUserDetails(userId) {
    window.location.href = `user-details.html?id=${userId}`;
}

// Edit user (placeholder)
function editUser(userId) {
    alert(`Edit user ${userId} - Feature coming soon!`);
}

// Delete user
async function deleteUser(userId, userEmail) {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            alert(result.message);
            loadUsers(); // Refresh the users list
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to delete user');
        }
    } catch (error) {
        console.error('Delete user error:', error);
        alert('Failed to delete user');
    }
}

// Load products
async function loadProducts() {
    try {
        console.log('Loading products...');
        const response = await fetch(`${API_BASE_URL}/products?limit=100`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Products loaded:', data);
            displayProducts(data.products || data);
        } else {
            console.error('Failed to load products:', response.status);
            // Show empty state
            displayProducts([]);
        }
    } catch (error) {
        console.error('Products load error:', error);
        // Show empty state
        displayProducts([]);
    }
}

// Display products
function displayProducts(products) {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) {
        console.error('Products table body not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (!products || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    <div class="flex flex-col items-center">
                        <i class="fas fa-box-open text-4xl mb-4 text-gray-300"></i>
                        <p class="text-lg font-medium">No products found</p>
                        <p class="text-sm">Add some products to get started</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    products.forEach(product => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-all duration-200';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="h-12 w-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        ${product.images && product.images.length > 0 ? 
                            `<img src="${product.images[0]}" alt="${product.name}" class="w-full h-full object-cover">` :
                            '<div class="w-full h-full flex items-center justify-center"><i class="fas fa-image text-gray-400"></i></div>'
                        }
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-semibold text-gray-900">${product.name || 'Unnamed Product'}</div>
                        <div class="text-xs text-gray-500">ID: ${product.id}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.brand || 'No Brand'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${(product.price || 0).toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.category || 'Uncategorized'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded-full ${product.in_stock !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${product.in_stock !== false ? 'In Stock' : 'Sold Out'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center space-x-2">
                    <button onclick="editProduct(${product.id})" class="action-btn action-btn-edit" title="Edit Product">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProduct(${product.id})" class="action-btn action-btn-delete" title="Delete Product">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log(`Displayed ${products.length} products`);
}

// Add product function
async function addProduct(event) {
    event.preventDefault();
    
    const productData = {
        name: document.getElementById('product-name').value,
        brand: document.getElementById('product-brand').value,
        price: parseFloat(document.getElementById('product-price').value),
        original_price: document.getElementById('product-original-price').value ? parseFloat(document.getElementById('product-original-price').value) : null,
        category: document.getElementById('product-category').value,
        size: document.getElementById('product-size').value,
        condition: document.getElementById('product-condition').value,
        color: document.getElementById('product-color').value,
        description: document.getElementById('product-description').value,
        material: document.getElementById('product-material').value,
        seller_name: document.getElementById('product-seller').value,
        images: document.getElementById('product-images').value.split('\n').filter(url => url.trim()),
        tags: [],
        care_instructions: []
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(productData)
        });
        
        if (response.ok) {
            alert('Product added successfully!');
            clearForm();
            loadDashboardData(); // Refresh stats
            // If we're on the products section, refresh it
            if (!document.getElementById('products-section').classList.contains('hidden')) {
                loadProducts();
            }
        } else {
            const error = await response.json();
            alert(`Error: ${error.error}`);
        }
    } catch (error) {
        console.error('Add product error:', error);
        alert('Failed to add product');
    }
}

// Clear form
function clearForm() {
    const form = document.querySelector('#add-product-section form');
    if (form) {
        form.reset();
    }
}

// Edit product (placeholder)
function editProduct(productId) {
    alert(`Edit product ${productId} - Feature coming soon!`);
}

// Delete product
async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                alert('Product deleted successfully!');
                loadProducts(); // Refresh products list
                loadDashboardData(); // Refresh stats
            } else {
                const error = await response.json();
                alert(`Failed to delete product: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Delete product error:', error);
            alert('Failed to delete product');
        }
    }
}

// Load orders
async function loadOrders() {
    try {
        console.log('Loading orders...');
        const response = await fetch(`${API_BASE_URL}/admin/orders`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Orders loaded:', data);
            displayOrders(data.orders || data);
        } else {
            console.error('Failed to load orders:', response.status);
            // Show empty state
            displayOrders([]);
        }
    } catch (error) {
        console.error('Orders load error:', error);
        // Show empty state
        displayOrders([]);
    }
}

// Display orders
function displayOrders(orders) {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) {
        console.error('Orders table body not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                    <div class="flex flex-col items-center">
                        <i class="fas fa-shopping-cart text-4xl mb-4 text-gray-300"></i>
                        <p class="text-lg font-medium">No orders found</p>
                        <p class="text-sm">Orders will appear here when customers make purchases</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-all duration-200';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#${order.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${order.user ? (order.user.name || order.user.email) : 'Unknown Customer'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.item_count || 0} items</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${(order.total || 0).toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded-full ${getOrderStatusColor(order.status || 'PENDING')}">${order.status || 'PENDING'}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <select onchange="updateOrderStatus(${order.id}, this.value)" class="text-sm border rounded px-2 py-1">
                    <option value="PENDING" ${(order.status || 'PENDING') === 'PENDING' ? 'selected' : ''}>Pending</option>
                    <option value="CONFIRMED" ${order.status === 'CONFIRMED' ? 'selected' : ''}>Confirmed</option>
                    <option value="PROCESSING" ${order.status === 'PROCESSING' ? 'selected' : ''}>Processing</option>
                    <option value="SHIPPED" ${order.status === 'SHIPPED' ? 'selected' : ''}>Shipped</option>
                    <option value="DELIVERED" ${order.status === 'DELIVERED' ? 'selected' : ''}>Delivered</option>
                    <option value="CANCELLED" ${order.status === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log(`Displayed ${orders.length} orders`);
}

// Get status color class for orders
function getOrderStatusColor(status) {
    switch(status) {
        case 'DELIVERED': return 'bg-green-100 text-green-800';
        case 'SHIPPED': return 'bg-blue-100 text-blue-800';
        case 'PROCESSING': return 'bg-purple-100 text-purple-800';
        case 'CONFIRMED': return 'bg-indigo-100 text-indigo-800';
        case 'PENDING': return 'bg-yellow-100 text-yellow-800';
        case 'CANCELLED': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            alert('Order status updated successfully!');
            loadOrders(); // Refresh orders
        } else {
            const error = await response.json();
            alert(`Failed to update order status: ${error.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Update order status error:', error);
        alert('Failed to update order status');
    }
}

// Load transactions
async function loadTransactions() {
    try {
        console.log('Loading transactions...');
        const response = await fetch(`${API_BASE_URL}/admin/transactions`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Transactions loaded:', data);
            displayTransactions(data.transactions || data);
        } else {
            console.error('Failed to load transactions:', response.status);
            // Show empty state
            displayTransactions([]);
        }
    } catch (error) {
        console.error('Transactions load error:', error);
        // Show empty state
        displayTransactions([]);
    }
}

// Display transactions
function displayTransactions(transactions) {
    const tbody = document.getElementById('transactions-table-body');
    if (!tbody) {
        console.error('Transactions table body not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                    <div class="flex flex-col items-center">
                        <i class="fas fa-credit-card text-4xl mb-4 text-gray-300"></i>
                        <p class="text-lg font-medium">No transactions found</p>
                        <p class="text-sm">Transaction history will appear here</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-all duration-200';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#${transaction.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${transaction.user_name || transaction.email || 'Unknown User'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.type || 'payment')}">
                    ${(transaction.type || 'payment').toUpperCase()}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                $${(transaction.amount || 0).toFixed(2)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${getTransactionStatusColor(transaction.status || 'pending')}">
                    ${(transaction.status || 'pending').toUpperCase()}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : 'Unknown'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="viewTransactionDetails(${transaction.id})" class="text-teal-600 hover:text-teal-900 mr-3">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log(`Displayed ${transactions.length} transactions`);
}

// Get color class for transaction type
function getTransactionTypeColor(type) {
    const colors = {
        'purchase': 'bg-green-100 text-green-800',
        'refund': 'bg-red-100 text-red-800',
        'payment': 'bg-blue-100 text-blue-800',
        'commission': 'bg-purple-100 text-purple-800'
    };
    return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

// Get color class for transaction status
function getTransactionStatusColor(status) {
    const colors = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'completed': 'bg-green-100 text-green-800',
        'failed': 'bg-red-100 text-red-800',
        'cancelled': 'bg-gray-100 text-gray-800',
        'refunded': 'bg-orange-100 text-orange-800'
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

// View transaction details (placeholder)
function viewTransactionDetails(transactionId) {
    alert(`View transaction ${transactionId} details - Feature coming soon!`);
}

// Initialize theme settings
function initializeThemeSettings() {
    console.log('Initializing theme settings...');
    // Theme settings functionality would go here
    // For now, just show a message
    const themeSection = document.getElementById('theme-section');
    if (themeSection && !themeSection.classList.contains('hidden')) {
        console.log('Theme settings section is now visible');
    }
}

// Refresh functions
function refreshUsers() {
    console.log('Refreshing users...');
    loadUsers();
}

function refreshProducts() {
    console.log('Refreshing products...');
    loadProducts();
}

function refreshOrders() {
    console.log('Refreshing orders...');
    loadOrders();
}

function refreshTransactions() {
    console.log('Refreshing transactions...');
    loadTransactions();
}

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', function() {
            console.log('Mobile menu button clicked');
            sidebar.classList.toggle('open');
            if (backdrop) {
                backdrop.classList.toggle('show');
            }
            console.log('Sidebar open class toggled:', sidebar.classList.contains('open'));
        });
        
        // Close sidebar when clicking backdrop
        if (backdrop) {
            backdrop.addEventListener('click', function() {
                sidebar.classList.remove('open');
                backdrop.classList.remove('show');
            });
        }
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(event) {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
                    sidebar.classList.remove('open');
                    if (backdrop) {
                        backdrop.classList.remove('show');
                    }
                }
            }
        });
    }
});