/**
 * Business Accounting Controller - Main controller for business accounting features
 * Handles navigation, initialization, and coordination between modules
 */

class BusinessAccountingController {
    constructor() {
        this.currentSection = 'dashboard-overview';
        this.isInitialized = false;
        this.modules = {};
    }

    /**
     * Initialize the business accounting controller
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            // Initialize database and modules
            await this.initializeModules();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load dashboard data
            
            this.isInitialized = true;
            console.log('Business Accounting Controller initialized');

        } catch (error) {
            console.error('Error initializing Business Accounting Controller:', error);
            this.showError('Failed to initialize business accounting system');
        }
    }

    /**
     * Initialize all modules
     */
    async initializeModules() {
        try {
            // Wait for modules to be available
            await this.waitForModules();

            // Initialize modules with better error checking
            console.log('Available modules:', {
                databaseManager: !!window.databaseManager,
                purchaseManager: !!window.purchaseManager,
                paymentManager: !!window.paymentManager,
                expenseManager: !!window.expenseManager
            });
            
            // Debug database manager specifically
            if (window.databaseManager) {
                console.log('DatabaseManager details:', {
                    isInitialized: window.databaseManager.isInitialized,
                    hasGetAll: typeof window.databaseManager.getAll === 'function',
                    collections: window.databaseManager.collections
                });
            }

            if (!window.databaseManager) {
                console.warn('DatabaseManager not available - some features will be limited');
            }

            this.modules.database = window.databaseManager;
            this.modules.purchase = window.purchaseManager;
            this.modules.payment = window.paymentManager;
            this.modules.expense = window.expenseManager;
            this.modules.stock = window.stockManager; // Add stock manager for fallback
            
            console.log('Stock manager available:', !!window.stockManager);

            // Initialize each module if available
            if (this.modules.database && this.modules.database.initialize) {
                await this.modules.database.initialize();
            }
            if (this.modules.purchase && this.modules.purchase.initialize) {
                await this.modules.purchase.initialize();
            }
            if (this.modules.payment && this.modules.payment.initialize) {
                await this.modules.payment.initialize();
            }
            if (this.modules.expense && this.modules.expense.initialize) {
                await this.modules.expense.initialize();
            }

            // Test Firebase connection
            await this.testFirebaseConnection();

            console.log('All business modules initialized successfully');

        } catch (error) {
            console.error('Error initializing modules:', error);
            // Don't throw error, just log it and continue with limited functionality
            console.warn('Business controller will run with limited functionality');
        }
    }

    /**
     * Test Firebase connection
     */
    async testFirebaseConnection() {
        try {
            if (this.modules.database && this.modules.database.getAll) {
                console.log('Testing Firebase connection...');
                const testResult = await this.modules.database.getAll('products');
                console.log('Firebase connection test successful. Products found:', testResult.length);
            } else {
                console.warn('Cannot test Firebase - database module not available');
            }
        } catch (error) {
            console.error('Firebase connection test failed:', error);
        }
    }

    /**
     * Wait for modules to be loaded
     */
    async waitForModules() {
        const maxWait = 10000; // 10 seconds
        const checkInterval = 100; // 100ms
        let waited = 0;

        return new Promise((resolve, reject) => {
            const checkModules = () => {
                if (window.databaseManager && window.purchaseManager && 
                    window.paymentManager && window.expenseManager) {
                    resolve();
                } else if (waited >= maxWait) {
                    reject(new Error('Modules failed to load within timeout'));
                } else {
                    waited += checkInterval;
                    setTimeout(checkModules, checkInterval);
                }
            };
            checkModules();
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Menu navigation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('menu-item')) {
                e.preventDefault();
                const section = e.target.getAttribute('data-section');
                if (section) {
                    this.navigateToSection(section);
                }
            }

            // Quick action buttons
            if (e.target.classList.contains('action-btn')) {
                const section = e.target.getAttribute('data-section');
                if (section) {
                    this.navigateToSection(section);
                }
            }

            // Tab buttons
            if (e.target.classList.contains('tab-btn')) {
                this.handleTabClick(e.target);
            }
        });

