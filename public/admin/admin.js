// Admin Portal JavaScript

let currentSection = 'dashboard';
let currentUser = null;
let sidebarOpen = false;

// Pagination state
let currentPage = {
  products: 1,
  customers: 1,
  orders: 1
};

// Initialize admin portal
document.addEventListener('DOMContentLoaded', async function() {
  // Check if user is authenticated
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const user = await api.getCurrentUser();
      if (user && user.user.role === 'admin') {
        currentUser = user.user;
        showAdminPanel();
        loadDashboard();
      } else {
        showLogin();
      }
    } catch (error) {
      showLogin();
    }
  } else {
    showLogin();
  }

  // Setup event listeners
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // Login form
  document.getElementById('login-form').addEventListener('submit', handleLogin);

  // Search inputs with debounce
  document.getElementById('product-search').addEventListener('input', 
    utils.debounce(() => loadProducts(), 500));
  document.getElementById('customer-search').addEventListener('input', 
    utils.debounce(() => loadCustomers(), 500));

  // Sort/filter changes
  document.getElementById('product-sort').addEventListener('change', () => loadProducts());
  document.getElementById('customer-status').addEventListener('change', () => loadCustomers());
  document.getElementById('order-status').addEventListener('change', () => loadOrders());
  document.getElementById('order-start-date').addEventListener('change', () => loadOrders());
  document.getElementById('order-end-date').addEventListener('change', () => loadOrders());

  // Settings form
  document.getElementById('settings-form').addEventListener('submit', handleSettingsSubmit);

  // Color picker changes for preview
  document.getElementById('primary-color').addEventListener('change', updateSettingsPreview);
  document.getElementById('secondary-color').addEventListener('change', updateSettingsPreview);
  document.getElementById('font-family').addEventListener('change', updateSettingsPreview);
  document.getElementById('custom-html').addEventListener('input', updateSettingsPreview);
}

// Login functionality
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await api.login(email, password, true);
    if (response && response.user) {
      currentUser = response.user;
      showAdminPanel();
      loadDashboard();
      utils.showAlert('Login successful!', 'success');
    }
  } catch (error) {
    utils.showAlert(error.message || 'Login failed', 'danger');
  }
}

// Show/hide sections
function showLogin() {
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('dashboard-section').style.display = 'none';
  document.getElementById('products-section').style.display = 'none';
  document.getElementById('customers-section').style.display = 'none';
  document.getElementById('orders-section').style.display = 'none';
  document.getElementById('settings-section').style.display = 'none';
  
  // Hide sidebar and top bar
  document.getElementById('sidebar').classList.remove('show');
  document.querySelector('.top-bar').style.display = 'none';
}

function showAdminPanel() {
  document.getElementById('login-section').style.display = 'none';
  document.querySelector('.top-bar').style.display = 'flex';
  document.getElementById('admin-name').textContent = currentUser.firstName + ' ' + currentUser.lastName;
  
  showSection('dashboard');
}

function showSection(section) {
  // Hide all sections
  document.getElementById('dashboard-section').style.display = 'none';
  document.getElementById('products-section').style.display = 'none';
  document.getElementById('customers-section').style.display = 'none';
  document.getElementById('orders-section').style.display = 'none';
  document.getElementById('settings-section').style.display = 'none';

  // Update navigation
  document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
    link.classList.remove('active');
  });
  event.target.classList.add('active');

  // Show selected section
  document.getElementById(`${section}-section`).style.display = 'block';
  currentSection = section;

  // Load section data
  switch (section) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'products':
      loadProducts();
      break;
    case 'customers':
      loadCustomers();
      break;
    case 'orders':
      loadOrders();
      break;
    case 'settings':
      loadSettings();
      break;
  }

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    toggleSidebar();
  }
}

// Sidebar toggle
function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const mainContent = document.getElementById('main-content');

  if (sidebarOpen) {
    sidebar.classList.add('show');
    overlay.classList.add('show');
    if (window.innerWidth > 768) {
      mainContent.classList.add('shifted');
    }
  } else {
    sidebar.classList.remove('show');
    overlay.classList.remove('show');
    mainContent.classList.remove('shifted');
  }
}

// Dashboard functionality
async function loadDashboard() {
  try {
    const stats = await api.get('/api/admin/dashboard/stats');
    
    const statsHtml = `
      <div class="stat-card">
        <div class="stat-number">${stats.totalProducts}</div>
        <div class="stat-label">Total Products</div>
      </div>
      <div class="stat-card success">
        <div class="stat-number">${stats.totalCustomers}</div>
        <div class="stat-label">Total Customers</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-number">${stats.orders.pending}</div>
        <div class="stat-label">Pending Orders</div>
      </div>
      <div class="stat-card info">
        <div class="stat-number">${stats.orders.processing}</div>
        <div class="stat-label">Processing Orders</div>
      </div>
      <div class="stat-card success">
        <div class="stat-number">${stats.orders.shipped}</div>
        <div class="stat-label">Shipped Orders</div>
      </div>
    `;
    
    document.getElementById('stats-grid').innerHTML = statsHtml;
  } catch (error) {
    utils.showAlert('Failed to load dashboard stats', 'danger');
  }
}

