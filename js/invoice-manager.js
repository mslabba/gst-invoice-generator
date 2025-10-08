// Invoice Manager - Handle invoice creation and management
import { authManager } from './auth.js';
import { invoiceStorage } from './invoice-storage.js';
import { buyerStorage } from './buyer-storage.js';
import { stockManager } from './stock-management.js';

class InvoiceManager {
  constructor() {
    this.itemIndex = 1;
    this.currentInvoice = null;
    this.availableProducts = [];
  }

  // Initialize invoice form
  async initializeForm() {
    const form = document.getElementById('invoice-form');
    if (!form) return;

    this.setupEventListeners();
    this.setDefaultDate();
    await this.loadDefaultData();
    await this.loadProductsInDropdowns();
    this.setupItemCalculations();
  }

  // Setup all event listeners
  setupEventListeners() {
    // Add item button
    const addItemBtn = document.getElementById('add-item-btn');
    if (addItemBtn) {
      addItemBtn.removeEventListener('click', this.addNewItemHandler);
      addItemBtn.addEventListener('click', this.addNewItemHandler.bind(this));
    }

    // Generate invoice button
    const generateBtn = document.getElementById('generate-invoice');
    if (generateBtn) {
      generateBtn.removeEventListener('click', this.generateInvoiceHandler);
      generateBtn.addEventListener('click', this.generateInvoiceHandler.bind(this));
    }

    // Download PDF button
    const downloadBtn = document.getElementById('download-pdf');
    if (downloadBtn) {
      downloadBtn.removeEventListener('click', this.downloadPDFHandler);
      downloadBtn.addEventListener('click', this.downloadPDFHandler.bind(this));
    }

    // New Invoice button
    const newInvoiceBtn = document.getElementById('new-invoice-btn');
    if (newInvoiceBtn) {
      newInvoiceBtn.removeEventListener('click', this.startNewInvoiceHandler);
      newInvoiceBtn.addEventListener('click', this.startNewInvoiceHandler.bind(this));
    }
  }

  // Set default invoice date
  setDefaultDate() {
    const invoiceDateField = document.getElementById('invoice-date');
    if (invoiceDateField && !invoiceDateField.value) {
      invoiceDateField.value = new Date().toISOString().split('T')[0];
    }
  }

  // Load default seller data and buyer data
  async loadDefaultData() {
    if (authManager && authManager.currentUser) {
      authManager.loadDefaultSellerData();
    }
    this.loadBuyerData();
  }

  // Load buyer data for dropdown
  loadBuyerData() {
    const buyerSelect = document.getElementById('buyer-select');
    if (!buyerSelect || !authManager?.currentUser) {
      return;
    }

    buyerStorage.getAllBuyers().then(result => {
      buyerSelect.innerHTML = '<option value="">-- Select a buyer or enter new details --</option>';

      if (result.success && result.buyers && Array.isArray(result.buyers)) {
        result.buyers.forEach(buyer => {
          const option = document.createElement('option');
          option.value = JSON.stringify(buyer);
          option.textContent = `${buyer.name} - ${buyer.address}`;
          buyerSelect.appendChild(option);
        });
      }

      buyerSelect.removeEventListener('change', this.buyerSelectHandler);
      buyerSelect.addEventListener('change', this.buyerSelectHandler.bind(this));
    }).catch(error => {
      console.error('Error loading buyers:', error);
    });
  }

  // Handle buyer selection
  buyerSelectHandler(e) {
    if (e.target.value) {
      const buyer = JSON.parse(e.target.value);
      document.getElementById('buyer-name').value = buyer.name || '';
      document.getElementById('buyer-address').value = buyer.address || '';
      document.getElementById('buyer-gst').value = buyer.gst || '';
    }
  }

  // Load products for dropdowns
  async loadProductsInDropdowns() {
    try {
      const result = await stockManager.getProducts();
      if (result.success) {
        this.availableProducts = result.products;
        const productSelects = document.querySelectorAll('.product-select');
        productSelects.forEach(select => {
          this.populateProductDropdown(select);
        });
      }
    } catch (error) {
      console.error('Error loading products for dropdowns:', error);
    }
  }