        // Section-specific button handlers will be set up when sections are shown
        // this.setupSectionEventListeners();
    }

    /**
     * Set up section-specific event listeners (called when sections are shown)
     */
    setupPurchaseOrdersEventListeners() {
        console.log('Setting up Purchase Orders event listeners...');
        this.setupButtonHandler('create-po-btn', () => this.showCreatePurchaseOrderModal());
        this.setupButtonHandler('refresh-po-btn', () => this.loadPurchaseOrders());
    }

    setupPurchaseInvoicesEventListeners() {
        console.log('Setting up Purchase Invoices event listeners...');
        this.setupButtonHandler('create-pi-btn', () => this.showCreatePurchaseInvoiceModal());
        this.setupButtonHandler('refresh-pi-btn', () => this.loadPurchaseInvoices());
    }

    setupSalesOrdersEventListeners() {
        console.log('Setting up Sales Orders event listeners...');
        this.setupButtonHandler('create-so-btn', () => this.showCreateSalesOrderModal());
        this.setupButtonHandler('refresh-so-btn', () => this.loadSalesOrders());
    }

    setupSuppliersEventListeners() {
        console.log('Setting up Suppliers event listeners...');
        this.setupButtonHandler('add-supplier-btn', () => this.showSupplierModal());
        this.setupButtonHandler('refresh-suppliers-btn', () => this.loadSuppliers());
    }

    setupCustomersEventListeners() {
        console.log('Setting up Customers event listeners...');
        this.setupButtonHandler('add-customer-btn', () => this.showCustomerModal());
        this.setupButtonHandler('refresh-customers-btn', () => this.loadCustomers());
    }

    setupProductsEventListeners() {
        console.log('Setting up Products event listeners...');
        this.setupButtonHandler('refresh-products-btn', () => this.refreshProducts());
    }

    setupPaymentsInEventListeners() {
        console.log('Setting up Payments In event listeners...');
        this.setupButtonHandler('record-payment-in-btn', () => this.showRecordPaymentInModal());
        this.setupButtonHandler('refresh-payments-in-btn', () => this.loadPaymentsIn());
    }

    setupPaymentsOutEventListeners() {
        console.log('Setting up Payments Out event listeners...');
        this.setupButtonHandler('make-payment-out-btn', () => this.showMakePaymentOutModal());
        this.setupButtonHandler('refresh-payments-out-btn', () => this.loadPaymentsOut());
    }

    setupExpensesEventListeners() {
        console.log('Setting up Expenses event listeners...');
        this.setupButtonHandler('add-expense-btn', () => this.showAddExpenseModal());
        this.setupButtonHandler('refresh-expenses-btn', () => this.loadExpenses());
    }

    /**
     * Helper to set up button event handlers
     */
    setupButtonHandler(buttonId, handler) {
        const button = document.getElementById(buttonId);
        if (button) {
            console.log(`✅ Button found and handler attached: ${buttonId}`);
            button.addEventListener('click', handler);
        } else {
            console.warn(`❌ Button not found: ${buttonId}`);
        }
    }

    /**
     * Check if database module is available
     */
    isDatabaseAvailable() {
        return this.modules && this.modules.database && typeof this.modules.database.getAll === 'function';
    }

    /**
     * Direct Firebase access as fallback
     */
    async getFirebaseData(collectionName) {
        try {
            const { db } = await import('./firebase-config.js');
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
            
            const collectionRef = collection(db, collectionName);
            const snapshot = await getDocs(collectionRef);
            
            const data = [];
            snapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            
            return data;
        } catch (error) {
            console.error(`Error getting ${collectionName} from Firebase:`, error);
            throw error;
        }
    }

    /**
     * Show error message for unavailable database
     */
    showDatabaseUnavailableError(container, feature) {
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-state-icon"><i class="fas fa-exclamation-triangle fa-3x"></i></div>
                    <h3>Database Not Available</h3>
                    <p>The ${feature} feature requires the database module to be loaded.</p>
                    <p>Please refresh the page or check your connection.</p>
                </div>
            `;
        }
    }

    /**
     * Navigate to a specific section
     */
    navigateToSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeMenuItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }

        this.currentSection = sectionId;

        // Load section data
        this.loadSectionData(sectionId);
    }

    /**
     * Handle tab clicks
     */
    handleTabClick(tabButton) {
        const tabId = tabButton.getAttribute('data-tab');
        const parentContainer = tabButton.closest('.content-section');

        // Update tab buttons
        parentContainer.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        tabButton.classList.add('active');

        // Update tab content
        parentContainer.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const targetContent = document.getElementById(tabId);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    }

    /**
     * Load section-specific data
     */
    async loadSectionData(sectionId) {
        try {
            switch (sectionId) {
                case 'dashboard-overview':
                    await this.loadDashboardData();
                    break;
                case 'purchase-orders-section':
                    await this.loadPurchaseOrders();
                    this.setupPurchaseOrdersEventListeners();
                    break;
                case 'purchase-invoices-section':
                    await this.loadPurchaseInvoices();
                    this.setupPurchaseInvoicesEventListeners();
                    break;
                case 'suppliers-section':
                    await this.loadSuppliers();
                    this.setupSuppliersEventListeners();
                    break;
                case 'customers-section':
                    await this.loadCustomers();
                    this.setupCustomersEventListeners();
                    break;
                case 'payments-in-section':
                    await this.loadPaymentsIn();
                    this.setupPaymentsInEventListeners();
                    break;
                case 'payments-out-section':
                    await this.loadPaymentsOut();
                    this.setupPaymentsOutEventListeners();
                    break;
                case 'expenses-section':
                    await this.loadExpenses();
                    this.setupExpensesEventListeners();
                    break;
                case 'sales-orders-section':
                    await this.loadSalesOrders();
                    this.setupSalesOrdersEventListeners();
                    break;
                case 'products-section':
                    await this.loadProducts();
                    this.setupProductsEventListeners();
                    break;
                case 'create-invoice-section':
                    // For Create Invoice, use the original invoice manager system
                    if (window.invoiceManager && window.invoiceManager.initializeForm) {
                        await window.invoiceManager.initializeForm();
                    }
                    break;
                case 'outstanding-reports-section':
                    await this.loadOutstandingReports();
                    break;
            }
        } catch (error) {
            console.error(`Error loading data for section ${sectionId}:`, error);
            this.showError(`Failed to load ${sectionId} data`);
        }
    }

    /**
     * Load dashboard overview data
     */
    async loadDashboardData() {
        try {
            // Load key metrics
            const today = new Date().toISOString().split('T')[0];
            const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

            // Get customer and supplier outstandings
            const customerOutstandings = await this.modules.payment.getAllCustomerOutstandings();
            const supplierOutstandings = await this.modules.payment.getAllSupplierOutstandings();

            const totalCustomerOutstanding = customerOutstandings.reduce((sum, c) => sum + c.outstanding_amount, 0);
            const totalSupplierPayable = supplierOutstandings.reduce((sum, s) => sum + s.outstanding_amount, 0);

            // Get bank balance
            const bankAccounts = await this.modules.payment.getActiveBankAccounts();
            const totalBankBalance = bankAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

            // Get stock value (simplified calculation)
            const products = await this.modules.database.getActiveProducts();
            const totalStockValue = products.reduce((sum, product) => {
                return sum + ((product.current_stock || 0) * (product.purchase_price || 0));
            }, 0);

            // Update dashboard metrics
            this.updateDashboardMetric('today-sales', 0); // TODO: Calculate from sales data
            this.updateDashboardMetric('month-sales', 0); // TODO: Calculate from sales data
            this.updateDashboardMetric('customer-outstanding', totalCustomerOutstanding);
            this.updateDashboardMetric('supplier-payable', totalSupplierPayable);
            this.updateDashboardMetric('bank-balance', totalBankBalance);
            this.updateDashboardMetric('stock-value', totalStockValue);

            // Load recent activities
            await this.loadRecentActivities();

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    /**
     * Update dashboard metric display
     */
    updateDashboardMetric(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = this.formatCurrency(value);
        }
    }

    /**
     * Load recent activities
     */
    async loadRecentActivities() {
        try {
            const activitiesList = document.getElementById('recent-activities-list');
            if (!activitiesList) return;

            // Get recent data from various modules
            const recentPOs = await this.modules.purchase.getAllPurchaseOrders();
            const recentExpenses = await this.modules.expense.getAllExpenses();
            const recentPaymentsIn = await this.modules.payment.getAllPaymentsIn();
            const recentPaymentsOut = await this.modules.payment.getAllPaymentsOut();

            // Combine and sort by date (simplified)
            const activities = [
                ...recentPOs.slice(0, 3).map(po => ({
                    type: 'Purchase Order',
                    description: `PO ${po.po_number} created`,
                    date: po.po_date,
                    amount: po.total_amount
                })),
                ...recentExpenses.slice(0, 3).map(exp => ({
                    type: 'Expense',
                    description: exp.description,
                    date: exp.expense_date,
                    amount: exp.amount
                })),
                ...recentPaymentsIn.slice(0, 2).map(pay => ({
                    type: 'Payment Received',
                    description: `Payment ${pay.receipt_number}`,
                    date: pay.receipt_date,
                    amount: pay.amount_received
                })),
                ...recentPaymentsOut.slice(0, 2).map(pay => ({
                    type: 'Payment Made',
                    description: `Payment ${pay.payment_number}`,
                    date: pay.payment_date,
                    amount: pay.amount_paid
                }))
            ];

            // Sort by date (most recent first)
            activities.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Display activities
            if (activities.length === 0) {
                activitiesList.innerHTML = '<p class="text-muted">No recent activities</p>';
            } else {
                activitiesList.innerHTML = activities.slice(0, 10).map(activity => `
                    <div class="activity-item">
                        <div class="activity-content">
                            <strong>${activity.type}</strong>
                            <p>${activity.description}</p>
                            <small class="text-muted">${this.formatDate(activity.date)}</small>
                        </div>
                        <div class="activity-amount">
                            ${this.formatCurrency(activity.amount)}
                        </div>
                    </div>
                `).join('');
            }

        } catch (error) {
            console.error('Error loading recent activities:', error);
        }
    }

    /**
     * Load purchase orders
     */
    async loadPurchaseOrders() {
        const container = document.getElementById('purchase-orders-list');
        if (!container) return;

        try {
            container.innerHTML = '<div class="loading">Loading purchase orders...</div>';
            
            let purchaseOrders = [];
            
            // Try multiple approaches to get purchase orders
            if (this.isDatabaseAvailable()) {
                try {
                    purchaseOrders = await this.modules.database.getAll('purchase_orders');
                } catch (error) {
                    console.log('Database manager failed for purchase orders, trying direct Firebase:', error);
                }
            }
            
            // If database manager failed, try direct Firebase access
            if (purchaseOrders.length === 0) {
                try {
                    console.log('Trying direct Firebase access for purchase orders...');
                    purchaseOrders = await this.getFirebaseData('purchase_orders');
                    console.log('Direct Firebase access successful, purchase orders:', purchaseOrders.length);
                } catch (error) {
                    console.log('Direct Firebase access failed for purchase orders:', error);
                    this.showDatabaseUnavailableError(container, 'Purchase Orders');
                    return;
                }
            }
            
            if (purchaseOrders.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fas fa-shopping-cart fa-3x"></i></div>
                        <h3>No Purchase Orders</h3>
                        <p>Create your first purchase order to get started</p>
                    </div>
                `;
                return;
            }

            // Create table
            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>PO Number</th>
                            <th>Date</th>
                            <th>Supplier</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${purchaseOrders.map(po => `
                            <tr>
                                <td><strong>${po.po_number}</strong></td>
                                <td>${this.formatDate(po.po_date)}</td>
                                <td>${po.supplier_name || 'N/A'}</td>
                                <td>${this.formatCurrency(po.total_amount || 0)}</td>
                                <td><span class="status-badge status-${po.status?.toLowerCase() || 'draft'}">${po.status || 'Draft'}</span></td>
                                <td>
                                    <button class="secondary-btn" onclick="businessController.editPurchaseOrder('${po.id}')"><i class="fas fa-edit"></i> Edit</button>
                                    <button class="secondary-btn" onclick="businessController.convertToInvoice('${po.id}')"><i class="fas fa-file-invoice"></i> Convert</button>
                                    <button class="secondary-btn" onclick="businessController.viewPurchaseOrder('${po.id}')"><i class="fas fa-eye"></i> View</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

        } catch (error) {
            console.error('Error loading purchase orders:', error);
            container.innerHTML = '<div class="text-danger">Error loading purchase orders</div>';
        }
    }

    /**
     * Show Purchase Order modal for create/edit
     */
    async showCreatePurchaseOrderModal(poId = null) {
        console.log('🚀 showCreatePurchaseOrderModal called');
        const isEdit = !!poId;
        
        // Get suppliers and products for dropdowns
        let suppliers = [];
        try {
            if (this.isDatabaseAvailable()) {
                suppliers = await this.modules.database.getAll('suppliers');
            } else {
                suppliers = await this.getFirebaseData('suppliers');
            }
        } catch (error) {
            console.error('Error loading suppliers for modal:', error);
            suppliers = [];
        }
        
        // Try to get products from multiple sources
        let products = [];
        try {
            // First try the new database system
            if (this.isDatabaseAvailable()) {
                products = await this.modules.database.getAll('products');
            } else {
                products = await this.getFirebaseData('products');
            }
            
            // If no products found, try the old stock manager
            if (products.length === 0 && window.stockManager) {
                const result = await window.stockManager.getProducts();
                if (result.success) {
                    products = result.products.map(p => ({
                        id: p.id,
                        product_name: p.name || p.product_name,
                        selling_price: p.price || p.selling_price || 0,
                        purchase_price: p.purchase_price || p.price || 0
                    }));
                }
            }
            
            // If still no products, add sample products to database
            if (products.length === 0) {
                console.log('No products found, adding sample products...');
                await this.addSampleProducts();
                // Try to get products again after adding samples
                products = await this.modules.database.getAll('products');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            products = [];
        }
        
        // Cache products for use in dynamic item rows
        this.cachedProducts = products;
        console.log('PO Modal - Cached products:', products.length, products);
        
        const modalHtml = `
            <div class="modal" id="purchase-order-modal">
                <div class="modal-content" style="max-width: 1000px;">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Edit Purchase Order' : 'Create Purchase Order'}</h3>
                        <button class="modal-close" onclick="businessController.closeModal('purchase-order-modal')"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <form id="purchase-order-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="po-supplier">Supplier *</label>
                                    <select id="po-supplier" required>
                                        <option value="">Select Supplier</option>
                                        ${suppliers.map(supplier => `
                                            <option value="${supplier.id}">${supplier.supplier_name}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="po-date">PO Date *</label>
                                    <input type="date" id="po-date" required value="${new Date().toISOString().split('T')[0]}">
                                </div>
                                <div class="form-group">
                                    <label for="po-delivery-date">Expected Delivery Date</label>
                                    <input type="date" id="po-delivery-date">
                                </div>
                            </div>
                            
                            <div class="form-section">
                                <h4>Items</h4>
                                <div id="po-items-container">
                                    <div class="item-row" data-index="0">
                                        <div class="item-fields">
                                            <div class="field-group">
                                                <label>Product</label>
                                                <select class="item-product" onchange="businessController.updateItemDetails(0, 'po')">
                                                    <option value="">Select Product</option>
                                                    ${products.map(product => `
                                                        <option value="${product.id}" data-price="${product.selling_price || 0}">${product.product_name}</option>
                                                    `).join('')}
                                                </select>
                                            </div>
                                            <div class="field-group">
                                                <label>Quantity</label>
                                                <input type="number" class="item-quantity" min="1" step="1" onchange="businessController.calculateItemTotal(0, 'po')">
                                            </div>
                                            <div class="field-group">
                                                <label>Unit Price (₹)</label>
                                                <input type="number" class="item-price" min="0" step="0.01" onchange="businessController.calculateItemTotal(0, 'po')">
                                            </div>
                                            <div class="field-group">
                                                <label>GST (%)</label>
                                                <select class="item-gst" onchange="businessController.calculateItemTotal(0, 'po')">
                                                    <option value="0">0%</option>
                                                    <option value="5">5%</option>
                                                    <option value="12">12%</option>
                                                    <option value="18" selected>18%</option>
                                                    <option value="28">28%</option>
                                                </select>
                                            </div>
                                            <div class="field-group">
                                                <label>Total (₹)</label>
                                                <input type="number" class="item-total" readonly>
                                            </div>
                                            <div class="field-group">
                                                <button type="button" onclick="businessController.removeItem(0, 'po')" class="btn btn-danger">Remove</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button type="button" id="add-po-item-btn" onclick="businessController.addPOItem()"><i class="fas fa-plus"></i> Add Item</button>
                            </div>

                            <div class="totals-section">
                                <div class="total-row">
                                    <span>Subtotal:</span>
                                    <span id="po-subtotal-display">₹0.00</span>
                                </div>
                                <div class="total-row">
                                    <span>GST:</span>
                                    <span id="po-gst-display">₹0.00</span>
                                </div>
                                <div class="total-row grand-total">
                                    <span>Grand Total:</span>
                                    <span id="po-grand-total-display">₹0.00</span>
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group full-width">
                                    <label for="po-terms">Terms & Conditions</label>
                                    <textarea id="po-terms" rows="3" placeholder="Enter terms and conditions"></textarea>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group full-width">
                                    <label for="po-notes">Notes</label>
                                    <textarea id="po-notes" rows="2" placeholder="Additional notes"></textarea>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="secondary-btn" onclick="businessController.closeModal('purchase-order-modal')"><i class="fas fa-times"></i> Cancel</button>
                        <button type="button" class="primary-btn" onclick="businessController.savePurchaseOrder('${poId || ''}')""><i class="fas fa-save"></i> ${isEdit ? 'Update' : 'Save'} Purchase Order</button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('purchase-order-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        console.log('PO Modal - Adding modal to DOM...');
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        console.log('PO Modal - Modal added, showing modal...');
        document.getElementById('purchase-order-modal').style.display = 'block';
        console.log('PO Modal - Modal should be visible now');

        // Load PO data if editing
        if (isEdit) {
            this.loadPurchaseOrderData(poId);
        }
    }

    /**
     * Show Purchase Invoice modal for create/edit
     */
    async showCreatePurchaseInvoiceModal(poId = null, invoiceId = null) {
        console.log('🚀 showCreatePurchaseInvoiceModal called');
        const isEdit = !!invoiceId;
        const isFromPO = !!poId;
        
        // Get suppliers and products for dropdowns
        let suppliers = [];
        try {
            if (this.isDatabaseAvailable()) {
                suppliers = await this.modules.database.getAll('suppliers');
            } else {
                suppliers = await this.getFirebaseData('suppliers');
            }
        } catch (error) {
            console.error('Error loading suppliers for invoice modal:', error);
            suppliers = [];
        }
        
        // Try to get products from multiple sources
        let products = [];
        try {
            // First try the new database system
            if (this.isDatabaseAvailable()) {
                products = await this.modules.database.getAll('products');
            } else {
                products = await this.getFirebaseData('products');
            }
            
            // If no products found, try the old stock manager
            if (products.length === 0 && window.stockManager) {
                const result = await window.stockManager.getProducts();
                if (result.success) {
                    products = result.products.map(p => ({
                        id: p.id,
                        product_name: p.name || p.product_name,
                        selling_price: p.price || p.selling_price || 0,
                        purchase_price: p.purchase_price || p.price || 0
                    }));
                }
            }
            
            // If still no products, add sample products to database
            if (products.length === 0) {
                console.log('No products found, adding sample products...');
                await this.addSampleProducts();
                // Try to get products again after adding samples
                products = await this.modules.database.getAll('products');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            products = [];
        }
        
        // Cache products for use in dynamic item rows
        this.cachedProducts = products;
        console.log('PI Modal - Cached products:', products.length, products);
        
        const modalHtml = `
            <div class="modal" id="purchase-invoice-modal">
                <div class="modal-content" style="max-width: 1000px;">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Edit Purchase Invoice' : 'Create Purchase Invoice'}</h3>
                        <button class="modal-close" onclick="businessController.closeModal('purchase-invoice-modal')"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <form id="purchase-invoice-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="pi-supplier">Supplier *</label>
                                    <select id="pi-supplier" required ${isFromPO ? 'disabled' : ''}>
                                        <option value="">Select Supplier</option>
                                        ${suppliers.map(supplier => `
                                            <option value="${supplier.id}">${supplier.supplier_name}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="pi-supplier-invoice">Supplier Invoice Number</label>
                                    <input type="text" id="pi-supplier-invoice" placeholder="Supplier's bill number">
                                </div>
                                <div class="form-group">
                                    <label for="pi-date">Purchase Date *</label>
                                    <input type="date" id="pi-date" required value="${new Date().toISOString().split('T')[0]}">
                                </div>
                            </div>
                            
                            ${isFromPO ? `
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Purchase Order Reference</label>
                                        <input type="text" id="pi-po-reference" readonly placeholder="Loading PO details...">
                                    </div>
                                </div>
                            ` : ''}

                            <div class="form-section">
                                <h4>Items</h4>
                                <div id="pi-items-container">
                                    <div class="item-row" data-index="0">
                                        <div class="item-fields">
                                            <div class="field-group">
                                                <label>Product</label>
                                                <select class="item-product" onchange="businessController.updateItemDetails(0, 'pi')">
                                                    <option value="">Select Product</option>
                                                    ${products.map(product => `
                                                        <option value="${product.id}" data-price="${product.purchase_price || product.selling_price || 0}">${product.product_name}</option>
                                                    `).join('')}
                                                </select>
                                            </div>
                                            <div class="field-group">
                                                <label>Quantity</label>
                                                <input type="number" class="item-quantity" min="1" step="1" onchange="businessController.calculateItemTotal(0, 'pi')">
                                            </div>
                                            <div class="field-group">
                                                <label>Unit Price (₹)</label>
                                                <input type="number" class="item-price" min="0" step="0.01" onchange="businessController.calculateItemTotal(0, 'pi')">
                                            </div>
                                            <div class="field-group">
                                                <label>Discount (₹)</label>
                                                <input type="number" class="item-discount" min="0" step="0.01" onchange="businessController.calculateItemTotal(0, 'pi')">
                                            </div>
                                            <div class="field-group">
                                                <label>GST (%)</label>
                                                <select class="item-gst" onchange="businessController.calculateItemTotal(0, 'pi')">
                                                    <option value="0">0%</option>
                                                    <option value="5">5%</option>
                                                    <option value="12">12%</option>
                                                    <option value="18" selected>18%</option>
                                                    <option value="28">28%</option>
                                                </select>
                                            </div>
                                            <div class="field-group">
                                                <label>Total (₹)</label>
                                                <input type="number" class="item-total" readonly>
                                            </div>
                                            <div class="field-group">
                                                <button type="button" onclick="businessController.removeItem(0, 'pi')" class="btn btn-danger">Remove</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button type="button" id="add-pi-item-btn" onclick="businessController.addPIItem()"><i class="fas fa-plus"></i> Add Item</button>
                            </div>

                            <div class="totals-section">
                                <div class="total-row">
                                    <span>Subtotal:</span>
                                    <span id="pi-subtotal-display">₹0.00</span>
                                </div>
                                <div class="total-row">
                                    <span>Discount:</span>
                                    <span id="pi-discount-display">₹0.00</span>
                                </div>
                                <div class="total-row">
                                    <span>GST:</span>
                                    <span id="pi-gst-display">₹0.00</span>
                                </div>
                                <div class="total-row">
                                    <span>Round Off:</span>
                                    <input type="number" id="pi-round-off" step="0.01" value="0" onchange="businessController.calculatePITotals()" style="width: 80px; text-align: right;">
                                </div>
                                <div class="total-row grand-total">
                                    <span>Grand Total:</span>
                                    <span id="pi-grand-total-display">₹0.00</span>
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="pi-payment-terms">Payment Terms (Days)</label>
                                    <input type="number" id="pi-payment-terms" min="0" placeholder="30">
                                </div>
                                <div class="form-group">
                                    <label for="pi-due-date">Due Date</label>
                                    <input type="date" id="pi-due-date">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group full-width">
                                    <label for="pi-notes">Notes</label>
                                    <textarea id="pi-notes" rows="2" placeholder="Additional notes"></textarea>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="secondary-btn" onclick="businessController.closeModal('purchase-invoice-modal')"><i class="fas fa-times"></i> Cancel</button>
                        <button type="button" class="primary-btn" onclick="businessController.savePurchaseInvoice('${invoiceId || ''}', '${poId || ''}')""><i class="fas fa-save"></i> ${isEdit ? 'Update' : 'Save'} Invoice</button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('purchase-invoice-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        console.log('PI Modal - Adding modal to DOM...');
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        console.log('PI Modal - Modal added, showing modal...');
        document.getElementById('purchase-invoice-modal').style.display = 'block';
        console.log('PI Modal - Modal should be visible now');

        // Load data if editing or from PO
        if (isEdit) {
            this.loadPurchaseInvoiceData(invoiceId);
        } else if (isFromPO) {
            this.loadPODataToInvoice(poId);
        }
    }

    /**
     * Load PO data into Purchase Invoice form
     */
    async loadPODataToInvoice(poId) {
        try {
            const po = await this.modules.database.getById('purchase_orders', poId);
            if (!po) {
                this.showError('Purchase Order not found');
                return;
            }

            // Pre-fill supplier
            document.getElementById('pi-supplier').value = po.supplier_id;
            
            // Set PO reference
            const poRefField = document.getElementById('pi-po-reference');
            if (poRefField) {
                poRefField.value = po.po_number || 'PO-' + poId.substring(0, 8);
            }

            // Load PO items if they exist
            if (po.items && po.items.length > 0) {
                const itemsContainer = document.getElementById('pi-items-container');
                itemsContainer.innerHTML = ''; // Clear existing items

                po.items.forEach((item, index) => {
                    const itemHtml = `
                        <div class="item-row" data-index="${index}">
                            <div class="item-fields">
                                <div class="field-group">
                                    <label>Product</label>
                                    <select class="item-product" onchange="businessController.updateItemDetails(${index}, 'pi')">
                                        <option value="">Select Product</option>
                                        ${this.cachedProducts.map(product => `
                                            <option value="${product.id}" ${product.id === item.product_id ? 'selected' : ''} data-price="${product.purchase_price || product.selling_price || 0}">${product.product_name}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="field-group">
                                    <label>Quantity</label>
                                    <input type="number" class="item-quantity" min="1" step="1" value="${item.quantity}" onchange="businessController.calculateItemTotal(${index}, 'pi')">
                                </div>
                                <div class="field-group">
                                    <label>Unit Price (₹)</label>
                                    <input type="number" class="item-price" min="0" step="0.01" value="${item.unit_price}" onchange="businessController.calculateItemTotal(${index}, 'pi')">
                                </div>
                                <div class="field-group">
                                    <label>Discount (₹)</label>
                                    <input type="number" class="item-discount" min="0" step="0.01" value="0" onchange="businessController.calculateItemTotal(${index}, 'pi')">
                                </div>
                                <div class="field-group">
                                    <label>GST (%)</label>
                                    <select class="item-gst" onchange="businessController.calculateItemTotal(${index}, 'pi')">
                                        <option value="0" ${item.gst_rate === 0 ? 'selected' : ''}>0%</option>
                                        <option value="5" ${item.gst_rate === 5 ? 'selected' : ''}>5%</option>
                                        <option value="12" ${item.gst_rate === 12 ? 'selected' : ''}>12%</option>
                                        <option value="18" ${item.gst_rate === 18 ? 'selected' : ''}>18%</option>
                                        <option value="28" ${item.gst_rate === 28 ? 'selected' : ''}>28%</option>
                                    </select>
                                </div>
                                <div class="field-group">
                                    <label>Total (₹)</label>
                                    <input type="number" class="item-total" readonly value="${item.total_amount}">
                                </div>
                                <div class="field-group">
                                    <button type="button" onclick="businessController.removeItem(${index}, 'pi')" class="btn btn-danger">Remove</button>
                                </div>
                            </div>
                        </div>
                    `;
                    itemsContainer.insertAdjacentHTML('beforeend', itemHtml);
                });

                // Recalculate totals
                setTimeout(() => this.calculatePITotals(), 100);
            }

        } catch (error) {
            console.error('Error loading PO data:', error);
            this.showError('Error loading Purchase Order data');
        }
    }

    showAddCustomerModal() {
        this.showCustomerModal();
    }

    showRecordPaymentInModal() {
        alert('Record Payment In modal - To be implemented');
    }

    showMakePaymentOutModal() {
        alert('Make Payment Out modal - To be implemented');
    }

    async loadSuppliers() {
        const container = document.getElementById('suppliers-list');
        if (!container) return;

        try {
            container.innerHTML = '<div class="loading">Loading suppliers...</div>';
            
            let suppliers = [];
            
            // Try multiple approaches to get suppliers
            if (this.isDatabaseAvailable()) {
                try {
                    suppliers = await this.modules.database.getAll('suppliers');
                } catch (error) {
                    console.log('Database manager failed for suppliers, trying direct Firebase:', error);
                }
            }
            
            // If database manager failed, try direct Firebase access
            if (suppliers.length === 0) {
                try {
                    console.log('Trying direct Firebase access for suppliers...');
                    suppliers = await this.getFirebaseData('suppliers');
                    console.log('Direct Firebase access successful, suppliers:', suppliers.length);
                } catch (error) {
                    console.log('Direct Firebase access failed for suppliers:', error);
                    this.showDatabaseUnavailableError(container, 'Suppliers');
                    return;
                }
            }
            
            if (suppliers.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fas fa-building fa-3x"></i></div>
                        <h3>No Suppliers</h3>
                        <p>Add your first supplier to get started</p>
                    </div>
                `;
                return;
            }

            // Create table
            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Supplier Code</th>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>GST Number</th>
                            <th>Outstanding</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${suppliers.map(supplier => `
                            <tr>
                                <td><strong>${supplier.supplier_code || 'N/A'}</strong></td>
                                <td>
                                    <strong>${supplier.supplier_name}</strong>
                                    <br><small class="text-muted">${supplier.contact_person || ''}</small>
                                </td>
                                <td>
                                    ${supplier.phone || 'N/A'}
                                    <br><small class="text-muted">${supplier.email || ''}</small>
                                </td>
                                <td>${supplier.gstin || 'N/A'}</td>
                                <td class="text-danger">${this.formatCurrency(supplier.outstanding_amount || 0)}</td>
                                <td>
                                    <button class="secondary-btn" onclick="businessController.editSupplier('${supplier.id}')"><i class="fas fa-edit"></i> Edit</button>
                                    <button class="secondary-btn" onclick="businessController.viewSupplierLedger('${supplier.id}')"><i class="fas fa-book"></i> Ledger</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

        } catch (error) {
            console.error('Error loading suppliers:', error);
            container.innerHTML = '<div class="text-danger">Error loading suppliers</div>';
        }
    }

    async loadCustomers() {
        const container = document.getElementById('customers-list');
        if (!container) return;

        try {
            container.innerHTML = '<div class="loading">Loading customers...</div>';
            
            let customers = [];
            
            // Try multiple approaches to get customers
            if (this.isDatabaseAvailable()) {
                try {
                    customers = await this.modules.database.getAll('customers');
                } catch (error) {
                    console.log('Database manager failed for customers, trying direct Firebase:', error);
                }
            }
            
            // If database manager failed, try direct Firebase access
            if (customers.length === 0) {
                try {
                    console.log('Trying direct Firebase access for customers...');
                    customers = await this.getFirebaseData('customers');
                    console.log('Direct Firebase access successful, customers:', customers.length);
                } catch (error) {
                    console.log('Direct Firebase access failed for customers:', error);
                    this.showDatabaseUnavailableError(container, 'Customers');
                    return;
                }
            }
            
            if (customers.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fas fa-users fa-3x"></i></div>
                        <h3>No Customers</h3>
                        <p>Add your first customer to get started</p>
                    </div>
                `;
                return;
            }

            // Create table
            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Customer Code</th>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>GST Number</th>
                            <th>Outstanding</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customers.map(customer => `
                            <tr>
                                <td>${customer.customer_code || 'N/A'}</td>
                                <td>
                                    <strong>${customer.name}</strong>
                                    <br><small class="text-muted">${customer.email || ''}</small>
                                </td>
                                <td>
                                    ${customer.phone || 'N/A'}
                                    <br><small class="text-muted">${customer.address ? customer.address.substring(0, 30) + '...' : ''}</small>
                                </td>
                                <td>${customer.gst_number || 'N/A'}</td>
                                <td class="text-success">${this.formatCurrency(customer.outstanding_amount || 0)}</td>
                                <td>
                                    <button class="secondary-btn" onclick="businessController.editCustomer('${customer.id}')"><i class="fas fa-edit"></i> Edit</button>
                                    <button class="secondary-btn" onclick="businessController.viewCustomerLedger('${customer.id}')"><i class="fas fa-book"></i> Ledger</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

        } catch (error) {
            console.error('Error loading customers:', error);
            container.innerHTML = '<div class="text-danger">Error loading customers</div>';
        }
    }

    async loadPaymentsIn() {
        const container = document.getElementById('payments-in-list');
        if (container) {
            container.innerHTML = '<div class="loading">Loading payments...</div>';
            // TODO: Implement full loading logic
        }
    }

    async loadPaymentsOut() {
        const container = document.getElementById('payments-out-list');
        if (container) {
            container.innerHTML = '<div class="loading">Loading payments...</div>';
            // TODO: Implement full loading logic
        }
    }

    async loadPurchaseInvoices() {
        const container = document.getElementById('purchase-invoices-list');
        if (!container) return;

        try {
            container.innerHTML = '<div class="loading">Loading purchase invoices...</div>';
            
            let purchaseInvoices = [];
            
            // Try multiple approaches to get purchase invoices
            if (this.isDatabaseAvailable()) {
                try {
                    purchaseInvoices = await this.modules.database.getAll('purchase_invoices');
                } catch (error) {
                    console.log('Database manager failed for purchase invoices, trying direct Firebase:', error);
                }
            }
            
            // If database manager failed, try direct Firebase access
            if (purchaseInvoices.length === 0) {
                try {
                    console.log('Trying direct Firebase access for purchase invoices...');
                    purchaseInvoices = await this.getFirebaseData('purchase_invoices');
                    console.log('Direct Firebase access successful, purchase invoices:', purchaseInvoices.length);
                } catch (error) {
                    console.log('Direct Firebase access failed for purchase invoices:', error);
                    this.showDatabaseUnavailableError(container, 'Purchase Invoices');
                    return;
                }
            }
            
            if (purchaseInvoices.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fas fa-file-invoice-dollar fa-3x"></i></div>
                        <h3>No Purchase Invoices</h3>
                        <p>Create your first purchase invoice to get started</p>
                    </div>
                `;
                return;
            }

            // Create table
            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Invoice Number</th>
                            <th>Date</th>
                            <th>Supplier</th>
                            <th>Total Amount</th>
                            <th>Payment Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${purchaseInvoices.map(invoice => `
                            <tr>
                                <td><strong>${invoice.purchase_invoice_number}</strong><br><small class="text-muted">${invoice.supplier_invoice_number || 'N/A'}</small></td>
                                <td>${this.formatDate(invoice.purchase_date)}</td>
                                <td>${invoice.supplier_name || 'N/A'}</td>
                                <td>${this.formatCurrency(invoice.total_amount || 0)}</td>
                                <td><span class="status-badge status-${invoice.payment_status?.toLowerCase() || 'unpaid'}">${invoice.payment_status || 'Unpaid'}</span></td>
                                <td>
                                    <button class="secondary-btn" onclick="businessController.editPurchaseInvoice('${invoice.id}')"><i class="fas fa-edit"></i> Edit</button>
                                    <button class="secondary-btn" onclick="businessController.viewPurchaseInvoice('${invoice.id}')"><i class="fas fa-eye"></i> View</button>
                                    <button class="secondary-btn" onclick="businessController.createDebitNote('${invoice.id}')"><i class="fas fa-undo"></i> Return</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

        } catch (error) {
            console.error('Error loading purchase invoices:', error);
            container.innerHTML = '<div class="text-danger">Error loading purchase invoices</div>';
        }
    }

    async loadOutstandingReports() {
        // Load customer outstanding
        const customerContainer = document.getElementById('customer-outstanding-list');
        if (customerContainer) {
            customerContainer.innerHTML = '<div class="loading">Loading customer outstanding...</div>';
            // TODO: Implement full loading logic
        }

        // Load supplier outstanding
        const supplierContainer = document.getElementById('supplier-outstanding-list');
        if (supplierContainer) {
            supplierContainer.innerHTML = '<div class="loading">Loading supplier outstanding...</div>';
            // TODO: Implement full loading logic
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount || 0);
    }

    formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-IN');
    }

    showError(message) {
        console.error(message);
        // TODO: Implement proper error display
        alert(message);
    }

    showSuccess(message) {
        console.log(message);
        // TODO: Implement proper success display
        alert(message);
    }

    /**
     * Show customer modal for add/edit
     */
    showCustomerModal(customerId = null) {
        const isEdit = !!customerId;
        const modalHtml = `
            <div class="modal" id="customer-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Edit Customer' : 'Add New Customer'}</h3>
                        <button class="modal-close" onclick="businessController.closeModal('customer-modal')"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <form id="customer-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customer-name">Customer Name *</label>
                                    <input type="text" id="customer-name" required>
                                </div>
                                <div class="form-group">
                                    <label for="customer-email">Email</label>
                                    <input type="email" id="customer-email">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customer-phone">Phone</label>
                                    <input type="tel" id="customer-phone">
                                </div>
                                <div class="form-group">
                                    <label for="customer-gst">GST Number</label>
                                    <input type="text" id="customer-gst" placeholder="22AAAAA0000A1Z5">
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="customer-address">Address</label>
                                <textarea id="customer-address" rows="3"></textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customer-city">City</label>
                                    <input type="text" id="customer-city">
                                </div>
                                <div class="form-group">
                                    <label for="customer-state">State</label>
                                    <input type="text" id="customer-state">
                                </div>
                                <div class="form-group">
                                    <label for="customer-pincode">Pincode</label>
                                    <input type="text" id="customer-pincode">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="customer-credit-limit">Credit Limit</label>
                                    <input type="number" id="customer-credit-limit" min="0" step="0.01" placeholder="0.00">
                                </div>
                                <div class="form-group">
                                    <label for="customer-credit-days">Credit Days</label>
                                    <input type="number" id="customer-credit-days" min="0" placeholder="30">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="secondary-btn" onclick="businessController.closeModal('customer-modal')"><i class="fas fa-times"></i> Cancel</button>
                        <button type="button" class="primary-btn" onclick="businessController.saveCustomer('${customerId || ''}')"><i class="fas fa-save"></i> ${isEdit ? 'Update' : 'Save'} Customer</button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('customer-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        document.getElementById('customer-modal').style.display = 'block';

        // Load customer data if editing
        if (isEdit) {
            this.loadCustomerForEdit(customerId);
        }
    }

    /**
     * Load customer data for editing
     */
    async loadCustomerForEdit(customerId) {
        try {
            const customer = await this.modules.database.getById('customers', customerId);
            if (customer) {
                document.getElementById('customer-name').value = customer.name || '';
                document.getElementById('customer-email').value = customer.email || '';
                document.getElementById('customer-phone').value = customer.phone || '';
                document.getElementById('customer-gst').value = customer.gst_number || '';
                document.getElementById('customer-address').value = customer.address || '';
                document.getElementById('customer-city').value = customer.city || '';
                document.getElementById('customer-state').value = customer.state || '';
                document.getElementById('customer-pincode').value = customer.pincode || '';
                document.getElementById('customer-credit-limit').value = customer.credit_limit || '';
                document.getElementById('customer-credit-days').value = customer.credit_days || '';
            }
        } catch (error) {
            console.error('Error loading customer for edit:', error);
            this.showError('Error loading customer data');
        }
    }

    /**
     * Save customer (add or update)
     */
    async saveCustomer(customerId = '') {
        try {
            const form = document.getElementById('customer-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const customerData = {
                name: document.getElementById('customer-name').value.trim(),
                email: document.getElementById('customer-email').value.trim(),
                phone: document.getElementById('customer-phone').value.trim(),
                gst_number: document.getElementById('customer-gst').value.trim(),
                address: document.getElementById('customer-address').value.trim(),
                city: document.getElementById('customer-city').value.trim(),
                state: document.getElementById('customer-state').value.trim(),
                pincode: document.getElementById('customer-pincode').value.trim(),
                credit_limit: parseFloat(document.getElementById('customer-credit-limit').value) || 0,
                credit_days: parseInt(document.getElementById('customer-credit-days').value) || 30,
                outstanding_amount: 0
            };

            if (customerId) {
                // Update existing customer
                await this.modules.database.update('customers', customerId, customerData);
                this.showSuccess('Customer updated successfully');
            } else {
                // Add new customer - generate customer code
                const counter = await this.modules.database.getNextCounter('customers');
                customerData.customer_code = `CUS${counter.toString().padStart(3, '0')}`;
                
                await this.modules.database.add('customers', customerData);
                this.showSuccess('Customer added successfully');
            }

            this.closeModal('customer-modal');
            await this.loadCustomers();

        } catch (error) {
            console.error('Error saving customer:', error);
            this.showError('Error saving customer');
        }
    }

    /**
     * Edit customer
     */
    editCustomer(customerId) {
        this.showCustomerModal(customerId);
    }

    /**
     * View customer ledger
     */
    async viewCustomerLedger(customerId) {
        try {
            const customer = await this.modules.database.getById('customers', customerId);
            if (!customer) {
                this.showError('Customer not found');
                return;
            }

            // Get customer transactions (invoices, payments, etc.)
            const transactions = await this.modules.payment.getCustomerLedger(customerId);
            
            const modalHtml = `
                <div class="modal" id="customer-ledger-modal">
                    <div class="modal-content" style="max-width: 900px;">
                        <div class="modal-header">
                            <h3>Customer Ledger - ${customer.name}</h3>
                            <button class="modal-close" onclick="businessController.closeModal('customer-ledger-modal')"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="modal-body">
                            <div class="customer-info mb-3">
                                <p><strong>Customer Code:</strong> ${customer.customer_code}</p>
                                <p><strong>Outstanding Amount:</strong> ${this.formatCurrency(customer.outstanding_amount || 0)}</p>
                            </div>
                            <div id="customer-transactions">
                                ${transactions.length === 0 ? 
                                    '<p class="text-muted">No transactions found</p>' :
                                    `<table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Type</th>
                                                <th>Reference</th>
                                                <th>Debit</th>
                                                <th>Credit</th>
                                                <th>Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${transactions.map(txn => `
                                                <tr>
                                                    <td>${this.formatDate(txn.date)}</td>
                                                    <td>${txn.type}</td>
                                                    <td>${txn.reference}</td>
                                                    <td class="text-danger">${txn.debit ? this.formatCurrency(txn.debit) : ''}</td>
                                                    <td class="text-success">${txn.credit ? this.formatCurrency(txn.credit) : ''}</td>
                                                    <td>${this.formatCurrency(txn.balance)}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>`
                                }
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="secondary-btn" onclick="businessController.closeModal('customer-ledger-modal')"><i class="fas fa-times"></i> Close</button>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal if any
            const existingModal = document.getElementById('customer-ledger-modal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            document.getElementById('customer-ledger-modal').style.display = 'block';

        } catch (error) {
            console.error('Error viewing customer ledger:', error);
            this.showError('Error loading customer ledger');
        }
    }

    /**
     * Show supplier modal for add/edit
     */
    showSupplierModal(supplierId = null) {
        console.log('🚀 showSupplierModal called');
        const isEdit = !!supplierId;
        const modalHtml = `
            <div class="modal" id="supplier-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Edit Supplier' : 'Add New Supplier'}</h3>
                        <button class="modal-close" onclick="businessController.closeModal('supplier-modal')"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <form id="supplier-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="supplier-name">Supplier Name *</label>
                                    <input type="text" id="supplier-name" required>
                                </div>
                                <div class="form-group">
                                    <label for="supplier-contact-person">Contact Person</label>
                                    <input type="text" id="supplier-contact-person">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="supplier-email">Email</label>
                                    <input type="email" id="supplier-email">
                                </div>
                                <div class="form-group">
                                    <label for="supplier-phone">Phone</label>
                                    <input type="tel" id="supplier-phone">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="supplier-gstin">GST Number</label>
                                    <input type="text" id="supplier-gstin" placeholder="22AAAAA0000A1Z5">
                                </div>
                                <div class="form-group">
                                    <label for="supplier-pan">PAN Number</label>
                                    <input type="text" id="supplier-pan" placeholder="AAAAA0000A">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group full-width">
                                    <label for="supplier-address">Address</label>
                                    <textarea id="supplier-address" rows="3"></textarea>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="supplier-city">City</label>
                                    <input type="text" id="supplier-city">
                                </div>
                                <div class="form-group">
                                    <label for="supplier-state">State</label>
                                    <input type="text" id="supplier-state">
                                </div>
                                <div class="form-group">
                                    <label for="supplier-pincode">Pincode</label>
                                    <input type="text" id="supplier-pincode">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="supplier-payment-terms">Payment Terms (Days)</label>
                                    <input type="number" id="supplier-payment-terms" min="0" placeholder="30">
                                </div>
                                <div class="form-group">
                                    <label for="supplier-credit-limit">Credit Limit (₹)</label>
                                    <input type="number" id="supplier-credit-limit" min="0" step="0.01" placeholder="0.00">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="secondary-btn" onclick="businessController.closeModal('supplier-modal')"><i class="fas fa-times"></i> Cancel</button>
                        <button type="button" class="primary-btn" onclick="businessController.saveSupplier('${supplierId || ''}')""><i class="fas fa-save"></i> ${isEdit ? 'Update' : 'Save'} Supplier</button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('supplier-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.getElementById('supplier-modal').style.display = 'block';

        // Load supplier data if editing
        if (isEdit) {
            this.loadSupplierData(supplierId);
        }
    }

    /**
     * Load supplier data for editing
     */
    async loadSupplierData(supplierId) {
        try {
            const supplier = await this.modules.database.getById('suppliers', supplierId);
            if (supplier) {
                document.getElementById('supplier-name').value = supplier.supplier_name || '';
                document.getElementById('supplier-contact-person').value = supplier.contact_person || '';
                document.getElementById('supplier-email').value = supplier.email || '';
                document.getElementById('supplier-phone').value = supplier.phone || '';
                document.getElementById('supplier-gstin').value = supplier.gstin || '';
                document.getElementById('supplier-pan').value = supplier.pan || '';
                document.getElementById('supplier-address').value = supplier.address || '';
                document.getElementById('supplier-city').value = supplier.city || '';
                document.getElementById('supplier-state').value = supplier.state || '';
                document.getElementById('supplier-pincode').value = supplier.pincode || '';
                document.getElementById('supplier-payment-terms').value = supplier.payment_terms || '';
                document.getElementById('supplier-credit-limit').value = supplier.credit_limit || '';
            }
        } catch (error) {
            console.error('Error loading supplier data:', error);
            this.showError('Error loading supplier data');
        }
    }

    /**
     * Save supplier data
     */
    async saveSupplier(supplierId = '') {
        try {
            const supplierData = {
                supplier_name: document.getElementById('supplier-name').value.trim(),
                contact_person: document.getElementById('supplier-contact-person').value.trim(),
                email: document.getElementById('supplier-email').value.trim(),
                phone: document.getElementById('supplier-phone').value.trim(),
                gstin: document.getElementById('supplier-gstin').value.trim(),
                pan: document.getElementById('supplier-pan').value.trim(),
                address: document.getElementById('supplier-address').value.trim(),
                city: document.getElementById('supplier-city').value.trim(),
                state: document.getElementById('supplier-state').value.trim(),
                pincode: document.getElementById('supplier-pincode').value.trim(),
                payment_terms: parseInt(document.getElementById('supplier-payment-terms').value) || 30,
                credit_limit: parseFloat(document.getElementById('supplier-credit-limit').value) || 0,
                is_active: true
            };

            // Validation
            if (!supplierData.supplier_name) {
                this.showError('Supplier name is required');
                return;
            }

            let result;
            if (supplierId) {
                // Update existing supplier
                result = await this.modules.database.update('suppliers', supplierId, supplierData);
                this.showSuccess('Supplier updated successfully');
            } else {
                // Add new supplier
                result = await this.modules.database.add('suppliers', supplierData);
                this.showSuccess('Supplier added successfully');
            }

            // Close modal and refresh list
            this.closeModal('supplier-modal');
            this.loadSuppliers();

        } catch (error) {
            console.error('Error saving supplier:', error);
            this.showError('Error saving supplier');
        }
    }

    /**
     * Edit supplier
     */
    editSupplier(supplierId) {
        this.showSupplierModal(supplierId);
    }

    /**
     * View supplier ledger
     */
    async viewSupplierLedger(supplierId) {
        try {
            const supplier = await this.modules.database.getById('suppliers', supplierId);
            if (!supplier) {
                this.showError('Supplier not found');
                return;
            }

            // Get supplier transactions (invoices, payments, etc.)
            const transactions = await this.modules.payment.getSupplierLedger(supplierId);
            
            const modalHtml = `
                <div class="modal" id="supplier-ledger-modal">
                    <div class="modal-content" style="max-width: 900px;">
                        <div class="modal-header">
                            <h3>Supplier Ledger - ${supplier.supplier_name}</h3>
                            <button class="modal-close" onclick="businessController.closeModal('supplier-ledger-modal')"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="modal-body">
                            <div class="supplier-info mb-3">
                                <p><strong>Supplier Code:</strong> ${supplier.supplier_code}</p>
                                <p><strong>Outstanding Amount:</strong> ${this.formatCurrency(supplier.outstanding_amount || 0)}</p>
                            </div>
                            <div id="supplier-transactions">
                                ${transactions.length === 0 ? 
                                    '<p class="text-muted">No transactions found</p>' :
                                    `<table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Description</th>
                                                <th>Debit</th>
                                                <th>Credit</th>
                                                <th>Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${transactions.map(txn => `
                                                <tr>
                                                    <td>${this.formatDate(txn.transaction_date)}</td>
                                                    <td>${txn.description}</td>
                                                    <td class="text-danger">${txn.debit ? this.formatCurrency(txn.debit) : ''}</td>
                                                    <td class="text-success">${txn.credit ? this.formatCurrency(txn.credit) : ''}</td>
                                                    <td>${this.formatCurrency(txn.balance)}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>`
                                }
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="secondary-btn" onclick="businessController.closeModal('supplier-ledger-modal')"><i class="fas fa-times"></i> Close</button>
                        </div>
                    </div>
                </div>
            `;

            // Remove existing modal if any
            const existingModal = document.getElementById('supplier-ledger-modal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            document.getElementById('supplier-ledger-modal').style.display = 'block';

        } catch (error) {
            console.error('Error viewing supplier ledger:', error);
            this.showError('Error loading supplier ledger');
        }
    }

    /**
     * Add new item to Purchase Order
     */
    addPOItem() {
        const container = document.getElementById('po-items-container');
        const itemCount = container.children.length;
        
        const products = this.cachedProducts || [];
        console.log('Adding PO item, cached products:', products.length, products);
        
        const itemHtml = `
            <div class="item-row" data-index="${itemCount}">
                <div class="item-fields">
                    <div class="field-group">
                        <label>Product</label>
                        <select class="item-product" onchange="businessController.updateItemDetails(${itemCount}, 'po')">
                            <option value="">Select Product</option>
                            ${products.map(product => `
                                <option value="${product.id}" data-price="${product.selling_price || 0}">${product.product_name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="field-group">
                        <label>Quantity</label>
                        <input type="number" class="item-quantity" min="1" step="1" onchange="businessController.calculateItemTotal(${itemCount}, 'po')">
                    </div>
                    <div class="field-group">
                        <label>Unit Price (₹)</label>
                        <input type="number" class="item-price" min="0" step="0.01" onchange="businessController.calculateItemTotal(${itemCount}, 'po')">
                    </div>
                    <div class="field-group">
                        <label>GST (%)</label>
                        <select class="item-gst" onchange="businessController.calculateItemTotal(${itemCount}, 'po')">
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18" selected>18%</option>
                            <option value="28">28%</option>
                        </select>
                    </div>
                    <div class="field-group">
                        <label>Total (₹)</label>
                        <input type="number" class="item-total" readonly>
                    </div>
                    <div class="field-group">
                        <button type="button" onclick="businessController.removeItem(${itemCount}, 'po')" class="btn btn-danger">Remove</button>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', itemHtml);
    }

    /**
     * Remove item from form
     */
    removeItem(index, type) {
        const container = document.getElementById(`${type}-items-container`);
        const itemRow = container.querySelector(`[data-index="${index}"]`);
        if (itemRow) {
            itemRow.remove();
            this.calculatePOTotals();
        }
    }

    /**
     * Update item details when product is selected
     */
    updateItemDetails(index, type) {
        const container = document.getElementById(`${type}-items-container`);
        const itemRow = container.querySelector(`[data-index="${index}"]`);
        const productSelect = itemRow.querySelector('.item-product');
        const priceInput = itemRow.querySelector('.item-price');
        
        const selectedOption = productSelect.options[productSelect.selectedIndex];
        if (selectedOption && selectedOption.dataset.price) {
            priceInput.value = selectedOption.dataset.price;
            this.calculateItemTotal(index, type);
        }
    }

    /**
     * Calculate item total
     */
    calculateItemTotal(index, type) {
        const container = document.getElementById(`${type}-items-container`);
        const itemRow = container.querySelector(`[data-index="${index}"]`);
        
        const quantity = parseFloat(itemRow.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(itemRow.querySelector('.item-price').value) || 0;
        const gstRate = parseFloat(itemRow.querySelector('.item-gst').value) || 0;
        
        let total;
        if (type === 'pi') {
            // Purchase Invoice calculation includes discount
            const discount = parseFloat(itemRow.querySelector('.item-discount').value) || 0;
            const subtotal = quantity * price;
            const discountedAmount = subtotal - discount;
            const gstAmount = (discountedAmount * gstRate) / 100;
            total = discountedAmount + gstAmount;
        } else {
            // Purchase Order calculation (no discount field)
            const subtotal = quantity * price;
            const gstAmount = (subtotal * gstRate) / 100;
            total = subtotal + gstAmount;
        }
        
        itemRow.querySelector('.item-total').value = total.toFixed(2);
        
        if (type === 'po') {
            this.calculatePOTotals();
        } else if (type === 'pi') {
            this.calculatePITotals();
        } else if (type === 'so') {
            this.calculateSOTotals();
        }
    }

    /**
     * Calculate Purchase Order totals
     */
    calculatePOTotals() {
        const container = document.getElementById('po-items-container');
        const itemRows = container.querySelectorAll('.item-row');
        
        let subtotal = 0;
        let gstTotal = 0;
        
        itemRows.forEach(row => {
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            const gstRate = parseFloat(row.querySelector('.item-gst').value) || 0;
            
            const itemSubtotal = quantity * price;
            const itemGst = (itemSubtotal * gstRate) / 100;
            
            subtotal += itemSubtotal;
            gstTotal += itemGst;
        });
        
        const grandTotal = subtotal + gstTotal;
        
        document.getElementById('po-subtotal-display').textContent = this.formatCurrency(subtotal);
        document.getElementById('po-gst-display').textContent = this.formatCurrency(gstTotal);
        document.getElementById('po-grand-total-display').textContent = this.formatCurrency(grandTotal);
    }

    /**
     * Save Purchase Order
     */
    async savePurchaseOrder(poId = '') {
        try {
            // Collect form data
            const poData = {
                supplier_id: document.getElementById('po-supplier').value,
                po_date: document.getElementById('po-date').value,
                expected_delivery_date: document.getElementById('po-delivery-date').value,
                terms_conditions: document.getElementById('po-terms').value.trim(),
                notes: document.getElementById('po-notes').value.trim(),
                status: 'Draft'
            };

            // Validation
            if (!poData.supplier_id) {
                this.showError('Please select a supplier');
                return;
            }

            if (!poData.po_date) {
                this.showError('Please select PO date');
                return;
            }

            // Collect items
            const itemsContainer = document.getElementById('po-items-container');
            const itemRows = itemsContainer.querySelectorAll('.item-row');
            const items = [];
            
            let hasValidItems = false;
            itemRows.forEach((row, index) => {
                const productId = row.querySelector('.item-product').value;
                const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
                const price = parseFloat(row.querySelector('.item-price').value) || 0;
                const gstRate = parseFloat(row.querySelector('.item-gst').value) || 0;
                
                if (productId && quantity > 0 && price > 0) {
                    hasValidItems = true;
                    const subtotal = quantity * price;
                    const gstAmount = (subtotal * gstRate) / 100;
                    const total = subtotal + gstAmount;
                    
                    items.push({
                        product_id: productId,
                        quantity: quantity,
                        unit_price: price,
                        gst_rate: gstRate,
                        subtotal: subtotal,
                        gst_amount: gstAmount,
                        total_amount: total
                    });
                }
            });

            if (!hasValidItems) {
                this.showError('Please add at least one valid item');
                return;
            }

            // Calculate totals
            const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
            const gstTotal = items.reduce((sum, item) => sum + item.gst_amount, 0);
            const grandTotal = subtotal + gstTotal;

            poData.subtotal = subtotal;
            poData.tax_amount = gstTotal;
            poData.total_amount = grandTotal;
            poData.items = items;

            let result;
            if (poId) {
                // Update existing PO
                result = await this.modules.database.update('purchase_orders', poId, poData);
                this.showSuccess('Purchase Order updated successfully');
            } else {
                // Generate PO number for new PO
                const poNumber = await this.generatePONumber();
                poData.po_number = poNumber;
                
                // Get supplier name for display
                const supplier = await this.modules.database.getById('suppliers', poData.supplier_id);
                if (supplier) {
                    poData.supplier_name = supplier.supplier_name;
                }
                
                // Create new PO
                result = await this.modules.database.add('purchase_orders', poData);
                this.showSuccess('Purchase Order created successfully');
            }

            // Close modal and refresh list
            this.closeModal('purchase-order-modal');
            this.loadPurchaseOrders();

        } catch (error) {
            console.error('Error saving purchase order:', error);
            this.showError('Error saving purchase order');
        }
    }

    /**
     * Edit Purchase Order
     */
    editPurchaseOrder(poId) {
        this.showCreatePurchaseOrderModal(poId);
    }

    /**
     * Convert PO to Invoice
     */
    async convertToInvoice(poId) {
        try {
            const po = await this.modules.database.getById('purchase_orders', poId);
            if (!po) {
                this.showError('Purchase Order not found');
                return;
            }

            if (po.status === 'Completed') {
                this.showError('This Purchase Order has already been converted to invoice');
                return;
            }

            // Show purchase invoice modal with PO data pre-filled
            this.showCreatePurchaseInvoiceModal(poId);

        } catch (error) {
            console.error('Error converting PO to invoice:', error);
            this.showError('Error converting Purchase Order to invoice');
        }
    }

    /**
     * View Purchase Order details
     */
    async viewPurchaseOrder(poId) {
        try {
            const po = await this.modules.database.getById('purchase_orders', poId);
            if (!po) {
                this.showError('Purchase Order not found');
                return;
            }

            // TODO: Implement PO view modal
            alert(`View PO: ${po.po_number} - To be implemented`);

        } catch (error) {
            console.error('Error viewing purchase order:', error);
            this.showError('Error loading purchase order details');
        }
    }

    /**
     * Add new item to Purchase Invoice
     */
    addPIItem() {
        const container = document.getElementById('pi-items-container');
        const itemCount = container.children.length;
        
        const products = this.cachedProducts || [];
        console.log('Adding PI item, cached products:', products.length, products);
        
        const itemHtml = `
            <div class="item-row" data-index="${itemCount}">
                <div class="item-fields">
                    <div class="field-group">
                        <label>Product</label>
                        <select class="item-product" onchange="businessController.updateItemDetails(${itemCount}, 'pi')">
                            <option value="">Select Product</option>
                            ${products.map(product => `
                                <option value="${product.id}" data-price="${product.purchase_price || product.selling_price || 0}">${product.product_name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="field-group">
                        <label>Quantity</label>
                        <input type="number" class="item-quantity" min="1" step="1" onchange="businessController.calculateItemTotal(${itemCount}, 'pi')">
                    </div>
                    <div class="field-group">
                        <label>Unit Price (₹)</label>
                        <input type="number" class="item-price" min="0" step="0.01" onchange="businessController.calculateItemTotal(${itemCount}, 'pi')">
                    </div>
                    <div class="field-group">
                        <label>Discount (₹)</label>
                        <input type="number" class="item-discount" min="0" step="0.01" onchange="businessController.calculateItemTotal(${itemCount}, 'pi')">
                    </div>
                    <div class="field-group">
                        <label>GST (%)</label>
                        <select class="item-gst" onchange="businessController.calculateItemTotal(${itemCount}, 'pi')">
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18" selected>18%</option>
                            <option value="28">28%</option>
                        </select>
                    </div>
                    <div class="field-group">
                        <label>Total (₹)</label>
                        <input type="number" class="item-total" readonly>
                    </div>
                    <div class="field-group">
                        <button type="button" onclick="businessController.removeItem(${itemCount}, 'pi')" class="btn btn-danger">Remove</button>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', itemHtml);
    }

    /**
     * Calculate Purchase Invoice totals
     */
    calculatePITotals() {
        const container = document.getElementById('pi-items-container');
        const itemRows = container.querySelectorAll('.item-row');
        
        let subtotal = 0;
        let totalDiscount = 0;
        let gstTotal = 0;
        
        itemRows.forEach(row => {
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            const discount = parseFloat(row.querySelector('.item-discount').value) || 0;
            const gstRate = parseFloat(row.querySelector('.item-gst').value) || 0;
            
            const itemSubtotal = quantity * price;
            const itemDiscountedAmount = itemSubtotal - discount;
            const itemGst = (itemDiscountedAmount * gstRate) / 100;
            
            subtotal += itemSubtotal;
            totalDiscount += discount;
            gstTotal += itemGst;
        });
        
        const roundOff = parseFloat(document.getElementById('pi-round-off').value) || 0;
        const grandTotal = subtotal - totalDiscount + gstTotal + roundOff;
        
        document.getElementById('pi-subtotal-display').textContent = this.formatCurrency(subtotal);
        document.getElementById('pi-discount-display').textContent = this.formatCurrency(totalDiscount);
        document.getElementById('pi-gst-display').textContent = this.formatCurrency(gstTotal);
        document.getElementById('pi-grand-total-display').textContent = this.formatCurrency(grandTotal);
    }

    /**
     * Save Purchase Invoice
     */
    async savePurchaseInvoice(invoiceId = '', poId = '') {
        try {
            // Collect form data
            const invoiceData = {
                supplier_id: document.getElementById('pi-supplier').value,
                supplier_invoice_number: document.getElementById('pi-supplier-invoice').value.trim(),
                purchase_date: document.getElementById('pi-date').value,
                payment_terms: parseInt(document.getElementById('pi-payment-terms').value) || 30,
                due_date: document.getElementById('pi-due-date').value,
                notes: document.getElementById('pi-notes').value.trim(),
                payment_status: 'Unpaid',
                paid_amount: 0
            };

            if (poId) {
                invoiceData.po_id = poId;
            }

            // Validation
            if (!invoiceData.supplier_id) {
                this.showError('Please select a supplier');
                return;
            }

            if (!invoiceData.purchase_date) {
                this.showError('Please select purchase date');
                return;
            }

            // Collect items
            const itemsContainer = document.getElementById('pi-items-container');
            const itemRows = itemsContainer.querySelectorAll('.item-row');
            const items = [];
            
            let hasValidItems = false;
            itemRows.forEach((row, index) => {
                const productId = row.querySelector('.item-product').value;
                const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
                const price = parseFloat(row.querySelector('.item-price').value) || 0;
                const discount = parseFloat(row.querySelector('.item-discount').value) || 0;
                const gstRate = parseFloat(row.querySelector('.item-gst').value) || 0;
                
                if (productId && quantity > 0 && price > 0) {
                    hasValidItems = true;
                    const subtotal = quantity * price;
                    const discountedAmount = subtotal - discount;
                    const gstAmount = (discountedAmount * gstRate) / 100;
                    const total = discountedAmount + gstAmount;
                    
                    items.push({
                        product_id: productId,
                        quantity: quantity,
                        unit_price: price,
                        discount_amount: discount,
                        gst_rate: gstRate,
                        subtotal: subtotal,
                        gst_amount: gstAmount,
                        total_amount: total
                    });
                }
            });

            if (!hasValidItems) {
                this.showError('Please add at least one valid item');
                return;
            }

            // Calculate totals
            const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
            const totalDiscount = items.reduce((sum, item) => sum + item.discount_amount, 0);
            const gstTotal = items.reduce((sum, item) => sum + item.gst_amount, 0);
            const roundOff = parseFloat(document.getElementById('pi-round-off').value) || 0;
            const grandTotal = subtotal - totalDiscount + gstTotal + roundOff;

            invoiceData.subtotal = subtotal;
            invoiceData.discount_amount = totalDiscount;
            invoiceData.tax_amount = gstTotal;
            invoiceData.round_off = roundOff;
            invoiceData.total_amount = grandTotal;
            invoiceData.items = items;

            let result;
            if (invoiceId) {
                // Update existing invoice
                result = await this.modules.database.update('purchase_invoices', invoiceId, invoiceData);
                this.showSuccess('Purchase Invoice updated successfully');
            } else {
                // Generate Purchase Invoice number for new invoice
                const piNumber = await this.generatePINumber();
                invoiceData.purchase_invoice_number = piNumber;
                
                // Get supplier name for display
                const supplier = await this.modules.database.getById('suppliers', invoiceData.supplier_id);
                if (supplier) {
                    invoiceData.supplier_name = supplier.supplier_name;
                }
                
                // Create new invoice
                result = await this.modules.database.add('purchase_invoices', invoiceData);
                this.showSuccess('Purchase Invoice created successfully');
                
                // Update inventory for each item
                for (const item of items) {
                    await this.updateInventoryStock(item.product_id, item.quantity, 'IN');
                }
                
                // Update PO status if created from PO
                if (poId) {
                    await this.modules.database.update('purchase_orders', poId, { status: 'Completed' });
                }
            }

            // Close modal and refresh list
            this.closeModal('purchase-invoice-modal');
            this.loadPurchaseInvoices();

        } catch (error) {
            console.error('Error saving purchase invoice:', error);
            this.showError('Error saving purchase invoice');
        }
    }

    /**
     * Update inventory stock
     */
    async updateInventoryStock(productId, quantity, movementType) {
        try {
            const product = await this.modules.database.getById('products', productId);
            if (!product) return;

            let newStock = product.current_stock || 0;
            if (movementType === 'IN') {
                newStock += quantity;
            } else if (movementType === 'OUT') {
                newStock -= quantity;
            }

            await this.modules.database.update('products', productId, { 
                current_stock: newStock,
                last_purchase_price: product.purchase_price || 0
            });

            // Record stock movement
            await this.modules.database.add('stock_movements', {
                product_id: productId,
                movement_type: movementType,
                quantity: quantity,
                movement_date: new Date().toISOString(),
                reference_type: 'Purchase Invoice',
                reference_id: null
            });

        } catch (error) {
            console.error('Error updating inventory:', error);
        }
    }

    /**
     * Edit Purchase Invoice
     */
    editPurchaseInvoice(invoiceId) {
        this.showCreatePurchaseInvoiceModal(null, invoiceId);
    }

    /**
     * View Purchase Invoice
     */
    async viewPurchaseInvoice(invoiceId) {
        try {
            const invoice = await this.modules.database.getById('purchase_invoices', invoiceId);
            if (!invoice) {
                this.showError('Purchase Invoice not found');
                return;
            }

            // TODO: Implement invoice view modal
            alert(`View Invoice: ${invoice.purchase_invoice_number} - To be implemented`);

        } catch (error) {
            console.error('Error viewing purchase invoice:', error);
            this.showError('Error loading purchase invoice details');
        }
    }

    /**
     * Create Debit Note
     */
    async createDebitNote(invoiceId) {
        try {
            const invoice = await this.modules.database.getById('purchase_invoices', invoiceId);
            if (!invoice) {
                this.showError('Purchase Invoice not found');
                return;
            }

            // TODO: Implement debit note modal
            alert(`Create Debit Note for Invoice: ${invoice.purchase_invoice_number} - To be implemented`);

        } catch (error) {
            console.error('Error creating debit note:', error);
            this.showError('Error creating debit note');
        }
    }

    /**
     * Load Sales Orders
     */
    async loadSalesOrders() {
        const container = document.getElementById('sales-orders-list');
        if (!container) return;

        try {
            container.innerHTML = '<div class="loading">Loading sales orders...</div>';
            
            let salesOrders = [];
            
            // Try multiple approaches to get sales orders
            if (this.isDatabaseAvailable()) {
                try {
                    salesOrders = await this.modules.database.getAll('sales_orders');
                } catch (error) {
                    console.log('Database manager failed for sales orders, trying direct Firebase:', error);
                }
            }
            
            // If database manager failed, try direct Firebase access
            if (salesOrders.length === 0) {
                try {
                    console.log('Trying direct Firebase access for sales orders...');
                    salesOrders = await this.getFirebaseData('sales_orders');
                    console.log('Direct Firebase access successful, sales orders:', salesOrders.length);
                } catch (error) {
                    console.log('Direct Firebase access failed for sales orders:', error);
                    this.showDatabaseUnavailableError(container, 'Sales Orders');
                    return;
                }
            }
            
            if (salesOrders.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fas fa-clipboard-list fa-3x"></i></div>
                        <h3>No Sales Orders</h3>
                        <p>Create your first sales order to get started</p>
                    </div>
                `;
                return;
            }

            // Create table
            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>SO Number</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Total Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${salesOrders.map(so => `
                            <tr>
                                <td><strong>${so.so_number}</strong></td>
                                <td>${this.formatDate(so.so_date)}</td>
                                <td>${so.customer_name || 'N/A'}</td>
                                <td>${this.formatCurrency(so.total_amount || 0)}</td>
                                <td><span class="status-badge status-${so.status?.toLowerCase() || 'draft'}">${so.status || 'Draft'}</span></td>
                                <td>
                                    <button class="secondary-btn" onclick="businessController.editSalesOrder('${so.id}')"><i class="fas fa-edit"></i> Edit</button>
                                    <button class="secondary-btn" onclick="businessController.convertSOToInvoice('${so.id}')"><i class="fas fa-file-invoice"></i> Convert</button>
                                    <button class="secondary-btn" onclick="businessController.viewSalesOrder('${so.id}')"><i class="fas fa-eye"></i> View</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

        } catch (error) {
            console.error('Error loading sales orders:', error);
            container.innerHTML = '<div class="text-danger">Error loading sales orders</div>';
        }
    }

    /**
     * Show Create Sales Order Modal
     */
    async showCreateSalesOrderModal(soId = null) {
        try {
            console.log('SO Modal - Starting to create Sales Order modal...');
            const isEdit = !!soId;
            
            // Load customers and products
            let customers = [];
            let products = [];
        
        try {
            if (this.isDatabaseAvailable()) {
                customers = await this.modules.database.getAll('customers');
            } else {
                customers = await this.getFirebaseData('customers');
            }
        } catch (error) {
            console.error('Error loading customers:', error);
        }
        
        try {
            if (this.isDatabaseAvailable()) {
                products = await this.modules.database.getAll('products');
            } else {
                products = await this.getFirebaseData('products');
            }
            
            // Fallback to stock manager if new system has no products
            if (products.length === 0 && this.modules.stock) {
                const result = await this.modules.stock.getProducts();
                if (result.success) {
                    products = result.products.map(p => ({
                        id: p.id,
                        product_name: p.name || p.product_name,
                        selling_price: p.price || p.selling_price || 0,
                        current_stock: p.stock || p.current_stock || 0,
                        gst_rate: p.gstRate || p.gst_rate || 18
                    }));
                }
            }
            
            // If still no products, add sample products
            if (products.length === 0) {
                console.log('No products found, adding sample products...');
                await this.addSampleProducts();
                products = await this.modules.database.getAll('products');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            products = [];
        }
        
        // Cache products for use in dynamic item rows
        this.cachedProducts = products;
        console.log('SO Modal - Cached products:', products.length, products);
        console.log('SO Modal - Creating modal HTML...');
        
        const modalHtml = `
            <div class="modal" id="sales-order-modal">
                <div class="modal-content" style="max-width: 1000px;">
                    <div class="modal-header">
                        <h3>${isEdit ? 'Edit Sales Order' : 'Create Sales Order'}</h3>
                        <button class="modal-close" onclick="businessController.closeModal('sales-order-modal')"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <form id="sales-order-form">
                            <div class="form-section">
                                <h4>Sales Order Details</h4>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="so-customer">Customer *</label>
                                        <select id="so-customer" required>
                                            <option value="">Select Customer</option>
                                            ${customers.map(customer => `
                                                <option value="${customer.id}">${customer.customer_name}</option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="so-date">Order Date *</label>
                                        <input type="date" id="so-date" required value="${new Date().toISOString().split('T')[0]}">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="so-delivery-date">Expected Delivery Date</label>
                                        <input type="date" id="so-delivery-date">
                                    </div>
                                    <div class="form-group">
                                        <label for="so-status">Status</label>
                                        <select id="so-status">
                                            <option value="Draft">Draft</option>
                                            <option value="Confirmed">Confirmed</option>
                                            <option value="Partially Delivered">Partially Delivered</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="so-terms">Terms & Conditions</label>
                                        <textarea id="so-terms" rows="3" placeholder="Enter terms and conditions"></textarea>
                                    </div>
                                    <div class="form-group">
                                        <label for="so-notes">Notes</label>
                                        <textarea id="so-notes" rows="3" placeholder="Internal notes"></textarea>
                                    </div>
                                </div>
                            </div>

                            <div class="form-section">
                                <h4>Items</h4>
                                <div id="so-items-container">
                                    <div class="item-row" data-index="0">
                                        <div class="item-fields">
                                            <div class="field-group">
                                                <label>Product</label>
                                                <select class="item-product" onchange="businessController.updateItemDetails(0, 'so')">
                                                    <option value="">Select Product</option>
                                                    ${products.map(product => `
                                                        <option value="${product.id}" data-price="${product.selling_price || 0}" data-stock="${product.current_stock || 0}">${product.product_name}</option>
                                                    `).join('')}
                                                </select>
                                            </div>
                                            <div class="field-group">
                                                <label>Quantity</label>
                                                <input type="number" class="item-quantity" min="1" step="1" onchange="businessController.calculateItemTotal(0, 'so')">
                                            </div>
                                            <div class="field-group">
                                                <label>Unit Price (₹)</label>
                                                <input type="number" class="item-price" min="0" step="0.01" onchange="businessController.calculateItemTotal(0, 'so')">
                                            </div>
                                            <div class="field-group">
                                                <label>GST (%)</label>
                                                <select class="item-gst" onchange="businessController.calculateItemTotal(0, 'so')">
                                                    <option value="0">0%</option>
                                                    <option value="5">5%</option>
                                                    <option value="12">12%</option>
                                                    <option value="18" selected>18%</option>
                                                    <option value="28">28%</option>
                                                </select>
                                            </div>
                                            <div class="field-group">
                                                <label>Total (₹)</label>
                                                <input type="number" class="item-total" readonly>
                                            </div>
                                            <div class="field-group">
                                                <button type="button" onclick="businessController.removeItem(0, 'so')" class="btn btn-danger">Remove</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button type="button" id="add-so-item-btn" onclick="businessController.addSOItem()"><i class="fas fa-plus"></i> Add Item</button>
                            </div>

                            <div class="totals-section">
                                <div class="total-row">
                                    <span>Subtotal:</span>
                                    <span id="so-subtotal">₹0.00</span>
                                </div>
                                <div class="total-row">
                                    <span>GST:</span>
                                    <span id="so-gst">₹0.00</span>
                                </div>
                                <div class="total-row grand-total">
                                    <span>Grand Total:</span>
                                    <span id="so-grand-total">₹0.00</span>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="secondary-btn" onclick="businessController.closeModal('sales-order-modal')"><i class="fas fa-times"></i> Cancel</button>
                        <button type="button" class="primary-btn" onclick="businessController.saveSalesOrder('${soId || ''}')"><i class="fas fa-save"></i> ${isEdit ? 'Update' : 'Save'} Sales Order</button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('sales-order-modal');
        if (existingModal) {
            existingModal.remove();
        }

        console.log('SO Modal - Adding modal to DOM...');
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        console.log('SO Modal - Modal added, showing modal...');
        document.getElementById('sales-order-modal').style.display = 'block';
        console.log('SO Modal - Modal should be visible now');

        // Load data if editing
        if (isEdit) {
            this.loadSalesOrderData(soId);
        }
        
        } catch (error) {
            console.error('Error creating Sales Order modal:', error);
            alert('Error opening Sales Order form. Please try again.');
        }
    }

    /**
     * Generate PO Number
     */
    async generatePONumber() {
        try {
            const counter = await this.modules.database.getNextCounter('purchase_orders');
            return `PO${String(counter).padStart(4, '0')}`;
        } catch (error) {
            console.error('Error generating PO number:', error);
            // Fallback to timestamp-based number
            return `PO${Date.now().toString().slice(-6)}`;
        }
    }

    /**
     * Generate Purchase Invoice Number
     */
    async generatePINumber() {
        try {
            const counter = await this.modules.database.getNextCounter('purchase_invoices');
            return `PI${String(counter).padStart(4, '0')}`;
        } catch (error) {
            console.error('Error generating PI number:', error);
            // Fallback to timestamp-based number
            return `PI${Date.now().toString().slice(-6)}`;
        }
    }

    /**
     * Generate Sales Order Number
     */
    async generateSONumber() {
        try {
            const counter = await this.modules.database.getNextCounter('sales_orders');
            return `SO${String(counter).padStart(4, '0')}`;
        } catch (error) {
            console.error('Error generating SO number:', error);
            // Fallback to timestamp-based number
            return `SO${Date.now().toString().slice(-6)}`;
        }
    }

    /**
     * Add new item to Sales Order
     */
    addSOItem() {
        const container = document.getElementById('so-items-container');
        const itemCount = container.children.length;
        
        const products = this.cachedProducts || [];
        console.log('Adding SO item, cached products:', products.length, products);
        
        const itemHtml = `
            <div class="item-row" data-index="${itemCount}">
                <div class="item-fields">
                    <div class="field-group">
                        <label>Product</label>
                        <select class="item-product" onchange="businessController.updateItemDetails(${itemCount}, 'so')">
                            <option value="">Select Product</option>
                            ${products.map(product => `
                                <option value="${product.id}" data-price="${product.selling_price || 0}" data-stock="${product.current_stock || 0}">${product.product_name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="field-group">
                        <label>Quantity</label>
                        <input type="number" class="item-quantity" min="1" step="1" onchange="businessController.calculateItemTotal(${itemCount}, 'so')">
                    </div>
                    <div class="field-group">
                        <label>Unit Price (₹)</label>
                        <input type="number" class="item-price" min="0" step="0.01" onchange="businessController.calculateItemTotal(${itemCount}, 'so')">
                    </div>
                    <div class="field-group">
                        <label>GST (%)</label>
                        <select class="item-gst" onchange="businessController.calculateItemTotal(${itemCount}, 'so')">
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18" selected>18%</option>
                            <option value="28">28%</option>
                        </select>
                    </div>
                    <div class="field-group">
                        <label>Total (₹)</label>
                        <input type="number" class="item-total" readonly>
                    </div>
                    <div class="field-group">
                        <button type="button" onclick="businessController.removeItem(${itemCount}, 'so')" class="btn btn-danger">Remove</button>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', itemHtml);
    }

    /**
     * Calculate Sales Order totals
     */
    calculateSOTotals() {
        const container = document.getElementById('so-items-container');
        const itemRows = container.querySelectorAll('.item-row');
        
        let subtotal = 0;
        let gstTotal = 0;
        
        itemRows.forEach(row => {
            const total = parseFloat(row.querySelector('.item-total').value) || 0;
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            const gstRate = parseFloat(row.querySelector('.item-gst').value) || 0;
            
            const itemSubtotal = quantity * price;
            const itemGst = (itemSubtotal * gstRate) / 100;
            
            subtotal += itemSubtotal;
            gstTotal += itemGst;
        });
        
        const grandTotal = subtotal + gstTotal;
        
        document.getElementById('so-subtotal').textContent = this.formatCurrency(subtotal);
        document.getElementById('so-gst').textContent = this.formatCurrency(gstTotal);
        document.getElementById('so-grand-total').textContent = this.formatCurrency(grandTotal);
    }

    /**
     * Save Sales Order
     */
    async saveSalesOrder(soId = '') {
        try {
            // Collect form data
            const soData = {
                customer_id: document.getElementById('so-customer').value,
                so_date: document.getElementById('so-date').value,
                expected_delivery_date: document.getElementById('so-delivery-date').value,
                terms_conditions: document.getElementById('so-terms').value.trim(),
                notes: document.getElementById('so-notes').value.trim(),
                status: document.getElementById('so-status').value || 'Draft'
            };

            // Validation
            if (!soData.customer_id) {
                this.showError('Please select a customer');
                return;
            }

            if (!soData.so_date) {
                this.showError('Please select order date');
                return;
            }

            // Collect items
            const itemsContainer = document.getElementById('so-items-container');
            const itemRows = itemsContainer.querySelectorAll('.item-row');
            const items = [];
            
            let hasValidItems = false;
            itemRows.forEach((row, index) => {
                const productId = row.querySelector('.item-product').value;
                const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
                const price = parseFloat(row.querySelector('.item-price').value) || 0;
                const gstRate = parseFloat(row.querySelector('.item-gst').value) || 0;
                
                if (productId && quantity > 0 && price > 0) {
                    hasValidItems = true;
                    const subtotal = quantity * price;
                    const gstAmount = (subtotal * gstRate) / 100;
                    const totalAmount = subtotal + gstAmount;
                    
                    items.push({
                        product_id: productId,
                        quantity: quantity,
                        unit_price: price,
                        gst_rate: gstRate,
                        subtotal: subtotal,
                        gst_amount: gstAmount,
                        total_amount: totalAmount
                    });
                }
            });

            if (!hasValidItems) {
                this.showError('Please add at least one valid item');
                return;
            }

            // Calculate totals
            const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
            const gstTotal = items.reduce((sum, item) => sum + item.gst_amount, 0);
            const grandTotal = subtotal + gstTotal;

            soData.subtotal = subtotal;
            soData.tax_amount = gstTotal;
            soData.total_amount = grandTotal;
            soData.items = items;

            let result;
            if (soId) {
                // Update existing SO
                result = await this.modules.database.update('sales_orders', soId, soData);
                this.showSuccess('Sales Order updated successfully');
            } else {
                // Generate SO number for new SO
                const soNumber = await this.generateSONumber();
                soData.so_number = soNumber;
                
                // Get customer name for display
                const customer = await this.modules.database.getById('customers', soData.customer_id);
                if (customer) {
                    soData.customer_name = customer.customer_name;
                }
                
                // Create new SO
                result = await this.modules.database.add('sales_orders', soData);
                this.showSuccess('Sales Order created successfully');
            }

            // Close modal and refresh list
            this.closeModal('sales-order-modal');
            this.loadSalesOrders();

        } catch (error) {
            console.error('Error saving sales order:', error);
            this.showError('Error saving sales order');
        }
    }

    /**
     * Edit Sales Order
     */
    async editSalesOrder(soId) {
        this.showCreateSalesOrderModal(soId);
    }

    /**
     * Convert Sales Order to Invoice
     */
    async convertSOToInvoice(soId) {
        try {
            // TODO: Implement SO to Invoice conversion
            alert(`Convert Sales Order to Invoice: ${soId} - To be implemented`);
        } catch (error) {
            console.error('Error converting SO to invoice:', error);
            this.showError('Error converting to invoice');
        }
    }

    /**
     * View Sales Order
     */
    async viewSalesOrder(soId) {
        try {
            // TODO: Implement SO view modal
            alert(`View Sales Order: ${soId} - To be implemented`);
        } catch (error) {
            console.error('Error viewing sales order:', error);
            this.showError('Error loading sales order details');
        }
    }

    /**
     * Load and display products in card view
     */
    async loadProducts() {
        const container = document.getElementById('products-list');
        if (!container) return;

        try {
            container.innerHTML = '<div class="loading">Loading products...</div>';
            
            let products = [];
            
            // Primary approach: Use stock manager (your original products) - same as dashboard.html
            if (window.stockManager) {
                console.log('Loading products from stock manager (same as dashboard.html)...');
                try {
                    const result = await window.stockManager.getProducts();
                    if (result.success && result.products.length > 0) {
                        products = result.products.map(p => ({
                            id: p.id,
                            product_name: p.name || p.product_name || 'Unnamed Product',
                            product_code: p.code || p.product_code || 'N/A',
                            category: p.category || 'General',
                            unit: p.unit || 'Piece',
                            selling_price: p.price || p.selling_price || 0,
                            purchase_price: p.purchase_price || p.price || 0,
                            current_stock: p.stock || p.current_stock || 0,
                            min_stock_level: p.min_stock_level || 5,
                            hsn_code: p.hsn || p.hsn_code || 'N/A',
                            gst_rate: p.gstRate || p.gst_rate || 18,
                            is_active: p.is_active !== false,
                            source: 'stock_manager'
                        }));
                        console.log('Loaded products from stock manager:', products.length);
                    }
                } catch (error) {
                    console.log('Stock manager failed:', error);
                }
            }
            
            // Only if no products from stock manager, try other sources
            if (products.length === 0) {
                console.log('No products from stock manager, trying other sources...');
                
                // Try database manager
                if (this.isDatabaseAvailable()) {
                    try {
                        const dbProducts = await this.modules.database.getAll('products');
                        if (dbProducts.length > 0) {
                            products = dbProducts.map(p => ({
                                ...p,
                                product_name: p.product_name || p.name || 'Unnamed Product',
                                source: 'database_manager'
                            }));
                            console.log('Loaded products from database manager:', products.length);
                        }
                    } catch (error) {
                        console.log('Database manager failed:', error);
                    }
                }
                
                // Final fallback: Direct Firebase (but filter out sample products without userId)
                if (products.length === 0) {
                    try {
                        console.log('Trying direct Firebase access (filtering user products)...');
                        const allProducts = await this.getFirebaseData('products');
                        
                        // Filter products to only show user-specific ones (or add user context)
                        products = allProducts
                            .filter(p => {
                                // Only include products that have a proper name and aren't sample products
                                return (p.product_name || p.name) && 
                                       !p.product_name?.includes('Sample') &&
                                       !p.product_name?.includes('Laptop Computer') &&
                                       !p.product_name?.includes('Office Chair') &&
                                       !p.product_name?.includes('Printer Paper');
                            })
                            .map(p => ({
                                ...p,
                                product_name: p.product_name || p.name || 'Unnamed Product',
                                source: 'firebase_direct'
                            }));
                        
                        console.log('Loaded filtered products from Firebase:', products.length);
                    } catch (error) {
                        console.log('Direct Firebase access failed:', error);
                    }
                }
            }
            
            // If still no products, try adding sample products (only if we have database access)
            if (products.length === 0 && this.isDatabaseAvailable()) {
                console.log('No products found, trying to add sample products...');
                const sampleAdded = await this.addSampleProducts();
                if (sampleAdded) {
                    try {
                        products = await this.modules.database.getAll('products');
                    } catch (error) {
                        console.log('Error getting products after adding samples:', error);
                    }
                }
            }
            
            if (products.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fas fa-boxes fa-3x"></i></div>
                        <h3>No Products</h3>
                        <p>Add your first product to get started</p>
                        <button class="primary-btn" onclick="businessController.showAddProductModal()">
                            <i class="fas fa-plus"></i> Add Product
                        </button>
                    </div>
                `;
                return;
            }

            // Create products grid
            let productsHtml = '<div class="products-grid">';
            
            products.forEach(product => {
                const stock = product.current_stock || 0;
                const minStock = product.min_stock_level || 5;
                
                let stockBadge = '';
                let stockClass = '';
                
                if (stock === 0) {
                    stockBadge = 'Out of Stock';
                    stockClass = 'out-of-stock';
                } else if (stock <= minStock) {
                    stockBadge = 'Low Stock';
                    stockClass = 'low-stock';
                } else {
                    stockBadge = 'In Stock';
                    stockClass = 'in-stock';
                }

                productsHtml += `
                    <div class="product-card">
                        <div class="product-header">
                            <h3 class="product-name">${product.product_name}</h3>
                            <span class="stock-badge ${stockClass}">${stockBadge}</span>
                        </div>
                        <div class="product-details">
                            <p><strong>Code:</strong> ${product.product_code || 'N/A'}</p>
                            ${product.category ? `<p><strong>Category:</strong> ${product.category}</p>` : ''}
                            ${product.hsn_code ? `<p><strong>HSN:</strong> ${product.hsn_code}</p>` : ''}
                            <p><strong>Selling Price:</strong> ₹${(product.selling_price || 0).toFixed(2)} per ${product.unit || 'unit'}</p>
                            <p><strong>Purchase Price:</strong> ₹${(product.purchase_price || 0).toFixed(2)} per ${product.unit || 'unit'}</p>
                            <p><strong>GST Rate:</strong> ${(product.gst_rate || 0)}%</p>
                            <p><strong>Stock:</strong> ${stock} ${product.unit || 'units'}</p>
                            <p><strong>Min Stock:</strong> ${minStock} ${product.unit || 'units'}</p>
                        </div>
                        <div class="product-actions">
                            <button class="edit-product-btn" onclick="businessController.editProduct('${product.id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="update-stock-btn" onclick="businessController.updateProductStock('${product.id}')">
                                <i class="fas fa-boxes"></i> Stock
                            </button>
                            <button class="delete-product-btn" onclick="businessController.deleteProduct('${product.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            });

            productsHtml += '</div>';
            container.innerHTML = productsHtml;

        } catch (error) {
            console.error('Error loading products:', error);
            container.innerHTML = '<div class="text-danger">Error loading products</div>';
        }
    }

    /**
     * Refresh products list after adding/editing
     */
    async refreshProducts() {
        console.log('Refreshing products list...');
        await this.loadProducts();
    }

    /**
     * Remove sample products from Firebase
     */
    async removeSampleProducts() {
        try {
            console.log('Removing sample products from Firebase...');
            const { db } = await import('./firebase-config.js');
            const { collection, query, where, getDocs, deleteDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
            
            const productsRef = collection(db, 'products');
            const sampleProductNames = ['Laptop Computer', 'Office Chair', 'Printer Paper A4'];
            
            for (const productName of sampleProductNames) {
                const q = query(productsRef, where('product_name', '==', productName));
                const snapshot = await getDocs(q);
                
                snapshot.forEach(async (doc) => {
                    await deleteDoc(doc.ref);
                    console.log('Deleted sample product:', productName);
                });
            }
            
            return true;
        } catch (error) {
            console.error('Error removing sample products:', error);
            return false;
        }
    }

    /**
     * Add product directly to Firebase
     */
    async addProductToFirebase(productData) {
        try {
            const { db } = await import('./firebase-config.js');
            const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
            
            const productsRef = collection(db, 'products');
            const docRef = await addDoc(productsRef, {
                ...productData,
                created_at: new Date(),
                updated_at: new Date()
            });
            
            console.log('Product added to Firebase with ID:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error adding product to Firebase:', error);
            return { success: false, error };
        }
    }

    /**
     * Add sample products for testing (if no products exist)
     */
    async addSampleProducts() {
        try {
            // Check if database is available
            if (!this.isDatabaseAvailable()) {
                console.warn('Cannot add sample products - database not available');
                return false;
            }
            
            // Check if products already exist
            const existingProducts = await this.modules.database.getAll('products');
            if (existingProducts.length === 0) {
                console.log('Adding sample products...');
                
                const sampleProducts = [
                    {
                        product_name: 'Laptop Computer',
                        product_code: 'PROD001',
                        category: 'Electronics',
                        unit: 'Piece',
                        selling_price: 50000,
                        purchase_price: 40000,
                        current_stock: 10,
                        min_stock_level: 2,
                        hsn_code: '8471',
                        gst_rate: 18,
                        is_active: true
                    },
                    {
                        product_name: 'Office Chair',
                        product_code: 'PROD002',
                        category: 'Furniture',
                        unit: 'Piece',
                        selling_price: 8000,
                        purchase_price: 6000,
                        current_stock: 25,
                        min_stock_level: 5,
                        hsn_code: '9401',
                        gst_rate: 18,
                        is_active: true
                    },
                    {
                        product_name: 'Printer Paper A4',
                        product_code: 'PROD003',
                        category: 'Stationery',
                        unit: 'Ream',
                        selling_price: 300,
                        purchase_price: 250,
                        current_stock: 100,
                        min_stock_level: 20,
                        hsn_code: '4802',
                        gst_rate: 12,
                        is_active: true
                    }
                ];

                for (const product of sampleProducts) {
                    await this.modules.database.add('products', product);
                }
                
                console.log('Sample products added successfully');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error adding sample products:', error);
            return false;
        }
    }

    /**
     * Edit Product
     */
    async editProduct(productId) {
        try {
            // Since inventory uses stock manager, redirect to stock manager edit
            if (window.stockManager && window.stockManager.editProduct) {
                window.stockManager.editProduct(productId);
            } else {
                // Fallback: show simple alert
                alert('Product editing will be implemented soon. Please use the main Stock Management section in dashboard.html for now.');
            }
        } catch (error) {
            console.error('Error editing product:', error);
            this.showError('Error loading product details');
        }
    }

    /**
     * Update Product Stock
     */
    async updateProductStock(productId) {
        try {
            // Since inventory uses stock manager, redirect to stock manager update
            if (window.stockManager && window.stockManager.updateStock) {
                window.stockManager.updateStock(productId);
                // Refresh the products list after update
                setTimeout(() => this.refreshProducts(), 1000);
            } else {
                // Fallback: show simple alert
                alert('Stock updating will be implemented soon. Please use the main Stock Management section in dashboard.html for now.');
            }
        } catch (error) {
            console.error('Error updating stock:', error);
            this.showError('Error updating stock');
        }
    }

    /**
     * Delete Product
     */
    async deleteProduct(productId) {
        try {
            // Since inventory uses stock manager, redirect to stock manager delete
            if (window.stockManager && window.stockManager.deleteProduct) {
                window.stockManager.deleteProduct(productId);
                // Refresh the products list after delete
                setTimeout(() => this.refreshProducts(), 1000);
            } else {
                // Fallback: show simple alert
                alert('Product deletion will be implemented soon. Please use the main Stock Management section in dashboard.html for now.');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showError('Error deleting product');
        }
    }

    /**
     * Show Add Product Modal
     */
    showAddProductModal() {
        // TODO: Implement add product modal
        alert('Add Product modal - To be implemented');
    }

    /**
     * Close modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.remove();
        }
    }
}

// Create global instance
window.businessController = new BusinessAccountingController();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BusinessAccountingController;
}
