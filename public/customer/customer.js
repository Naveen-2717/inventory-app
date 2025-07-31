// Customer Portal JavaScript

let currentUser = null;
let currentSection = 'home';
let cart = [];
let currentPage = 1;
let checkoutStep = 1;
let portalSettings = null;

// Initialize customer portal
document.addEventListener('DOMContentLoaded', async function() {
  // Load portal settings first
  await loadPortalSettings();
  
  // Check if user is authenticated
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const user = await api.getCurrentUser();
      if (user && user.user.role === 'customer') {
        currentUser = user.user;
        showCustomerPortal();
        showSection('products');
      } else {
        showGuestView();
      }
    } catch (error) {
      showGuestView();
    }
  } else {
    showGuestView();
  }

  // Setup event listeners
  setupEventListeners();
  
  // Load cart from localStorage
  loadCartFromStorage();
});

// Load portal settings and apply branding
async function loadPortalSettings() {
  try {
    const response = await api.get('/api/products/settings/portal');
    portalSettings = response;
    
    // Apply branding
    if (portalSettings.branding) {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', portalSettings.branding.primaryColor);
      root.style.setProperty('--secondary-color', portalSettings.branding.secondaryColor);
      
      if (portalSettings.branding.fontFamily) {
        document.body.style.fontFamily = portalSettings.branding.fontFamily;
      }
      
      if (portalSettings.branding.logo) {
        document.getElementById('brand-logo').innerHTML = 
          `<img src="${portalSettings.branding.logo}" alt="Logo" style="height: 40px;">`;
      }
    }
    
    // Apply custom content
    if (portalSettings.dashboard && portalSettings.dashboard.customHtml) {
      document.getElementById('hero-content').innerHTML = portalSettings.dashboard.customHtml;
    }
  } catch (error) {
    console.error('Failed to load portal settings:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Authentication forms
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
  
  // Profile forms
  document.getElementById('profile-form').addEventListener('submit', handleProfileUpdate);
  document.getElementById('password-form').addEventListener('submit', handlePasswordChange);
  
  // Search and filter with debounce
  document.getElementById('product-search').addEventListener('input', 
    utils.debounce(() => loadProducts(), 500));
  document.getElementById('product-category').addEventListener('change', () => loadProducts());
  document.getElementById('product-sort').addEventListener('change', () => loadProducts());
}

// Show/hide sections based on authentication
function showGuestView() {
  document.getElementById('nav-login').style.display = 'block';
  document.getElementById('nav-logout').style.display = 'none';
  document.getElementById('nav-products').style.display = 'none';
  document.getElementById('nav-orders').style.display = 'none';
  document.getElementById('nav-profile').style.display = 'none';
  document.getElementById('nav-cart').style.display = 'none';
  
  showSection('home');
}

function showCustomerPortal() {
  document.getElementById('nav-login').style.display = 'none';
  document.getElementById('nav-logout').style.display = 'block';
  document.getElementById('nav-products').style.display = 'block';
  document.getElementById('nav-orders').style.display = 'block';
  document.getElementById('nav-profile').style.display = 'block';
  document.getElementById('nav-cart').style.display = 'block';
  
  updateCartBadge();
}

function showSection(section) {
  // Hide all sections
  document.getElementById('hero-section').style.display = 'none';
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('products-section').style.display = 'none';
  document.getElementById('orders-section').style.display = 'none';
  document.getElementById('profile-section').style.display = 'none';
  document.getElementById('checkout-section').style.display = 'none';

  // Show selected section
  currentSection = section;
  
  switch (section) {
    case 'home':
      document.getElementById('hero-section').style.display = 'block';
      break;
    case 'auth':
      document.getElementById('auth-section').style.display = 'block';
      break;
    case 'products':
      document.getElementById('products-section').style.display = 'block';
      loadProducts();
      loadCategories();
      break;
    case 'orders':
      if (!currentUser) {
        showSection('auth');
        return;
      }
      document.getElementById('orders-section').style.display = 'block';
      loadOrders();
      break;
    case 'profile':
      if (!currentUser) {
        showSection('auth');
        return;
      }
      document.getElementById('profile-section').style.display = 'block';
      loadProfile();
      break;
    case 'checkout':
      if (!currentUser) {
        showSection('auth');
        return;
      }
      document.getElementById('checkout-section').style.display = 'block';
      initializeCheckout();
      break;
  }
}

// Authentication functionality
function showAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.style.display = 'none');
  
  document.querySelector(`[onclick="showAuthTab('${tab}')"]`).classList.add('active');
  document.getElementById(`${tab}-tab`).style.display = 'block';
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await api.login(email, password, false);
    if (response && response.user) {
      currentUser = response.user;
      showCustomerPortal();
      showSection('products');
      utils.showAlert('Welcome back!', 'success');
    }
  } catch (error) {
    utils.showAlert(error.message || 'Login failed', 'danger');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  
  const userData = {
    firstName: document.getElementById('register-firstname').value,
    lastName: document.getElementById('register-lastname').value,
    email: document.getElementById('register-email').value,
    password: document.getElementById('register-password').value
  };

  try {
    const response = await api.register(userData);
    if (response && response.user) {
      currentUser = response.user;
      showCustomerPortal();
      showSection('products');
      utils.showAlert('Registration successful! Welcome to TechStore!', 'success');
    }
  } catch (error) {
    utils.showAlert(error.message || 'Registration failed', 'danger');
  }
}

