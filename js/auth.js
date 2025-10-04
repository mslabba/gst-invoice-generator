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
    this.init();
  }

  init() {
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'Logged in' : 'Logged out', user?.email);
      this.currentUser = user;
      this._authStateReady = true;
      this.updateUI();
    });
  }

  async register(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      await this.createUserProfile(user.uid, {
        email: user.email,
        displayName: displayName,
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
      window.location.href = 'login.html';
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
    const authButton = document.getElementById('auth-button');
    const userInfo = document.getElementById('user-info');
    const mainContent = document.getElementById('main-content');
    const authRequired = document.getElementById('auth-required');
    const saveInvoiceBtn = document.getElementById('save-invoice');

    if (this.currentUser) {
      // User is logged in
      if (authButton) authButton.textContent = 'Logout';
      if (userInfo) userInfo.textContent = `Welcome, ${this.currentUser.email}`;
      if (mainContent) mainContent.classList.remove('hidden');
      if (authRequired) authRequired.classList.add('hidden');
      if (saveInvoiceBtn) saveInvoiceBtn.classList.remove('hidden');
    } else {
      // User is not logged in
      if (authButton) authButton.textContent = 'Login';
      if (userInfo) userInfo.textContent = '';
      if (mainContent) mainContent.classList.remove('hidden'); // Allow guest access
      if (authRequired) authRequired.classList.remove('hidden');
      if (saveInvoiceBtn) saveInvoiceBtn.classList.add('hidden');
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
}

// Initialize auth manager
export const authManager = new AuthManager();
window.authManager = authManager;