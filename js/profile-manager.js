// Profile Manager - Handle user profile and settings
import { authManager } from './auth.js';

class ProfileManager {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize profile manager
  initialize() {
    if (this.isInitialized) return;

    this.setupEventListeners();
    this.setupTabFunctionality();
    this.setupImagePreview();
    this.isInitialized = true;
  }

  // Setup event listeners
  setupEventListeners() {
    // Profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', this.saveProfileData.bind(this));
    }
  }

  // Setup tab functionality
  setupTabFunctionality() {
    const tabButtons = document.querySelectorAll('.profile-tabs .tab-btn');
    const tabContents = document.querySelectorAll('#profile-section .tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', function () {
        const targetTab = this.getAttribute('data-tab');

        // Remove active class from all tabs and contents
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

  // Setup image preview functionality
  setupImagePreview() {
    // Logo upload handling
    const logoInput = document.getElementById('company-logo');
    if (logoInput) {
      logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const logoPreview = document.getElementById('logo-preview');
            const logoImg = document.getElementById('logo-preview-img');
            if (logoImg && logoPreview) {
              logoImg.src = e.target.result;
              logoPreview.classList.remove('hidden');
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Remove logo functionality
    const removeLogo = document.getElementById('remove-logo');
    if (removeLogo) {
      removeLogo.addEventListener('click', () => {
        const logoInput = document.getElementById('company-logo');
        const logoPreview = document.getElementById('logo-preview');
        const logoImg = document.getElementById('logo-preview-img');

        if (logoInput) logoInput.value = '';
        if (logoPreview) logoPreview.classList.add('hidden');
        if (logoImg) logoImg.src = '';
      });
    }

    // QR code upload handling
    const qrInput = document.getElementById('upi-qr-code');
    if (qrInput) {
      qrInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const qrPreview = document.getElementById('qr-preview');
            const qrImg = document.getElementById('qr-preview-img');
            if (qrImg && qrPreview) {
              qrImg.src = e.target.result;
              qrPreview.classList.remove('hidden');
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Remove QR code functionality
    const removeQr = document.getElementById('remove-qr');
    if (removeQr) {
      removeQr.addEventListener('click', () => {
        const qrInput = document.getElementById('upi-qr-code');
        const qrPreview = document.getElementById('qr-preview');
        const qrImg = document.getElementById('qr-preview-img');

        if (qrInput) qrInput.value = '';
        if (qrPreview) qrPreview.classList.add('hidden');
        if (qrImg) qrImg.src = '';
      });
    }
  }

  // Load profile data
  async loadProfileData() {
    if (!authManager.currentUser) return;

    try {
      const profile = await authManager.getUserProfile(authManager.currentUser.uid);
      if (profile) {
        this.populateForm(profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  // Populate form with profile data
  populateForm(profile) {
    // Basic profile information
    this.setFieldValue('display-name', profile.displayName);
    this.setFieldValue('default-seller-name', profile.defaultSellerName);
    this.setFieldValue('default-seller-address', profile.defaultSellerAddress);
    this.setFieldValue('default-seller-gst', profile.defaultSellerGst);

    // Load company logo if exists
    if (profile.companyLogo) {
      const logoPreview = document.getElementById('logo-preview');
      const logoImg = document.getElementById('logo-preview-img');
      if (logoImg && logoPreview) {
        logoImg.src = profile.companyLogo;
        logoPreview.classList.remove('hidden');
      }
    }

    // Load banking details
    if (profile.banking) {
      this.setFieldValue('bank-name', profile.banking.bankName);
      this.setFieldValue('account-holder', profile.banking.accountHolder);
      this.setFieldValue('account-number', profile.banking.accountNumber);
      this.setFieldValue('ifsc-code', profile.banking.ifscCode);
      this.setFieldValue('branch-name', profile.banking.branchName);
      this.setFieldValue('upi-id', profile.banking.upiId);
    }

    // Load UPI QR code if exists
    if (profile.upiQrCode) {
      const qrPreview = document.getElementById('qr-preview');
      const qrImg = document.getElementById('qr-preview-img');
      if (qrImg && qrPreview) {
        qrImg.src = profile.upiQrCode;
        qrPreview.classList.remove('hidden');
      }
    }
  }

  // Helper method to set field value safely
  setFieldValue(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (field && value) {
      field.value = value;
    }
  }

  // Helper method to get field value safely
  getFieldValue(fieldId) {
    const field = document.getElementById(fieldId);
    return field ? field.value.trim() : '';
  }

  // Save profile data
  async saveProfileData(e) {
    e.preventDefault();

    if (!authManager.currentUser) return;

    try {
      const profileData = this.collectFormData();
      await authManager.createUserProfile(authManager.currentUser.uid, profileData);

      alert('Profile updated successfully!');

      // Refresh navbar logo if it was updated
      if (window.dashboardManager) {
        await window.dashboardManager.loadNavbarLogo();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile: ' + error.message);
    }
  }

  // Collect form data
  collectFormData() {
    const profileData = {
      displayName: this.getFieldValue('display-name'),
      defaultSellerName: this.getFieldValue('default-seller-name'),
      defaultSellerAddress: this.getFieldValue('default-seller-address'),
      defaultSellerGst: this.getFieldValue('default-seller-gst'),
      email: authManager.currentUser.email,
      updatedAt: new Date().toISOString()
    };

    // Banking details
    const bankingData = {
      bankName: this.getFieldValue('bank-name'),
      accountHolder: this.getFieldValue('account-holder'),
      accountNumber: this.getFieldValue('account-number'),
      ifscCode: this.getFieldValue('ifsc-code'),
      branchName: this.getFieldValue('branch-name'),
      upiId: this.getFieldValue('upi-id')
    };

    // Add banking details if any field is filled
    if (Object.values(bankingData).some(value => value !== '')) {
      profileData.banking = bankingData;
    }

    // Include company logo if uploaded
    const logoImg = document.getElementById('logo-preview-img');
    if (logoImg && logoImg.src && !logoImg.src.includes('assets/images/')) {
      profileData.companyLogo = logoImg.src;
    }

    // Include UPI QR code if uploaded
    const qrImg = document.getElementById('qr-preview-img');
    if (qrImg && qrImg.src && qrImg.src.trim() !== '') {
      profileData.upiQrCode = qrImg.src;
    }

    return profileData;
  }

  // Reset form
  resetForm() {
    const form = document.getElementById('profile-form');
    if (form) {
      form.reset();
    }

    // Hide previews
    const logoPreview = document.getElementById('logo-preview');
    const qrPreview = document.getElementById('qr-preview');

    if (logoPreview) logoPreview.classList.add('hidden');
    if (qrPreview) qrPreview.classList.add('hidden');

    // Clear preview images
    const logoImg = document.getElementById('logo-preview-img');
    const qrImg = document.getElementById('qr-preview-img');

    if (logoImg) logoImg.src = '';
    if (qrImg) qrImg.src = '';
  }

  // Validate form data
  validateFormData(data) {
    if (!data.displayName) {
      alert('Please enter display name');
      return false;
    }

    if (!data.defaultSellerName) {
      alert('Please enter default seller name');
      return false;
    }

    // Validate banking details if provided
    if (data.banking) {
      const banking = data.banking;

      // If account number is provided, bank name and IFSC should also be provided
      if (banking.accountNumber && (!banking.bankName || !banking.ifscCode)) {
        alert('Please provide bank name and IFSC code along with account number');
        return false;
      }

      // Validate IFSC code format (basic validation)
      if (banking.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(banking.ifscCode)) {
        alert('Please enter a valid IFSC code (e.g., SBIN0123456)');
        return false;
      }

      // Validate UPI ID format (basic validation)
      if (banking.upiId && !/@/.test(banking.upiId)) {
        alert('Please enter a valid UPI ID (e.g., user@paytm)');
        return false;
      }
    }

    return true;
  }

  // Export profile data
  exportProfile() {
    if (!authManager.currentUser) {
      alert('Please login first');
      return;
    }

    authManager.getUserProfile(authManager.currentUser.uid)
      .then(profile => {
        if (profile) {
          const dataStr = JSON.stringify(profile, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);

          const link = document.createElement('a');
          link.href = url;
          link.download = `profile_${authManager.currentUser.uid}_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          URL.revokeObjectURL(url);
        } else {
          alert('No profile data found to export');
        }
      })
      .catch(error => {
        console.error('Error exporting profile:', error);
        alert('Error exporting profile: ' + error.message);
      });
  }

  // Import profile data
  importProfile(file) {
    if (!file) {
      alert('Please select a file to import');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const profileData = JSON.parse(e.target.result);

        if (this.validateImportedData(profileData)) {
          this.populateForm(profileData);
          alert('Profile data imported successfully. Please review and save.');
        } else {
          alert('Invalid profile data format');
        }
      } catch (error) {
        console.error('Error importing profile:', error);
        alert('Error importing profile: Invalid JSON format');
      }
    };

    reader.readAsText(file);
  }

  // Validate imported profile data
  validateImportedData(data) {
    // Basic validation to ensure it's profile data
    return data &&
      typeof data === 'object' &&
      (data.displayName || data.defaultSellerName || data.banking);
  }
}

// Create global instance
const profileManager = new ProfileManager();

// Make it globally available
window.profileManager = profileManager;

export { profileManager };