// Product functionality
async function loadProducts(page = 1) {
  try {
    const search = document.getElementById('product-search').value;
    const category = document.getElementById('product-category').value;
    const sort = document.getElementById('product-sort').value;
    const [sortBy, sortOrder] = sort.split('-');
    
    const params = new URLSearchParams({
      page,
      search,
      category,
      sortBy,
      sortOrder,
      limit: 12
    });

    const response = await api.get(`/api/products?${params}`);
    
    displayProducts(response.products);
    displayPagination(response.pagination);
    currentPage = page;
  } catch (error) {
    utils.showAlert('Failed to load products', 'danger');
  }
}

async function loadCategories() {
  try {
    const categories = await api.get('/api/products/categories/list');
    const select = document.getElementById('product-category');
    
    // Clear existing options except "All Categories"
    select.innerHTML = '<option value="">All Categories</option>';
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
}

function displayProducts(products) {
  const grid = document.getElementById('products-grid');
  
  if (products.length === 0) {
    grid.innerHTML = '<div class="col-12 text-center text-muted">No products found</div>';
    return;
  }

  const html = products.map(product => {
    const stockClass = product.stockQuantity > 10 ? 'stock-available' : 
                      product.stockQuantity > 0 ? 'stock-low' : 'stock-out';
    const stockText = product.stockQuantity > 0 ? 
                     `In Stock (${product.stockQuantity})` : 'Out of Stock';
    
    return `
      <div class="product-card">
        <div class="product-image" onclick="showProductDetail('${product._id}')">
          ${product.image ? 
            `<img src="${product.image}" alt="${product.name}">` : 
            '📦'
          }
        </div>
        <div class="product-info">
          <div class="product-name">${product.name}</div>
          <div class="product-description">
            ${utils.truncateText(product.description || '', 100)}
          </div>
          <div class="product-price">${utils.formatCurrency(product.price)}</div>
          <div class="product-stock ${stockClass}">${stockText}</div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary btn-sm" onclick="showProductDetail('${product._id}')">
              View Details
            </button>
            ${product.stockQuantity > 0 ? 
              `<button class="btn btn-primary btn-sm" onclick="addToCart('${product._id}')">
                Add to Cart
              </button>` :
              `<button class="btn btn-secondary btn-sm" disabled>Out of Stock</button>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');

  grid.innerHTML = html;
}

function displayPagination(pagination) {
  const container = document.getElementById('products-pagination');
  const html = utils.generatePagination(
    pagination.current, 
    pagination.pages, 
    'loadProducts'
  );
  container.innerHTML = html;
}

async function showProductDetail(productId) {
  try {
    const product = await api.get(`/api/products/${productId}`);
    
    const stockClass = product.stockQuantity > 10 ? 'stock-available' : 
                      product.stockQuantity > 0 ? 'stock-low' : 'stock-out';
    const stockText = product.stockQuantity > 0 ? 
                     `In Stock (${product.stockQuantity})` : 'Out of Stock';
    
    const modalBody = document.getElementById('product-details');
    modalBody.innerHTML = `
      <div class="row">
        <div class="col-6">
          <div class="product-image" style="height: 300px; border-radius: 0.5rem;">
            ${product.image ? 
              `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 0.5rem;">` : 
              '<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 4rem; background-color: #f8f9fa; border-radius: 0.5rem;">📦</div>'
            }
          </div>
        </div>
        <div class="col-6">
          <h4>${product.name}</h4>
          <p class="text-muted">${product.description || 'No description available'}</p>
          <div class="product-price mb-3">${utils.formatCurrency(product.price)}</div>
          <div class="product-stock ${stockClass} mb-3">${stockText}</div>
          ${product.category ? `<p><strong>Category:</strong> ${product.category}</p>` : ''}
          
          ${product.stockQuantity > 0 ? `
            <div class="d-flex align-items-center gap-3 mb-3">
              <label>Quantity:</label>
              <div class="quantity-control">
                <button onclick="changeQuantity(-1)">-</button>
                <input type="number" id="product-quantity" value="1" min="1" max="${product.stockQuantity}">
                <button onclick="changeQuantity(1)">+</button>
              </div>
            </div>
            <button class="btn btn-primary btn-lg w-100" onclick="addToCartWithQuantity('${product._id}')">
              Add to Cart
            </button>
          ` : `
            <button class="btn btn-secondary btn-lg w-100" disabled>Out of Stock</button>
          `}
        </div>
      </div>
    `;
    
    document.getElementById('product-modal').classList.add('show');
  } catch (error) {
    utils.showAlert('Failed to load product details', 'danger');
  }
}

function changeQuantity(delta) {
  const input = document.getElementById('product-quantity');
  const newValue = parseInt(input.value) + delta;
  const max = parseInt(input.max);
  
  if (newValue >= 1 && newValue <= max) {
    input.value = newValue;
  }
}

// Cart functionality
function loadCartFromStorage() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCartDisplay();
  }
}

function saveCartToStorage() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

async function addToCart(productId) {
  try {
    const product = await api.get(`/api/products/${productId}`);
    
    if (product.stockQuantity <= 0) {
      utils.showAlert('Product is out of stock', 'warning');
      return;
    }
    
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
      if (existingItem.quantity < product.stockQuantity) {
        existingItem.quantity += 1;
        utils.showAlert('Added to cart!', 'success');
      } else {
        utils.showAlert('Cannot add more items than available stock', 'warning');
        return;
      }
    } else {
      cart.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        maxQuantity: product.stockQuantity
      });
      utils.showAlert('Added to cart!', 'success');
    }
    
    saveCartToStorage();
    updateCartDisplay();
  } catch (error) {
    utils.showAlert('Failed to add product to cart', 'danger');
  }
}

async function addToCartWithQuantity(productId) {
  const quantity = parseInt(document.getElementById('product-quantity').value);
  
  try {
    const product = await api.get(`/api/products/${productId}`);
    
    if (product.stockQuantity < quantity) {
      utils.showAlert('Not enough stock available', 'warning');
      return;
    }
    
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity <= product.stockQuantity) {
        existingItem.quantity = newQuantity;
        utils.showAlert(`Added ${quantity} items to cart!`, 'success');
      } else {
        utils.showAlert('Cannot add more items than available stock', 'warning');
        return;
      }
    } else {
      cart.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity,
        maxQuantity: product.stockQuantity
      });
      utils.showAlert(`Added ${quantity} items to cart!`, 'success');
    }
    
    saveCartToStorage();
    updateCartDisplay();
    closeModal('product-modal');
  } catch (error) {
    utils.showAlert('Failed to add product to cart', 'danger');
  }
}

function updateCartQuantity(productId, newQuantity) {
  const item = cart.find(item => item.productId === productId);
  if (item) {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else if (newQuantity <= item.maxQuantity) {
      item.quantity = newQuantity;
      saveCartToStorage();
      updateCartDisplay();
    } else {
      utils.showAlert('Cannot add more items than available stock', 'warning');
    }
  }
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.productId !== productId);
  saveCartToStorage();
  updateCartDisplay();
}

function updateCartDisplay() {
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="text-muted text-center">Your cart is empty</p>';
    cartTotal.textContent = '$0.00';
    checkoutBtn.disabled = true;
    updateCartBadge();
    return;
  }
  
  let total = 0;
  const html = cart.map(item => {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    
    return `
      <div class="cart-item">
        <div class="cart-item-image">
          ${item.image ? 
            `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 0.375rem;">` : 
            '📦'
          }
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${utils.formatCurrency(item.price)}</div>
          <div class="cart-item-controls">
            <div class="quantity-control">
              <button onclick="updateCartQuantity('${item.productId}', ${item.quantity - 1})">-</button>
              <input type="number" value="${item.quantity}" min="1" max="${item.maxQuantity}" 
                     onchange="updateCartQuantity('${item.productId}', parseInt(this.value))">
              <button onclick="updateCartQuantity('${item.productId}', ${item.quantity + 1})">+</button>
            </div>
            <button class="btn btn-sm btn-danger" onclick="removeFromCart('${item.productId}')">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  cartItems.innerHTML = html;
  cartTotal.textContent = utils.formatCurrency(total);
  checkoutBtn.disabled = false;
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  if (totalItems > 0) {
    badge.textContent = totalItems;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function toggleCart() {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  
  if (sidebar.classList.contains('show')) {
    sidebar.classList.remove('show');
    overlay.classList.remove('show');
  } else {
    sidebar.classList.add('show');
    overlay.classList.add('show');
  }
}

// Checkout functionality
function startCheckout() {
  if (!currentUser) {
    showSection('auth');
    utils.showAlert('Please login to continue checkout', 'info');
    return;
  }
  
  if (cart.length === 0) {
    utils.showAlert('Your cart is empty', 'warning');
    return;
  }
  
  toggleCart();
  showSection('checkout');
}

function initializeCheckout() {
  checkoutStep = 1;
  updateCheckoutSteps();
  loadCheckoutItems();
  loadCheckoutSummary();
}

function updateCheckoutSteps() {
  for (let i = 1; i <= 3; i++) {
    const step = document.getElementById(`step-${i}`);
    const stepDiv = document.getElementById(`checkout-step-${i}`);
    
    if (i < checkoutStep) {
      step.classList.add('completed');
      step.classList.remove('active');
      stepDiv.style.display = 'none';
    } else if (i === checkoutStep) {
      step.classList.add('active');
      step.classList.remove('completed');
      stepDiv.style.display = 'block';
    } else {
      step.classList.remove('active', 'completed');
      stepDiv.style.display = 'none';
    }
  }
}

function loadCheckoutItems() {
  const container = document.getElementById('checkout-items');
  const html = cart.map(item => `
    <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
      <div class="d-flex align-items-center">
        <div class="cart-item-image me-3">
          ${item.image ? 
            `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 0.375rem;">` : 
            '📦'
          }
        </div>
        <div>
          <div class="fw-bold">${item.name}</div>
          <div class="text-muted">Qty: ${item.quantity}</div>
        </div>
      </div>
      <div class="fw-bold">${utils.formatCurrency(item.price * item.quantity)}</div>
    </div>
  `).join('');
  
  container.innerHTML = html;
}

function loadCheckoutSummary() {
  const container = document.getElementById('checkout-summary');
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const html = `
    ${cart.map(item => `
      <div class="d-flex justify-content-between py-1">
        <span>${item.name} x${item.quantity}</span>
        <span>${utils.formatCurrency(item.price * item.quantity)}</span>
      </div>
    `).join('')}
    <hr>
    <div class="d-flex justify-content-between fw-bold">
      <span>Total</span>
      <span>${utils.formatCurrency(total)}</span>
    </div>
  `;
  
  container.innerHTML = html;
}

function nextCheckoutStep() {
  if (checkoutStep === 2) {
    // Validate shipping form
    const form = document.getElementById('shipping-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    // Load order confirmation
    loadOrderConfirmation();
  }
  
  checkoutStep++;
  updateCheckoutSteps();
}

function prevCheckoutStep() {
  checkoutStep--;
  updateCheckoutSteps();
}

function loadOrderConfirmation() {
  const container = document.getElementById('order-confirmation');
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const shippingAddress = {
    addressLine1: document.getElementById('address-line1').value,
    addressLine2: document.getElementById('address-line2').value,
    city: document.getElementById('city').value,
    state: document.getElementById('state').value,
    zipCode: document.getElementById('zipcode').value,
    country: document.getElementById('country').value,
    phone: document.getElementById('phone').value
  };
  
  const html = `
    <div class="row">
      <div class="col-6">
        <h6>Order Items</h6>
        ${cart.map(item => `
          <div class="d-flex justify-content-between py-1">
            <span>${item.name} x${item.quantity}</span>
            <span>${utils.formatCurrency(item.price * item.quantity)}</span>
          </div>
        `).join('')}
        <hr>
        <div class="d-flex justify-content-between fw-bold">
          <span>Total</span>
          <span>${utils.formatCurrency(total)}</span>
        </div>
      </div>
      <div class="col-6">
        <h6>Shipping Address</h6>
        <p>
          ${shippingAddress.addressLine1}<br>
          ${shippingAddress.addressLine2 ? shippingAddress.addressLine2 + '<br>' : ''}
          ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}<br>
          ${shippingAddress.country}
          ${shippingAddress.phone ? '<br>Phone: ' + shippingAddress.phone : ''}
        </p>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

async function placeOrder() {
  try {
    const shippingAddress = {
      addressLine1: document.getElementById('address-line1').value,
      addressLine2: document.getElementById('address-line2').value,
      city: document.getElementById('city').value,
      state: document.getElementById('state').value,
      zipCode: document.getElementById('zipcode').value,
      country: document.getElementById('country').value,
      phone: document.getElementById('phone').value
    };
    
    const orderData = {
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      shippingAddress
    };
    
    const response = await api.post('/api/customer/orders', orderData);
    
    // Clear cart
    cart = [];
    saveCartToStorage();
    updateCartDisplay();
    
    utils.showAlert('Order placed successfully!', 'success');
    showSection('orders');
  } catch (error) {
    utils.showAlert(error.message || 'Failed to place order', 'danger');
  }
}

// Orders functionality
async function loadOrders(page = 1) {
  try {
    const response = await api.get(`/api/customer/orders?page=${page}`);
    
    displayOrders(response.orders);
    displayOrdersPagination(response.pagination);
  } catch (error) {
    utils.showAlert('Failed to load orders', 'danger');
  }
}

function displayOrders(orders) {
  const container = document.getElementById('orders-list');
  
  if (orders.length === 0) {
    container.innerHTML = '<div class="text-center text-muted">No orders found</div>';
    return;
  }
  
  const html = orders.map(order => `
    <div class="card mb-3">
      <div class="card-header d-flex justify-content-between align-items-center">
        <div>
          <strong>Order ${order.orderId}</strong>
          <span class="text-muted ms-2">${utils.formatDate(order.createdAt)}</span>
        </div>
        <div>
          <span class="status-badge status-${order.status}">${utils.capitalize(order.status)}</span>
          <span class="ms-2 fw-bold">${utils.formatCurrency(order.totalAmount)}</span>
        </div>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-8">
            <h6>Items:</h6>
            ${order.items.map(item => `
              <div class="d-flex justify-content-between">
                <span>${item.productName} x${item.quantity}</span>
                <span>${utils.formatCurrency(item.subtotal)}</span>
              </div>
            `).join('')}
          </div>
          <div class="col-4 text-end">
            <button class="btn btn-primary btn-sm" onclick="viewOrderDetails('${order._id}')">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
  
  container.innerHTML = html;
}

function displayOrdersPagination(pagination) {
  const container = document.getElementById('orders-pagination');
  const html = utils.generatePagination(
    pagination.current, 
    pagination.pages, 
    'loadOrders'
  );
  container.innerHTML = html;
}

async function viewOrderDetails(orderId) {
  try {
    const order = await api.get(`/api/customer/orders/${orderId}`);
    
    const modalBody = document.getElementById('order-details');
    modalBody.innerHTML = `
      <div class="row">
        <div class="col-6">
          <h6>Order Information</h6>
          <p><strong>Order ID:</strong> ${order.orderId}</p>
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
          <p>
            ${order.shippingAddress.addressLine1}<br>
            ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
            ${order.shippingAddress.country}
            ${order.shippingAddress.phone ? '<br>Phone: ' + order.shippingAddress.phone : ''}
          </p>
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

// Profile functionality
function loadProfile() {
  if (!currentUser) return;
  
  document.getElementById('profile-firstname').value = currentUser.firstName;
  document.getElementById('profile-lastname').value = currentUser.lastName;
  document.getElementById('profile-email').value = currentUser.email;
  
  document.getElementById('account-name').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
  document.getElementById('account-email').textContent = currentUser.email;
  // Note: createdAt not available in current user object, would need separate API call
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  
  const profileData = {
    firstName: document.getElementById('profile-firstname').value,
    lastName: document.getElementById('profile-lastname').value
  };

  try {
    const response = await api.put('/api/customer/profile', profileData);
    currentUser = response.user;
    utils.showAlert('Profile updated successfully!', 'success');
  } catch (error) {
    utils.showAlert(error.message || 'Failed to update profile', 'danger');
  }
}

async function handlePasswordChange(e) {
  e.preventDefault();
  
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  if (newPassword !== confirmPassword) {
    utils.showAlert('New passwords do not match', 'danger');
    return;
  }
  
  const passwordData = {
    currentPassword: document.getElementById('current-password').value,
    newPassword: newPassword
  };

  try {
    await api.put('/api/customer/password', passwordData);
    utils.showAlert('Password changed successfully!', 'success');
    document.getElementById('password-form').reset();
  } catch (error) {
    utils.showAlert(error.message || 'Failed to change password', 'danger');
  }
}

// Utility functions
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

async function logout() {
  try {
    await api.logout();
    currentUser = null;
    cart = [];
    saveCartToStorage();
    showGuestView();
    utils.showAlert('Logged out successfully', 'info');
  } catch (error) {
    // Even if logout fails on server, clear local state
    localStorage.removeItem('token');
    currentUser = null;
    cart = [];
    saveCartToStorage();
    showGuestView();
  }
}