  // Populate individual product dropdown
  populateProductDropdown(select) {
    if (!select) return;

    // Clear and add default option
    select.innerHTML = '<option value="">-- Select from inventory or enter manually --</option>';

    // Add product options
    this.availableProducts.forEach(product => {
      const option = document.createElement('option');
      option.value = product.id;
      option.textContent = `${product.name} (Stock: ${product.stock || 0}) - ₹${(product.price || 0).toFixed(2)} [GST: ${(product.gstRate || 0)}%]`;
      option.setAttribute('data-product', JSON.stringify(product));
      select.appendChild(option);
    });

    // Add change event listener
    select.removeEventListener('change', this.handleProductSelection);
    select.addEventListener('change', this.handleProductSelection.bind(this));
  }

  // Handle product selection
  handleProductSelection(e) {
    const select = e.target;
    const itemRow = select.closest('.item-row');

    if (select.value) {
      const productData = JSON.parse(select.options[select.selectedIndex].getAttribute('data-product'));

      if (productData) {
        // Auto-fill product details
        itemRow.querySelector('.item-description').value = productData.name;
        itemRow.querySelector('.item-hsn').value = productData.hsn || '';
        itemRow.querySelector('.item-price').value = productData.price || 0;

        // Set GST rate
        const gstRate = productData.gstRate || 0;
        const gstRateSelect = itemRow.querySelector('.item-gst-rate');
        const standardRates = [0, 5, 12, 18, 28];
        let closestRate = standardRates.reduce((prev, curr) =>
          Math.abs(curr - gstRate) < Math.abs(prev - gstRate) ? curr : prev
        );
        gstRateSelect.value = closestRate;

        // Calculate total and add stock warning
        this.calculateItemTotal(itemRow);
        this.addStockWarning(itemRow, productData);
      }
    } else {
      // Clear auto-filled data
      itemRow.querySelector('.item-description').value = '';
      itemRow.querySelector('.item-hsn').value = '';
      itemRow.querySelector('.item-price').value = '';
      itemRow.querySelector('.item-total').value = '';
      this.removeStockWarning(itemRow);
      this.updateTotals();
    }
  }

  // Add stock warning
  addStockWarning(itemRow, productData) {
    this.removeStockWarning(itemRow);

    const quantityInput = itemRow.querySelector('.item-quantity');
    const quantity = parseFloat(quantityInput.value) || 0;
    const availableStock = productData.stock || 0;

    let warningDiv = null;

    if (availableStock === 0) {
      warningDiv = document.createElement('div');
      warningDiv.className = 'stock-error';
      warningDiv.textContent = 'Product is out of stock!';
    } else if (quantity > availableStock) {
      warningDiv = document.createElement('div');
      warningDiv.className = 'stock-error';
      warningDiv.textContent = `Insufficient stock! Available: ${availableStock}`;
    } else if (availableStock <= 10) {
      warningDiv = document.createElement('div');
      warningDiv.className = 'stock-warning';
      warningDiv.textContent = `Low stock warning! Available: ${availableStock}`;
    }

    if (warningDiv) {
      quantityInput.parentNode.appendChild(warningDiv);
    }
  }

  // Remove stock warning
  removeStockWarning(itemRow) {
    const warnings = itemRow.querySelectorAll('.stock-warning, .stock-error');
    warnings.forEach(warning => warning.remove());
  }