// Products functionality
async function loadProducts(page = 1) {
  try {
    const search = document.getElementById('product-search').value;
    const sort = document.getElementById('product-sort').value;
    const [sortBy, sortOrder] = sort.split('-');
    
    const params = new URLSearchParams({
      page,
      search,
      sortBy,
      sortOrder
    });

    const response = await api.get(`/api/admin/products?${params}`);
    
    displayProducts(response.products);
    displayPagination('products', response.pagination);
    currentPage.products = page;
  } catch (error) {
    utils.showAlert('Failed to load products', 'danger');
  }
}

function displayProducts(products) {
  const grid = document.getElementById('products-grid');
  
  if (products.length === 0) {
    grid.innerHTML = '<div class="col-12 text-center text-muted">No products found</div>';
    return;
  }

  const html = products.map(product => `
    <div class="product-card">
      <div class="product-image">
        ${product.image ? 
          `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">` : 
          '📦 No Image'
        }
      </div>
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-price">${utils.formatCurrency(product.price)}</div>
        <div class="product-stock">Stock: ${product.stockQuantity}</div>
        <div class="product-actions">
          <button class="btn btn-sm btn-primary" onclick="editProduct('${product._id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product._id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join('');

  grid.innerHTML = html;
}

function displayPagination(type, pagination) {
  const container = document.getElementById(`${type}-pagination`);
  const html = utils.generatePagination(
    pagination.current, 
    pagination.pages, 
    `load${utils.capitalize(type)}`
  );
  container.innerHTML = html;
}

// Product modal functionality
function showProductModal(productId = null) {
  const modal = document.getElementById('product-modal');
  const title = document.getElementById('product-modal-title');
  
  if (productId) {
    title.textContent = 'Edit Product';
    loadProductForEdit(productId);
  } else {
    title.textContent = 'Add Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
  }
  
  modal.classList.add('show');
}

async function loadProductForEdit(productId) {
  try {
    const product = await api.get(`/api/admin/products/${productId}`);
    
    document.getElementById('product-id').value = product._id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-stock').value = product.stockQuantity;
    document.getElementById('product-category').value = product.category || '';
  } catch (error) {
    utils.showAlert('Failed to load product details', 'danger');
  }
}

async function saveProduct() {
  try {
    const productId = document.getElementById('product-id').value;
    const formData = new FormData();
    
    formData.append('name', document.getElementById('product-name').value);
    formData.append('description', document.getElementById('product-description').value);
    formData.append('price', document.getElementById('product-price').value);
    formData.append('stockQuantity', document.getElementById('product-stock').value);
    formData.append('category', document.getElementById('product-category').value);
    
    const imageFile = document.getElementById('product-image').files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    }

    let response;
    if (productId) {
      response = await api.upload(`/api/admin/products/${productId}`, formData);
    } else {
      response = await api.upload('/api/admin/products', formData);
    }

    closeModal('product-modal');
    loadProducts(currentPage.products);
    utils.showAlert(response.message, 'success');
  } catch (error) {
    utils.showAlert(error.message || 'Failed to save product', 'danger');
  }
}

async function editProduct(productId) {
  showProductModal(productId);
}

async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  try {
    const response = await api.delete(`/api/admin/products/${productId}`);
    loadProducts(currentPage.products);
    utils.showAlert(response.message, 'success');
  } catch (error) {
    utils.showAlert(error.message || 'Failed to delete product', 'danger');
  }
}

// Customers functionality
async function loadCustomers(page = 1) {
  try {
    const search = document.getElementById('customer-search').value;
    const status = document.getElementById('customer-status').value;
    
    const params = new URLSearchParams({
      page,
      search,
      status
    });

    const response = await api.get(`/api/admin/customers?${params}`);
    
    displayCustomers(response.customers);
    displayPagination('customers', response.pagination);
    currentPage.customers = page;
  } catch (error) {
    utils.showAlert('Failed to load customers', 'danger');
  }
}

