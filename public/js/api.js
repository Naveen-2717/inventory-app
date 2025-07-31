// API utility functions
class API {
  constructor() {
    this.baseURL = window.location.origin;
    this.token = localStorage.getItem('token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Make HTTP request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      // Handle authentication errors
      if (response.status === 401) {
        this.setToken(null);
        if (window.location.pathname.includes('/admin')) {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }
        return null;
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // PATCH request
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Upload file (multipart/form-data)
  async upload(endpoint, formData) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {};
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
      });

      if (response.status === 401) {
        this.setToken(null);
        if (window.location.pathname.includes('/admin')) {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }
        return null;
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(email, password, isAdmin = false) {
    const endpoint = isAdmin ? '/api/auth/admin/login' : '/api/auth/login';
    const response = await this.post(endpoint, { email, password });
    
    if (response && response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async register(userData) {
    const response = await this.post('/api/auth/register', userData);
    
    if (response && response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout() {
    await this.post('/api/auth/logout');
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.get('/api/auth/me');
  }

  async verifyToken() {
    return this.get('/api/auth/verify');
  }
}

// Utility functions
const utils = {
  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },

  // Format date
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Format date and time
  formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Show alert message
  showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
      ${message}
      <button type="button" class="close" onclick="this.parentElement.remove()">
        <span>&times;</span>
      </button>
    `;

    alertContainer.appendChild(alert);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (alert.parentElement) {
        alert.remove();
      }
    }, 5000);
  },

  // Show loading spinner
  showLoading(element) {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.id = 'loading-spinner';
    element.appendChild(spinner);
  },

  // Hide loading spinner
  hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
      spinner.remove();
    }
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Validate email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate password strength
  isValidPassword(password) {
    return password && password.length >= 6;
  },

  // Get query parameters
  getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  },

  // Update query parameters
  updateQueryParams(params) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        url.searchParams.set(key, params[key]);
      } else {
        url.searchParams.delete(key);
      }
    });
    window.history.replaceState({}, '', url);
  },

  // Truncate text
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  },

  // Capitalize first letter
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // Generate pagination HTML
  generatePagination(currentPage, totalPages, onPageChange) {
    if (totalPages <= 1) return '';

    let html = '<ul class="pagination">';
    
    // Previous button
    if (currentPage > 1) {
      html += `<li class="page-item">
        <a class="page-link" href="#" onclick="${onPageChange}(${currentPage - 1}); return false;">
          Previous
        </a>
      </li>`;
    } else {
      html += `<li class="page-item disabled">
        <span class="page-link">Previous</span>
      </li>`;
    }

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
      html += `<li class="page-item">
        <a class="page-link" href="#" onclick="${onPageChange}(1); return false;">1</a>
      </li>`;
      if (startPage > 2) {
        html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      if (i === currentPage) {
        html += `<li class="page-item active">
          <span class="page-link">${i}</span>
        </li>`;
      } else {
        html += `<li class="page-item">
          <a class="page-link" href="#" onclick="${onPageChange}(${i}); return false;">${i}</a>
        </li>`;
      }
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
      html += `<li class="page-item">
        <a class="page-link" href="#" onclick="${onPageChange}(${totalPages}); return false;">${totalPages}</a>
      </li>`;
    }

    // Next button
    if (currentPage < totalPages) {
      html += `<li class="page-item">
        <a class="page-link" href="#" onclick="${onPageChange}(${currentPage + 1}); return false;">
          Next
        </a>
      </li>`;
    } else {
      html += `<li class="page-item disabled">
        <span class="page-link">Next</span>
      </li>`;
    }

    html += '</ul>';
    return html;
  }
};

// Global API instance
const api = new API();