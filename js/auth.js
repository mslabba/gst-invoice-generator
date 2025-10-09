import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

class AuthManager {
  constructor() {
    this.currentUser = null;
    this._authStateReady = false;
    this._initialized = false;

    // Initialize after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      // DOM is already ready
      this.init();
    }
  }

  init() {
    if (this._initialized) return;
    this._initialized = true;

    console.log('AuthManager initializing...');

    // Debug: Check what page we're on and what elements exist
    console.log('Current page URL:', window.location.href);
    console.log('Page title:', document.title);
    console.log('All elements with ID:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));

    // Ensure main content is visible immediately on page load
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      console.log('Found main content, making it visible');
      mainContent.classList.remove('hidden');
      mainContent.style.display = 'block';
    } else {
      console.log('Main content not found during init');
      // Try to find any container elements
      const containers = document.querySelectorAll('.container, [class*="content"], [id*="content"]');
      console.log('Found container-like elements:', Array.from(containers).map(el => ({ tag: el.tagName, id: el.id, class: el.className })));
    }

    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'Logged in' : 'Logged out', user?.email);
      this.currentUser = user;
      this._authStateReady = true;
      this.updateUI();
    });
  }

  async register(email, password, displayName, mobile = '') {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      await this.createUserProfile(user.uid, {
        email: user.email,
        displayName: displayName,
        mobile: mobile,
        createdAt: new Date().toISOString()
      });

      // Send email verification
      await sendEmailVerification(user);

      return { success: true, message: 'Registration successful! Please check your email for verification.' };
    } catch (error) {
      return { success: false, message: this.getErrorMessage(error.code) };
    }
  }

  async login(email, password) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true, message: 'Login successful!' };
    } catch (error) {
      return { success: false, message: this.getErrorMessage(error.code) };
    }
  }

  async logout() {
    try {
      await signOut(auth);
      window.location.href = 'index.html';
      return { success: true, message: 'Logged out successfully!' };
    } catch (error) {
      return { success: false, message: 'Error logging out' };
    }
  }

  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent!' };
    } catch (error) {
      return { success: false, message: this.getErrorMessage(error.code) };
    }
  }

  async createUserProfile(uid, userData) {
    try {
      await setDoc(doc(db, 'users', uid), userData);
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  }

  async getUserProfile(uid) {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  updateUI() {
    console.log('UpdateUI called, current user:', this.currentUser?.email || 'Not logged in');
    console.log('Current page in updateUI:', window.location.href);

    // Check for redirects on auth pages
    this.handleAuthPageRedirects();

    const authButton = document.getElementById('auth-button');
    const userInfo = document.getElementById('user-info');
    const mainContent = document.getElementById('main-content');
    const authRequired = document.getElementById('auth-required');
    const saveInvoiceBtn = document.getElementById('save-invoice');
    const ctaButtons = document.querySelectorAll('.cta-buttons');
    const dashboardBtn = document.getElementById('dashboard-btn');
    const userInfoBar = document.getElementById('user-info-bar');

    console.log('Elements found:', {
      authButton: !!authButton,
      userInfo: !!userInfo,
      mainContent: !!mainContent,
      authRequired: !!authRequired,
      saveInvoiceBtn: !!saveInvoiceBtn,
      ctaButtons: ctaButtons.length,
      dashboardBtn: !!dashboardBtn,
      userInfoBar: !!userInfoBar
    });

    // Always ensure main content is visible
    if (mainContent) {
      mainContent.classList.remove('hidden');
      mainContent.style.display = 'block';
      mainContent.style.visibility = 'visible';
      console.log('Main content made visible, current styles:', {
        display: mainContent.style.display,
        visibility: mainContent.style.visibility,
        classes: mainContent.className
      });
    } else {
      console.error('Main content element not found!');
      // Try to make any content visible
      const containers = document.querySelectorAll('.container, form, main');
      console.log('Trying to make these containers visible:', containers);
      containers.forEach(container => {
        container.style.display = 'block';
        container.style.visibility = 'visible';
        container.classList.remove('hidden');
      });
    }

    if (this.currentUser) {
      // User is logged in
      console.log('Updating UI for logged in user');
      if (authButton) authButton.textContent = 'Logout';
      if (userInfo) userInfo.textContent = `Welcome, ${this.currentUser.email}`;
      if (authRequired) authRequired.classList.add('hidden');
      if (saveInvoiceBtn) saveInvoiceBtn.classList.remove('hidden');
      if (userInfoBar) userInfoBar.classList.remove('hidden');
      if (dashboardBtn) {
        dashboardBtn.classList.remove('hidden');
        dashboardBtn.onclick = () => window.location.href = 'dashboard.html';
      }

      // Update CTA buttons to show Dashboard link instead of Register/Login
      ctaButtons.forEach(buttonContainer => {
        buttonContainer.innerHTML = `
          <a href="dashboard.html" class="btn-primary">Go to Dashboard</a>
          <button class="logout-cta-btn btn-secondary">Logout</button>
        `;

        // Add logout functionality
        const logoutBtn = buttonContainer.querySelector('.logout-cta-btn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', () => this.logout());
        }
      });

      // Load default seller data
      this.loadDefaultSellerData();
    } else {
      // User is not logged in
      console.log('Updating UI for guest user');
      if (authButton) authButton.textContent = 'Login';
      if (userInfo) userInfo.textContent = '';
      if (authRequired) authRequired.classList.remove('hidden');
      if (saveInvoiceBtn) saveInvoiceBtn.classList.add('hidden');
      if (dashboardBtn) dashboardBtn.classList.add('hidden');
      if (userInfoBar) userInfoBar.classList.add('hidden');
    }
  }

  handleAuthPageRedirects() {
    // Redirect logged-in users away from auth pages
    if (this.currentUser) {
      const currentPage = window.location.pathname;
      const isAuthPage = currentPage.includes('login.html') || currentPage.includes('register.html');

      if (isAuthPage) {
        console.log('Redirecting logged-in user from auth page to dashboard');
        window.location.href = 'dashboard.html';
        return;
      }
    }
  }

  requireAuth() {
    if (!this.currentUser) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  // Wait for auth state to be determined
  waitForAuthState() {
    return new Promise((resolve) => {
      // Check if we already have auth state determined
      if (this.currentUser !== null || this._authStateReady) {
        console.log('Auth state already determined:', this.currentUser?.email || 'Not logged in');
        resolve(this.currentUser);
        return;
      }

      console.log('Waiting for auth state...');
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('Auth state determined in waitForAuthState:', user?.email || 'Not logged in');
        this._authStateReady = true;
        unsubscribe();
        resolve(user);
      });
    });
  }

  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/email-already-in-use': 'Email is already registered',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/too-many-requests': 'Too many failed attempts. Try again later'
    };
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  }

  async loadDefaultSellerData() {
    try {
      const profile = await this.getUserProfile(this.currentUser.uid);
      if (profile) {
        const sellerName = document.getElementById('seller-name');
        const sellerAddress = document.getElementById('seller-address');
        const sellerGst = document.getElementById('seller-gst');

        if (sellerName && !sellerName.value) sellerName.value = profile.defaultSellerName || '';
        if (sellerAddress && !sellerAddress.value) sellerAddress.value = profile.defaultSellerAddress || '';
        if (sellerGst && !sellerGst.value) sellerGst.value = profile.defaultSellerGst || '';

        // Update logo in app header if custom logo exists
        const appLogo = document.querySelector('.app-logo');
        if (appLogo && profile.companyLogo) {
          appLogo.src = profile.companyLogo;
        }
      }
    } catch (error) {
      console.error('Error loading default seller data:', error);
    }
  }

  // Get current user's company logo
  async getCompanyLogo() {
    try {
      if (!this.currentUser) return 'assets/images/logo.png';

      const profile = await this.getUserProfile(this.currentUser.uid);
      return profile?.companyLogo || 'assets/images/logo.png';
    } catch (error) {
      console.error('Error getting company logo:', error);
      return 'assets/images/logo.png';
    }
  }
}

// Initialize auth manager
export const authManager = new AuthManager();
window.authManager = authManager;