function displayCustomers(customers) {
  const tbody = document.getElementById('customers-table');
  
  if (customers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No customers found</td></tr>';
    return;
  }

  const html = customers.map(customer => `
    <tr>
      <td>${customer.firstName} ${customer.lastName}</td>
      <td>${customer.email}</td>
      <td>
        <span class="status-badge ${customer.isBlocked ? 'status-cancelled' : 'status-delivered'}">
          ${customer.isBlocked ? 'Blocked' : 'Active'}
        </span>
      </td>
      <td>${utils.formatDate(customer.createdAt)}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="viewCustomer('${customer._id}')">View</button>
        <button class="btn btn-sm ${customer.isBlocked ? 'btn-success' : 'btn-warning'}" 
                onclick="toggleCustomerStatus('${customer._id}', ${!customer.isBlocked})">
          ${customer.isBlocked ? 'Unblock' : 'Block'}
        </button>
        <button class="btn btn-sm btn-info" onclick="impersonateCustomer('${customer._id}')">Impersonate</button>
      </td>
    </tr>
  `).join('');

  tbody.innerHTML = html;
}

async function viewCustomer(customerId) {
  try {
    const response = await api.get(`/api/admin/customers/${customerId}`);
    const { customer, orders } = response;
    
    const modalBody = document.getElementById('customer-details');
    modalBody.innerHTML = `
      <div class="row">
        <div class="col-6">
          <h6>Customer Information</h6>
          <p><strong>Name:</strong> ${customer.firstName} ${customer.lastName}</p>
          <p><strong>Email:</strong> ${customer.email}</p>
          <p><strong>Status:</strong> 
            <span class="status-badge ${customer.isBlocked ? 'status-cancelled' : 'status-delivered'}">
              ${customer.isBlocked ? 'Blocked' : 'Active'}
            </span>
          </p>
          <p><strong>Joined:</strong> ${utils.formatDate(customer.createdAt)}</p>
        </div>
        <div class="col-6">
          <h6>Order History</h6>
          ${orders.length === 0 ? 
            '<p class="text-muted">No orders found</p>' :
            orders.slice(0, 5).map(order => `
              <div class="mb-2">
                <strong>${order.orderId}</strong> - ${utils.formatCurrency(order.totalAmount)}
                <br><small class="text-muted">${utils.formatDate(order.createdAt)}</small>
              </div>
            `).join('')
          }
          ${orders.length > 5 ? `<small class="text-muted">... and ${orders.length - 5} more orders</small>` : ''}
        </div>
      </div>
    `;
    
    document.getElementById('customer-modal').classList.add('show');
  } catch (error) {
    utils.showAlert('Failed to load customer details', 'danger');
  }
}

async function toggleCustomerStatus(customerId, isBlocked) {
  try {
    const response = await api.patch(`/api/admin/customers/${customerId}/block`, { isBlocked });
    loadCustomers(currentPage.customers);
    utils.showAlert(response.message, 'success');
  } catch (error) {
    utils.showAlert(error.message || 'Failed to update customer status', 'danger');
  }
}

function impersonateCustomer(customerId) {
  // This would typically set up impersonation session
  // For demo purposes, we'll show the banner
  document.getElementById('impersonated-user').textContent = 'Customer ID: ' + customerId;
  document.getElementById('impersonation-banner').classList.add('show');
  utils.showAlert('Impersonation started. You can now view the customer portal as this user.', 'info');
}

function exitImpersonation() {
  document.getElementById('impersonation-banner').classList.remove('show');
  utils.showAlert('Impersonation ended.', 'info');
}

// Orders functionality
async function loadOrders(page = 1) {
  try {
    const status = document.getElementById('order-status').value;
    const startDate = document.getElementById('order-start-date').value;
    const endDate = document.getElementById('order-end-date').value;
    
    const params = new URLSearchParams({
      page,
      status,
      startDate,
      endDate
    });

    const response = await api.get(`/api/admin/orders?${params}`);
    
    displayOrders(response.orders);
    displayPagination('orders', response.pagination);
    currentPage.orders = page;
  } catch (error) {
    utils.showAlert('Failed to load orders', 'danger');
  }
}

function displayOrders(orders) {
  const tbody = document.getElementById('orders-table');
  
  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No orders found</td></tr>';
    return;
  }

  const html = orders.map(order => `
    <tr>
      <td>${order.orderId}</td>
      <td>${order.customer.firstName} ${order.customer.lastName}</td>
      <td>
        <span class="status-badge status-${order.status}">
          ${utils.capitalize(order.status)}
        </span>
      </td>
      <td>${utils.formatCurrency(order.totalAmount)}</td>
      <td>${utils.formatDate(order.createdAt)}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="viewOrder('${order._id}')">View</button>
        <button class="btn btn-sm btn-warning" onclick="updateOrderStatus('${order._id}')">Update</button>
      </td>
    </tr>
  `).join('');

  tbody.innerHTML = html;
}

