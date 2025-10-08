// Dashboard Manager - Main dashboard functionality
import { authManager } from './auth.js';
import { invoiceStorage } from './invoice-storage.js';

class DashboardManager {
  constructor() {
    this.savedInvoices = [];
  }

  // Initialize dashboard
  async initialize() {
    try {
      // Wait for auth state to be determined
      const user = await authManager.waitForAuthState();

      if (!user) {
        window.location.href = 'login.html';
        return false;
      }

      // Hide loading screen and show dashboard
      document.getElementById('loading-screen').style.display = 'none';
      document.getElementById('dashboard-main').style.display = 'flex';

      // Load navbar logo
      await this.loadNavbarLogo();

      // Setup navigation
      this.setupNavigation();

      // Setup logout functionality
      this.setupLogout();

      // Load initial data
      await this.loadSavedInvoices();

      return true;
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      return false;
    }
  }

  // Setup sidebar navigation
  setupNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');

    menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const section = item.getAttribute('data-section');
        if (!section) {
          return; // Allow normal navigation for external links
        }

        e.preventDefault();

        // Remove active class from all items
        menuItems.forEach(mi => mi.classList.remove('active'));
        contentSections.forEach(cs => cs.classList.add('hidden'));

        // Add active class to clicked item
        item.classList.add('active');

        // Show corresponding content section
        const targetSection = document.getElementById(section);
        if (targetSection) {
          targetSection.classList.remove('hidden');
          this.handleSectionSwitch(section);
        }
      });
    });
  }

  // Handle section switching
  async handleSectionSwitch(section) {
    switch (section) {
      case 'saved-invoices':
        await this.loadSavedInvoices();
        break;
      case 'profile-section':
        // Profile manager will handle this
        window.profileManager?.loadProfileData();
        break;
      case 'stock-management-section':
        // Stock manager will handle this
        window.stockManager?.loadProducts();
        break;
      case 'create-invoice-section':
        // Invoice manager will handle this
        window.invoiceManager?.initializeForm();
        break;
    }
  }

  // Load company logo in navbar
  async loadNavbarLogo() {
    try {
      if (authManager && authManager.currentUser) {
        const companyLogo = await authManager.getCompanyLogo();
        const navbarLogo = document.getElementById('navbar-logo');
        if (navbarLogo && companyLogo && companyLogo !== 'assets/images/logo.png') {
          navbarLogo.src = companyLogo;
        }
      }
    } catch (error) {
      console.error('Error loading navbar logo:', error);
    }
  }

  // Setup logout functionality
  setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        authManager.logout();
      });
    }
  }

  // Load saved invoices
  async loadSavedInvoices() {
    const invoicesList = document.getElementById('saved-invoices-list');
    if (!invoicesList) return;

    invoicesList.innerHTML = '<p>Loading...</p>';

    const result = await invoiceStorage.getUserInvoices();
    if (result.success && result.invoices.length > 0) {
      this.savedInvoices = result.invoices;
      this.renderInvoicesList(result.invoices);
    } else if (result.success && result.invoices.length === 0) {
      invoicesList.innerHTML = '<p>No saved invoices found. <a href="#" onclick="dashboardManager.switchToCreateInvoice()">Create your first invoice</a></p>';
    } else {
      invoicesList.innerHTML = '<p>Error loading invoices: ' + result.message + '</p>';
    }
  }

  // Render invoices list
  renderInvoicesList(invoices) {
    const invoicesList = document.getElementById('saved-invoices-list');
    let invoicesHtml = '<div class="invoices-grid">';

    invoices.forEach(invoice => {
      invoicesHtml += `
        <div class="invoice-card">
          <div class="invoice-header">
            <h3>Invoice #${invoice.invoiceNumber}</h3>
            <span class="invoice-date">${new Date(invoice.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="invoice-details">
            <p><strong>To:</strong> ${invoice.buyer.name}</p>
            <p><strong>Amount:</strong> ₹${(invoice.totalAmount || 0).toFixed(2)}</p>
            <p><strong>Items:</strong> ${invoice.items.length}</p>
          </div>
          <div class="invoice-actions">
            <button onclick="dashboardManager.viewInvoice('${invoice.id}')" class="btn btn-primary">View</button>
            <button onclick="dashboardManager.downloadInvoice('${invoice.id}')" class="btn btn-secondary">Download</button>
            <button onclick="dashboardManager.deleteInvoice('${invoice.id}')" class="btn btn-danger">Delete</button>
          </div>
        </div>
      `;
    });

    invoicesHtml += '</div>';
    invoicesList.innerHTML = invoicesHtml;
  }

  // Switch to create invoice section
  switchToCreateInvoice() {
    // Remove active class from all menu items and sections
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(section => section.classList.add('hidden'));

    // Activate create invoice menu item and section
    const createInvoiceMenuItem = document.querySelector('[data-section="create-invoice-section"]');
    const createInvoiceSection = document.getElementById('create-invoice-section');

    if (createInvoiceMenuItem) createInvoiceMenuItem.classList.add('active');
    if (createInvoiceSection) createInvoiceSection.classList.remove('hidden');

    // Initialize the invoice form
    setTimeout(() => window.invoiceManager?.initializeForm(), 100);
  }

  // Setup refresh button
  setupRefreshButton() {
    const refreshBtn = document.getElementById('refresh-invoices');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadSavedInvoices();
      });
    }
  }

  // Global functions for invoice actions
  async viewInvoice(invoiceId) {
    const invoice = this.savedInvoices.find(inv => inv.id === invoiceId);
    if (invoice && window.invoiceManager) {
      await window.invoiceManager.viewInvoice(invoice);
    }
  }

  async downloadInvoice(invoiceId) {
    const invoice = this.savedInvoices.find(inv => inv.id === invoiceId);
    if (invoice && window.invoiceManager) {
      await window.invoiceManager.downloadInvoice(invoice);
    }
  }

  async deleteInvoice(invoiceId) {
    if (confirm('Are you sure you want to delete this invoice?')) {
      const result = await invoiceStorage.deleteInvoice(invoiceId);
      if (result.success) {
        alert('Invoice deleted successfully!');
        this.loadSavedInvoices(); // Refresh the list
      } else {
        alert('Failed to delete invoice: ' + result.message);
      }
    }
  }
}

// Create global instance
const dashboardManager = new DashboardManager();

// Make it globally available
window.dashboardManager = dashboardManager;

export { dashboardManager };