  // Setup item calculations
  setupItemCalculations() {
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('item-quantity') || e.target.classList.contains('item-price')) {
        const itemRow = e.target.closest('.item-row');
        if (itemRow) {
          this.calculateItemTotal(itemRow);

          // Check stock warnings for quantity changes
          const productSelect = itemRow.querySelector('.product-select');
          if (productSelect && productSelect.value) {
            const productData = JSON.parse(productSelect.options[productSelect.selectedIndex].getAttribute('data-product'));
            if (productData) {
              this.addStockWarning(itemRow, productData);
            }
          }
        }
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('item-gst-rate')) {
        const itemRow = e.target.closest('.item-row');
        if (itemRow) {
          this.calculateItemTotal(itemRow);
        }
      }
    });
  }

  // Calculate item total
  calculateItemTotal(itemRow) {
    this.updateTotals();
  }

  // Update all totals
  updateTotals() {
    const itemRows = document.querySelectorAll('.item-row');
    let subtotal = 0;
    let totalCgstAmount = 0;
    let totalSgstAmount = 0;

    itemRows.forEach(row => {
      const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
      const price = parseFloat(row.querySelector('.item-price').value) || 0;
      const gstRate = parseFloat(row.querySelector('.item-gst-rate').value) || 0;

      const itemSubtotal = quantity * price;
      const itemGstAmount = itemSubtotal * (gstRate / 100);
      const itemCgst = itemGstAmount / 2;
      const itemSgst = itemGstAmount / 2;

      subtotal += itemSubtotal;
      totalCgstAmount += itemCgst;
      totalSgstAmount += itemSgst;

      const itemTotal = itemSubtotal + itemGstAmount;
      row.querySelector('.item-total').value = itemTotal.toFixed(2);
    });

    const totalGstAmount = totalCgstAmount + totalSgstAmount;
    const grandTotal = subtotal + totalGstAmount;

    document.getElementById('subtotal-display').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('gst-display').textContent = `₹${totalGstAmount.toFixed(2)} (CGST: ₹${totalCgstAmount.toFixed(2)} + SGST: ₹${totalSgstAmount.toFixed(2)})`;
    document.getElementById('grand-total-display').textContent = `₹${grandTotal.toFixed(2)}`;
  }

  // Add new item handler
  addNewItemHandler(e) {
    e.preventDefault();
    this.addNewItem();
  }

  // Add new item
  addNewItem() {
    const container = document.getElementById('items-container');
    const newItem = this.createItemRow(this.itemIndex);
    container.appendChild(newItem);
    this.itemIndex++;
    this.populateProductDropdown(newItem.querySelector('.product-select'));
  }

  // Create item row
  createItemRow(index) {
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    itemRow.setAttribute('data-index', index);

    itemRow.innerHTML = `
      <div class="item-fields">
        <div class="field-group">
          <label>Product</label>
          <select class="product-select">
            <option value="">-- Select from inventory or enter manually --</option>
          </select>
        </div>
        <div class="field-group">
          <label>Description</label>
          <input type="text" class="item-description" required>
        </div>
        <div class="field-group">
          <label>HSN Code</label>
          <input type="text" class="item-hsn">
        </div>
        <div class="field-group">
          <label>Quantity</label>
          <input type="number" class="item-quantity" min="0" step="0.01" required>
        </div>
        <div class="field-group">
          <label>Price (₹)</label>
          <input type="number" class="item-price" min="0" step="0.01" required>
        </div>
        <div class="field-group">
          <label>GST Rate (%)</label>
          <select class="item-gst-rate" required>
            <option value="">Select GST</option>
            <option value="0">0%</option>
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
          </select>
        </div>
        <div class="field-group">
          <label>Total (₹)</label>
          <input type="number" class="item-total" readonly>
        </div>
        <div class="field-group">
          <button type="button" onclick="invoiceManager.removeItem(${index})" class="btn btn-danger">Remove</button>
        </div>
      </div>
    `;

    return itemRow;
  }

  // Remove item
  removeItem(index) {
    const itemRow = document.querySelector(`[data-index="${index}"]`);
    if (itemRow) {
      itemRow.remove();
      this.updateTotals();
    }

    // Prevent removing the last item
    const remainingItems = document.querySelectorAll('.item-row');
    if (remainingItems.length === 0) {
      this.addNewItem();
    }
  }

  // Generate invoice handler
  async generateInvoiceHandler(e) {
    e.preventDefault();
    const invoiceData = this.collectFormData();

    if (!this.validateFormData(invoiceData)) {
      return;
    }

    // Check stock availability
    for (const item of invoiceData.items) {
      if (item.productId) {
        const stockCheck = stockManager.checkStockAvailability(item.productId, item.quantity);
        if (!stockCheck.available) {
          alert(`Insufficient stock for ${item.description}. Available: ${stockCheck.availableStock}`);
          return;
        }
      }
    }

    // Get company logo
    const companyLogo = window.authManager ? await window.authManager.getCompanyLogo() : 'assets/images/logo.png';
    invoiceData.seller.logo = companyLogo;

    const invoice = generateInvoice(invoiceData);

    try {
      // Save invoice and process stock
      const invoiceId = await invoiceStorage.saveInvoice(invoice);
      const stockResult = await stockManager.processInvoiceItems(invoiceData.items);

      if (!stockResult.success) {
        console.error('Stock processing failed:', stockResult.message);
        alert('Warning: Invoice saved but stock update failed: ' + stockResult.message);
      }

      // Save buyer data
      const buyerData = {
        name: invoiceData.buyer.name,
        address: invoiceData.buyer.address,
        gst: invoiceData.buyer.gst
      };

      if (buyerData.name && authManager?.currentUser) {
        await buyerStorage.saveBuyer(buyerData);
      }

      this.currentInvoice = { invoiceData, invoice: { ...invoice, id: invoiceId } };

    } catch (error) {
      console.error('Error auto-saving invoice:', error);
      alert('Error saving invoice: ' + error.message);
      return;
    }

    this.displayInvoice(invoice);

    const invoiceOutput = document.getElementById('invoice-output');
    invoiceOutput.classList.remove('hidden');

    setTimeout(() => {
      invoiceOutput.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  }

  // Collect form data
  collectFormData() {
    const items = [];
    const itemRows = document.querySelectorAll('.item-row');

    itemRows.forEach(row => {
      const productSelect = row.querySelector('.product-select');
      const productId = productSelect ? productSelect.value : '';
      const description = row.querySelector('.item-description').value;
      const hsn = row.querySelector('.item-hsn').value || '';
      const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
      const price = parseFloat(row.querySelector('.item-price').value) || 0;
      const gstRate = parseFloat(row.querySelector('.item-gst-rate').value) || 0;
      const total = parseFloat(row.querySelector('.item-total').value) || 0;

      if (description && quantity > 0 && price >= 0) {
        const item = { description, hsn, quantity, price, gstRate, total };
        if (productId) {
          item.productId = productId;
        }
        items.push(item);
      }
    });

    return {
      seller: {
        name: document.getElementById('seller-name').value,
        address: document.getElementById('seller-address').value,
        gst: document.getElementById('seller-gst').value
      },
      buyer: {
        name: document.getElementById('buyer-name').value,
        address: document.getElementById('buyer-address').value,
        gst: document.getElementById('buyer-gst').value
      },
      items: items,
      customInvoiceNumber: document.getElementById('invoice-number').value.trim(),
      customDate: document.getElementById('invoice-date').value
    };
  }

  // Validate form data
  validateFormData(data) {
    if (!data.seller.name) {
      alert('Please enter seller name');
      return false;
    }
    if (!data.buyer.name) {
      alert('Please enter buyer name');
      return false;
    }
    if (!data.customDate) {
      alert('Please select invoice date');
      return false;
    }
    if (data.items.length === 0) {
      alert('Please add at least one item');
      return false;
    }
    return true;
  }

  // Display invoice
  displayInvoice(invoice) {
    const detailsElement = document.getElementById('invoice-details');

    let itemsHtml = '';
    invoice.items.forEach(item => {
      const itemSubtotal = item.quantity * item.price;
      const gstRate = item.gstRate || 0;
      const sgstRate = gstRate / 2;
      const cgstRate = gstRate / 2;
      itemsHtml += `
        <tr>
          <td>${item.description}${item.hsn ? `<br><small>HSN: ${item.hsn}</small>` : ''}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">₹${item.price.toFixed(2)}</td>
          <td class="text-right">${gstRate}% (${sgstRate}% + ${cgstRate}%)</td>
          <td class="text-right">₹${itemSubtotal.toFixed(2)}</td>
          <td class="text-right">₹${item.total.toFixed(2)}</td>
        </tr>
      `;
    });

    detailsElement.innerHTML = `
      <div class="invoice-preview">
        <div class="invoice-header">
          <h2>Invoice Preview</h2>
          <p>Invoice #${invoice.invoiceNumber}</p>
          <p>Date: ${invoice.date}</p>
        </div>
        
        <div class="invoice-details-grid">
          <div class="seller-details">
            <h3>From:</h3>
            <p>${invoice.seller.name}</p>
            <p>${invoice.seller.address}</p>
            ${invoice.seller.gst ? `<p>GST: ${invoice.seller.gst}</p>` : ''}
          </div>
          <div class="buyer-details">
            <h3>To:</h3>
            <p>${invoice.buyer.name}</p>
            <p>${invoice.buyer.address}</p>
            ${invoice.buyer.gst ? `<p>GST: ${invoice.buyer.gst}</p>` : ''}
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Price</th>
              <th>GST</th>
              <th>Subtotal</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div class="amount-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${(invoice.subtotal || 0).toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>CGST:</span>
            <span>₹${(invoice.cgstAmount || 0).toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>SGST:</span>
            <span>₹${(invoice.sgstAmount || 0).toFixed(2)}</span>
          </div>
          <div class="total-row grand-total">
            <span>Grand Total:</span>
            <span>₹${(invoice.totalAmount || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Download PDF handler
  async downloadPDFHandler(e) {
    e.preventDefault();

    if (!this.currentInvoice) {
      alert('Please generate an invoice first');
      return;
    }

    await this.generateInvoicePDF(this.currentInvoice.invoice);

    // Refresh saved invoices list if we're on that tab
    const savedInvoicesSection = document.getElementById('saved-invoices');
    if (!savedInvoicesSection.classList.contains('hidden')) {
      window.dashboardManager?.loadSavedInvoices();
    }
  }

  // Start new invoice handler
  startNewInvoiceHandler(e) {
    e.preventDefault();

    if (confirm('Are you sure you want to start a new invoice? Any unsaved changes will be lost.')) {
      this.resetForm();
    }
  }

  // Reset form
  resetForm() {
    // Reset the form
    document.getElementById('invoice-form').reset();

    // Reset invoice number and set today's date
    document.getElementById('invoice-number').value = '';
    document.getElementById('invoice-date').value = new Date().toISOString().split('T')[0];

    // Hide invoice output
    document.getElementById('invoice-output').classList.add('hidden');

    // Reset totals
    document.getElementById('subtotal-display').textContent = '₹0.00';
    document.getElementById('gst-display').textContent = '₹0.00';
    document.getElementById('grand-total-display').textContent = '₹0.00';

    // Reset items - keep only one item row
    const itemsContainer = document.getElementById('items-container');
    itemsContainer.innerHTML = '';
    const defaultItem = this.createItemRow(0);
    itemsContainer.appendChild(defaultItem);
    this.populateProductDropdown(defaultItem.querySelector('.product-select'));

    // Reset item index
    this.itemIndex = 1;

    // Clear current invoice
    this.currentInvoice = null;

    // Load default seller data again
    if (authManager && authManager.currentUser) {
      authManager.loadDefaultSellerData();
    }

    // Scroll back to top of form
    document.getElementById('create-invoice-section').scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  // View invoice (for saved invoices)
  async viewInvoice(invoice) {
    const newWindow = window.open('', '_blank');
    const htmlContent = await this.generateInvoiceHTML(invoice);
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  }

  // Download invoice (for saved invoices)
  async downloadInvoice(invoice) {
    await this.generateInvoicePDF(invoice);
  }

  // Generate invoice HTML
  async generateInvoiceHTML(invoice) {
    // Get company logo
    const logoUrl = window.authManager ? await window.authManager.getCompanyLogo() : 'assets/images/logo.png';

    let itemsHtml = '';
    invoice.items.forEach(item => {
      const itemSubtotal = item.quantity * item.price;
      const gstRate = item.gstRate || 0;
      const sgstRate = gstRate / 2;
      const cgstRate = gstRate / 2;
      itemsHtml += `
        <tr>
          <td>${item.description}${item.hsn ? `<br><small style="color: #666;">HSN: ${item.hsn}</small>` : ''}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">₹${item.price.toFixed(2)}</td>
          <td style="text-align: center;">${gstRate}% (${sgstRate}% + ${cgstRate}%)</td>
          <td style="text-align: right;">₹${itemSubtotal.toFixed(2)}</td>
          <td style="text-align: right;">₹${item.total.toFixed(2)}</td>
        </tr>
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 15px; line-height: 1.2; font-size: 14px; }
          .invoice-header { display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #333; }
          .invoice-logo { height: 80px; width: auto; margin-right: 20px; }
          .invoice-title-section { flex: 1; }
          .invoice-title-section h1 { margin: 0; font-size: 24px; color: #333; }
          .invoice-title-section p { margin: 5px 0; color: #666; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .details-section { padding: 10px; background-color: #f8f9fa; border-radius: 4px; }
          .details-section h3 { margin: 0 0 8px 0; font-size: 14px; }
          .details-section p { margin: 3px 0; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 6px 8px; text-align: left; border: 1px solid #ddd; font-size: 12px; }
          th { background-color: #f8f9fa; font-weight: bold; }
          .totals { text-align: right; margin-top: 15px; }
          .total-row { margin: 2px 0; font-size: 12px; }
          .final-total { font-weight: bold; font-size: 14px; border-top: 1px solid #333; padding-top: 5px; margin-top: 5px; }
          .payment-details { margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd; }
          .payment-details h3 { margin: 0 0 8px 0; font-size: 14px; }
          .payment-details p { margin: 2px 0; font-size: 11px; }
          .payment-grid { 
            display: grid; 
            grid-template-columns: 2fr 1fr; 
            gap: 15px; 
            align-items: start;
            min-height: 100px;
          }
          .banking-info { 
            min-height: 80px; 
          }
          .qr-section { 
            text-align: center; 
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .qr-section p { margin-bottom: 5px; font-size: 11px; }
          .qr-section img { height: 80px; width: 80px; }
          @media print {
            body { margin: 0; }
            .invoice-header { page-break-inside: avoid; }
            .details-grid { page-break-inside: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            .payment-grid { 
              display: grid !important; 
              grid-template-columns: 2fr 1fr !important; 
              gap: 10px !important; 
              align-items: start !important;
            }
            .qr-section { 
              text-align: center !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: center !important;
              align-items: center !important;
            }
            .qr-section img { height: 70px !important; width: 70px !important; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <img src="${logoUrl}" alt="Logo" class="invoice-logo">
          <div class="invoice-title-section">
            <h1>GST INVOICE</h1>
            <p>Invoice Number: ${invoice.invoiceNumber}</p>
            <p>Date: ${invoice.date}</p>
          </div>
        </div>
        
        <div class="details-grid">
          <div class="details-section">
            <h3>From:</h3>
            <p>${invoice.seller.name}</p>
            <p>${invoice.seller.address}</p>
            ${invoice.seller.gst ? `<p>GST: ${invoice.seller.gst}</p>` : ''}
          </div>
          <div class="details-section">
            <h3>To:</h3>
            <p>${invoice.buyer.name}</p>
            <p>${invoice.buyer.address}</p>
            ${invoice.buyer.gst ? `<p>GST: ${invoice.buyer.gst}</p>` : ''}
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Price</th>
              <th>GST</th>
              <th>Subtotal</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-row">Subtotal: ₹${(invoice.subtotal || 0).toFixed(2)}</div>
          <div class="total-row">CGST: ₹${(invoice.cgstAmount || 0).toFixed(2)}</div>
          <div class="total-row">SGST: ₹${(invoice.sgstAmount || 0).toFixed(2)}</div>
          <div class="total-row final-total">Grand Total: ₹${(invoice.totalAmount || 0).toFixed(2)}</div>
        </div>
        
        ${await this.getBankingDetailsHTML()}
      </body>
      </html>
    `;
  }

  // Generate invoice PDF
  async generateInvoicePDF(invoice) {
    const printWindow = window.open('', '_blank');
    const htmlContent = await this.generateInvoiceHTML(invoice);
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = function () {
      setTimeout(function () {
        printWindow.print();
      }, 500);
    };
  }

  // Get banking details HTML
  async getBankingDetailsHTML() {
    try {
      if (!authManager.currentUser) return '';

      const profile = await authManager.getUserProfile(authManager.currentUser.uid);
      if (!profile?.banking && !profile?.upiQrCode) return '';

      let bankingHtml = '<div class="payment-details"><h3>Payment Details:</h3>';
      bankingHtml += '<div class="payment-grid">';

      if (profile.banking) {
        const banking = profile.banking;
        bankingHtml += '<div class="banking-info">';
        if (banking.bankName) bankingHtml += `<p><strong>Bank:</strong> ${banking.bankName}</p>`;
        if (banking.accountHolder) bankingHtml += `<p><strong>Account Holder:</strong> ${banking.accountHolder}</p>`;
        if (banking.accountNumber) bankingHtml += `<p><strong>Account Number:</strong> ${banking.accountNumber}</p>`;
        if (banking.ifscCode) bankingHtml += `<p><strong>IFSC Code:</strong> ${banking.ifscCode}</p>`;
        if (banking.branchName) bankingHtml += `<p><strong>Branch:</strong> ${banking.branchName}</p>`;
        if (banking.upiId) bankingHtml += `<p><strong>UPI ID:</strong> ${banking.upiId}</p>`;
        bankingHtml += '</div>';
      } else {
        bankingHtml += '<div class="banking-info"></div>';
      }

      if (profile.upiQrCode) {
        bankingHtml += `<div class="qr-section" style="page-break-inside: avoid;">
          <p><strong>UPI QR Code:</strong></p>
          <img src="${profile.upiQrCode}" alt="UPI QR Code">
        </div>`;
      } else {
        bankingHtml += '<div class="qr-section"></div>';
      }

      bankingHtml += '</div></div>';
      return bankingHtml;
    } catch (error) {
      console.error('Error getting banking details:', error);
      return '';
    }
  }
}

// Create global instance
const invoiceManager = new InvoiceManager();

// Make it globally available
window.invoiceManager = invoiceManager;

export { invoiceManager };