async function viewOrder(orderId) {
  try {
    const order = await api.get(`/api/admin/orders/${orderId}`);
    
    const modalBody = document.getElementById('order-details');
    modalBody.innerHTML = `
      <div class="row">
        <div class="col-6">
          <h6>Order Information</h6>
          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Customer:</strong> ${order.customer.firstName} ${order.customer.lastName}</p>
          <p><strong>Status:</strong> 
            <span class="status-badge status-${order.status}">
              ${utils.capitalize(order.status)}
            </span>
          </p>
          <p><strong>Total:</strong> ${utils.formatCurrency(order.totalAmount)}</p>
          <p><strong>Date:</strong> ${utils.formatDateTime(order.createdAt)}</p>
          ${order.trackingNumber ? `<p><strong>Tracking:</strong> ${order.trackingNumber}</p>` : ''}
        </div>
        <div class="col-6">
          <h6>Shipping Address</h6>
          <p>${order.shippingAddress.addressLine1}</p>
          ${order.shippingAddress.addressLine2 ? `<p>${order.shippingAddress.addressLine2}</p>` : ''}
          <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
          <p>${order.shippingAddress.country}</p>
          ${order.shippingAddress.phone ? `<p>Phone: ${order.shippingAddress.phone}</p>` : ''}
        </div>
      </div>
      <div class="mt-3">
        <h6>Order Items</h6>
        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>${utils.formatCurrency(item.price)}</td>
                  <td>${utils.formatCurrency(item.subtotal)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    document.getElementById('order-modal').classList.add('show');
  } catch (error) {
    utils.showAlert('Failed to load order details', 'danger');
  }
}

async function updateOrderStatus(orderId) {
  const newStatus = prompt('Enter new status (pending, processing, shipped, delivered, cancelled):');
  if (!newStatus) return;

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(newStatus.toLowerCase())) {
    utils.showAlert('Invalid status. Please use: ' + validStatuses.join(', '), 'danger');
    return;
  }

  let trackingNumber = '';
  if (newStatus.toLowerCase() === 'shipped') {
    trackingNumber = prompt('Enter tracking number (optional):') || '';
  }

  try {
    const response = await api.patch(`/api/admin/orders/${orderId}/status`, {
      status: newStatus.toLowerCase(),
      trackingNumber
    });
    
    loadOrders(currentPage.orders);
    utils.showAlert(response.message, 'success');
  } catch (error) {
    utils.showAlert(error.message || 'Failed to update order status', 'danger');
  }
}

// Settings functionality
async function loadSettings() {
  try {
    const settings = await api.get('/api/admin/settings');
    
    document.getElementById('primary-color').value = settings.branding.primaryColor;
    document.getElementById('secondary-color').value = settings.branding.secondaryColor;
    document.getElementById('font-family').value = settings.branding.fontFamily;
    document.getElementById('custom-html').value = settings.dashboard.customHtml;
    
    if (settings.branding.logo) {
      document.getElementById('logo-preview').innerHTML = 
        `<img src="${settings.branding.logo}" alt="Logo" style="max-width: 200px; max-height: 100px;">`;
    }
    
    updateSettingsPreview();
  } catch (error) {
    utils.showAlert('Failed to load settings', 'danger');
  }
}

async function handleSettingsSubmit(e) {
  e.preventDefault();
  
  try {
    const formData = new FormData();
    formData.append('primaryColor', document.getElementById('primary-color').value);
    formData.append('secondaryColor', document.getElementById('secondary-color').value);
    formData.append('fontFamily', document.getElementById('font-family').value);
    formData.append('customHtml', document.getElementById('custom-html').value);
    
    const logoFile = document.getElementById('logo-upload').files[0];
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    const response = await api.upload('/api/admin/settings', formData);
    
    utils.showAlert(response.message, 'success');
    loadSettings(); // Reload to show updated logo
  } catch (error) {
    utils.showAlert(error.message || 'Failed to save settings', 'danger');
  }
}

function updateSettingsPreview() {
  const primaryColor = document.getElementById('primary-color').value;
  const secondaryColor = document.getElementById('secondary-color').value;
  const fontFamily = document.getElementById('font-family').value;
  const customHtml = document.getElementById('custom-html').value;
  
  const preview = document.getElementById('preview-content');
  preview.style.fontFamily = fontFamily;
  preview.style.color = primaryColor;
  preview.innerHTML = customHtml || '<p>Enter custom HTML to see preview</p>';
}

// Modal functionality
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

// Logout functionality
async function logout() {
  try {
    await api.logout();
    currentUser = null;
    showLogin();
    utils.showAlert('Logged out successfully', 'info');
  } catch (error) {
    // Even if logout fails on server, clear local state
    localStorage.removeItem('token');
    currentUser = null;
    showLogin();
  }
}