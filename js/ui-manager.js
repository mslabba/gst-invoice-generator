// UI Manager - Handle UI interactions, tabs, and general interface management
class UIManager {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize UI Manager
  initialize() {
    if (this.isInitialized) return;

    this.setupTabFunctionality();
    this.setupMobileResponsiveness();
    this.setupGlobalUIHandlers();
    this.isInitialized = true;
  }

  // Setup tab functionality for all tabs in the application
  setupTabFunctionality() {
    // Profile tabs
    this.setupTabGroup('.profile-tabs .tab-btn', '#profile-section .tab-content');

    // Stock management tabs
    this.setupTabGroup('.stock-tabs .tab-btn', '#stock-management-section .tab-content');
  }

  // Setup a group of tabs
  setupTabGroup(tabSelector, contentSelector) {
    const tabButtons = document.querySelectorAll(tabSelector);
    const tabContents = document.querySelectorAll(contentSelector);

    tabButtons.forEach(button => {
      button.addEventListener('click', function () {
        const targetTab = this.getAttribute('data-tab');

        // Remove active class from all tabs and contents in this group
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to clicked tab and corresponding content
        this.classList.add('active');
        const targetContent = document.getElementById(targetTab);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  }

  // Setup mobile responsiveness features
  setupMobileResponsiveness() {
    // Handle mobile menu interactions
    this.setupMobileMenu();

    // Handle touch interactions for better mobile experience
    this.setupTouchInteractions();

    // Handle responsive table scrolling
    this.setupResponsiveTables();
  }

  // Setup mobile menu functionality
  setupMobileMenu() {
    // Add mobile menu toggle if needed
    const sidebar = document.querySelector('.sidebar');
    const menu = document.querySelector('.menu');

    if (sidebar && menu && window.innerWidth <= 768) {
      // Make menu horizontally scrollable on mobile
      menu.style.overflowX = 'auto';
      menu.style.whiteSpace = 'nowrap';
    }

    // Handle window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  // Handle window resize events
  handleResize() {
    const sidebar = document.querySelector('.sidebar');
    const menu = document.querySelector('.menu');

    if (sidebar && menu) {
      if (window.innerWidth <= 768) {
        menu.style.overflowX = 'auto';
        menu.style.whiteSpace = 'nowrap';
      } else {
        menu.style.overflowX = '';
        menu.style.whiteSpace = '';
      }
    }
  }

  // Setup touch interactions
  setupTouchInteractions() {
    // Add touch feedback for buttons
    const buttons = document.querySelectorAll('button, .btn, .menu-item');

    buttons.forEach(button => {
      button.addEventListener('touchstart', () => {
        button.style.opacity = '0.7';
      });

      button.addEventListener('touchend', () => {
        setTimeout(() => {
          button.style.opacity = '';
        }, 150);
      });
    });
  }

  // Setup responsive tables
  setupResponsiveTables() {
    const tables = document.querySelectorAll('table');

    tables.forEach(table => {
      // Wrap tables in scrollable containers
      if (!table.parentElement.classList.contains('table-responsive')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive';
        wrapper.style.overflowX = 'auto';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });
  }

  // Setup global UI handlers
  setupGlobalUIHandlers() {
    // Setup loading states
    this.setupLoadingStates();

    // Setup error handling
    this.setupErrorHandling();

    // Setup form validation visual feedback
    this.setupFormValidation();

    // Setup confirmation dialogs
    this.setupConfirmationDialogs();
  }

  // Setup loading states for async operations
  setupLoadingStates() {
    // Create a global loading overlay function
    window.showLoading = (message = 'Loading...') => {
      this.showLoading(message);
    };

    window.hideLoading = () => {
      this.hideLoading();
    };
  }

  // Show loading overlay
  showLoading(message = 'Loading...') {
    let loadingOverlay = document.getElementById('global-loading-overlay');

    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'global-loading-overlay';
      loadingOverlay.innerHTML = `
        <div class="loading-content">
          <div class="spinner"></div>
          <p id="loading-message">${message}</p>
        </div>
      `;
      loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      `;
      document.body.appendChild(loadingOverlay);
    } else {
      document.getElementById('loading-message').textContent = message;
      loadingOverlay.style.display = 'flex';
    }
  }

  // Hide loading overlay
  hideLoading() {
    const loadingOverlay = document.getElementById('global-loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }

  // Setup error handling
  setupErrorHandling() {
    // Global error handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.showError('An unexpected error occurred. Please try again.');
    });

    // Global error handler for JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('JavaScript error:', event.error);
      // Don't show alert for every JS error to avoid annoying users
    });
  }

  // Show error message
  showError(message, duration = 5000) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 10000;
      max-width: 300px;
      word-wrap: break-word;
    `;

    document.body.appendChild(errorDiv);

    // Auto remove after duration
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, duration);
  }

  // Show success message
  showSuccess(message, duration = 3000) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-toast';
    successDiv.textContent = message;
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 10000;
      max-width: 300px;
      word-wrap: break-word;
    `;

    document.body.appendChild(successDiv);

    // Auto remove after duration
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, duration);
  }

  // Setup form validation
  setupFormValidation() {
    // Add visual feedback for form validation
    document.addEventListener('invalid', (e) => {
      e.target.style.borderColor = '#dc3545';
      e.target.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
    });

    document.addEventListener('input', (e) => {
      if (e.target.checkValidity()) {
        e.target.style.borderColor = '';
        e.target.style.boxShadow = '';
      }
    });
  }

  // Setup confirmation dialogs
  setupConfirmationDialogs() {
    // Create a better confirmation dialog
    window.confirmAction = (message, callback) => {
      this.showConfirmation(message, callback);
    };
  }

  // Show confirmation dialog
  showConfirmation(message, callback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      max-width: 400px;
      width: 90%;
      text-align: center;
    `;

    dialog.innerHTML = `
      <p style="margin-bottom: 20px; font-size: 16px;">${message}</p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="confirm-yes" style="
          background: #dc3545;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        ">Yes</button>
        <button id="confirm-no" style="
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        ">No</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Handle button clicks
    dialog.querySelector('#confirm-yes').addEventListener('click', () => {
      document.body.removeChild(overlay);
      if (callback) callback(true);
    });

    dialog.querySelector('#confirm-no').addEventListener('click', () => {
      document.body.removeChild(overlay);
      if (callback) callback(false);
    });

    // Handle overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        if (callback) callback(false);
      }
    });
  }

  // Utility function to animate element
  animateElement(element, animation, duration = 300) {
    return new Promise((resolve) => {
      element.style.animation = `${animation} ${duration}ms ease-in-out`;

      setTimeout(() => {
        element.style.animation = '';
        resolve();
      }, duration);
    });
  }

  // Utility function to smooth scroll to element
  scrollToElement(element, offset = 0) {
    if (!element) return;

    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }

  // Format currency display
  formatCurrency(amount, currency = '₹') {
    return `${currency}${parseFloat(amount || 0).toFixed(2)}`;
  }

  // Format date display
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };

    return new Date(date).toLocaleDateString('en-IN', { ...defaultOptions, ...options });
  }

  // Debounce function for search/input handlers
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
  }

  // Throttle function for scroll/resize handlers
  throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + S to save (prevent default browser save)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();

        // Find active form and trigger save
        const activeSection = document.querySelector('.content-section:not(.hidden)');
        if (activeSection) {
          const form = activeSection.querySelector('form');
          if (form) {
            form.dispatchEvent(new Event('submit', { bubbles: true }));
          }
        }
      }

      // Escape key to close modals/overlays
      if (e.key === 'Escape') {
        const overlay = document.getElementById('global-loading-overlay');
        if (overlay && overlay.style.display !== 'none') {
          this.hideLoading();
        }
      }
    });
  }

  // Initialize all UI features
  initializeAll() {
    this.initialize();
    this.setupKeyboardShortcuts();

    // Make global functions available
    window.uiManager = this;
    window.showError = (message, duration) => this.showError(message, duration);
    window.showSuccess = (message, duration) => this.showSuccess(message, duration);
    window.formatCurrency = (amount, currency) => this.formatCurrency(amount, currency);
    window.formatDate = (date, options) => this.formatDate(date, options);
  }
}

// Create global instance
const uiManager = new UIManager();

// Make it globally available
window.uiManager = uiManager;

export { uiManager };