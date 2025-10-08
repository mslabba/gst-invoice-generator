// Main Dashboard Controller - Orchestrates all dashboard modules
import { dashboardManager } from './dashboard-manager.js';
import { invoiceManager } from './invoice-manager.js';
import { profileManager } from './profile-manager.js';
import { uiManager } from './ui-manager.js';
import { stockManager } from './stock-management.js';

class DashboardController {
  constructor() {
    this.isInitialized = false;
    this.modules = {
      dashboard: dashboardManager,
      invoice: invoiceManager,
      profile: profileManager,
      ui: uiManager,
      stock: stockManager
    };
  }

  // Initialize the entire dashboard
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('Initializing dashboard...');

      // Initialize UI manager first (sets up base UI functionality)
      this.modules.ui.initializeAll();

      // Initialize dashboard manager (handles auth and basic setup)
      const authSuccess = await this.modules.dashboard.initialize();
      if (!authSuccess) {
        console.error('Dashboard initialization failed - authentication issue');
        return false;
      }

      // Initialize other modules
      this.modules.profile.initialize();
      this.modules.stock.initialize?.();

      // Setup refresh button for invoices
      this.modules.dashboard.setupRefreshButton();

      // Setup user info display
      this.setupUserInfo();

      console.log('Dashboard initialized successfully');
      this.isInitialized = true;
      return true;

    } catch (error) {
      console.error('Error initializing dashboard:', error);
      window.showError?.('Failed to initialize dashboard. Please refresh the page.');
      return false;
    }
  }

  // Setup user info display
  setupUserInfo() {
    const userInfoElement = document.getElementById('user-info');
    if (userInfoElement && window.authManager?.currentUser) {
      const user = window.authManager.currentUser;
      const displayName = user.displayName || user.email?.split('@')[0] || 'User';
      userInfoElement.textContent = `Welcome, ${displayName}`;
    }
  }

  // Handle section switching (called by dashboard manager)
  async handleSectionSwitch(section) {
    window.showLoading?.('Loading...');

    try {
      switch (section) {
        case 'saved-invoices':
          await this.modules.dashboard.loadSavedInvoices();
          break;

        case 'profile-section':
          await this.modules.profile.loadProfileData();
          break;

        case 'stock-management-section':
          if (this.modules.stock.loadProducts) {
            await this.modules.stock.loadProducts();
          }
          break;

        case 'create-invoice-section':
          await this.modules.invoice.initializeForm();
          break;

        default:
          console.warn('Unknown section:', section);
      }
    } catch (error) {
      console.error('Error switching section:', error);
      window.showError?.('Error loading section. Please try again.');
    } finally {
      window.hideLoading?.();
    }
  }

  // Get module by name
  getModule(name) {
    return this.modules[name];
  }

  // Check if all modules are ready
  areModulesReady() {
    return this.isInitialized &&
      Object.values(this.modules).every(module => module !== null);
  }

  // Refresh all data
  async refreshAll() {
    if (!this.areModulesReady()) return;

    window.showLoading?.('Refreshing data...');

    try {
      // Refresh saved invoices
      await this.modules.dashboard.loadSavedInvoices();

      // Refresh products if stock manager is available
      if (this.modules.stock.loadProducts) {
        await this.modules.stock.loadProducts();
      }

      // Reload profile data
      await this.modules.profile.loadProfileData();

      window.showSuccess?.('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      window.showError?.('Error refreshing data. Some information may be outdated.');
    } finally {
      window.hideLoading?.();
    }
  }

  // Handle errors globally
  handleError(error, context = 'Unknown') {
    console.error(`Error in ${context}:`, error);

    let userMessage = 'An error occurred. Please try again.';

    // Customize error messages based on error type
    if (error.code === 'permission-denied') {
      userMessage = 'You do not have permission to perform this action.';
    } else if (error.code === 'network-request-failed') {
      userMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message) {
      userMessage = error.message;
    }

    window.showError?.(userMessage);
  }

  // Cleanup resources
  cleanup() {
    // Remove event listeners and cleanup modules if needed
    console.log('Cleaning up dashboard resources...');
    this.isInitialized = false;
  }
}

// Create global instance
const dashboardController = new DashboardController();

// Make it globally available
window.dashboardController = dashboardController;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  await dashboardController.initialize();
});

export { dashboardController };