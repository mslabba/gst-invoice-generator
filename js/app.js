import { invoiceStorage } from './invoice-storage.js';
import { buyerStorage } from './buyer-storage.js';

let itemIndex = 1; // Move this to global scope
let currentInvoice = null; // Store current invoice for saving

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('invoice-form');
    const generateBtn = document.getElementById('generate-invoice');
    const downloadBtn = document.getElementById('download-pdf');
    const invoiceOutput = document.getElementById('invoice-output');
    const addItemBtn = document.getElementById('add-item-btn');
    const saveInvoiceBtn = document.getElementById('save-invoice');

    // Add item functionality
    addItemBtn.addEventListener('click', function (e) {
        e.preventDefault();
        addNewItem();
    });

    // Generate invoice functionality
    generateBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const invoiceData = collectFormData();

        if (!validateFormData(invoiceData)) {
            return;
        }

        const invoice = generateInvoice(invoiceData);
        currentInvoice = { invoiceData, invoice }; // Store for saving
        displayInvoice(invoice);
        invoiceOutput.classList.remove('hidden');
    });

    // Download PDF functionality
    downloadBtn.addEventListener('click', async function (e) {
        e.preventDefault();
        const invoiceData = collectFormData();
        await generatePDF(invoiceData);
    });

    // Save invoice functionality
    if (saveInvoiceBtn) {
        saveInvoiceBtn.addEventListener('click', async function (e) {
            e.preventDefault();
            console.log('Save button clicked');

            if (!currentInvoice) {
                alert('Please generate an invoice first');
                return;
            }

            console.log('Attempting to save invoice:', currentInvoice.invoice);
            console.log('Current user:', window.authManager?.currentUser?.email);

            // Show saving message
            saveInvoiceBtn.textContent = 'Saving...';
            saveInvoiceBtn.disabled = true;

            try {
                const result = await invoiceStorage.saveInvoice(currentInvoice.invoice);
                console.log('Save result:', result);

                if (result.success) {
                    alert('Invoice saved successfully! ID: ' + result.id);
                    saveInvoiceBtn.textContent = 'Saved ✓';
                    setTimeout(() => {
                        saveInvoiceBtn.textContent = 'Save Invoice';
                        saveInvoiceBtn.disabled = false;
                    }, 2000);
                } else {
                    alert('Failed to save invoice: ' + result.message);
                    saveInvoiceBtn.textContent = 'Save Invoice';
                    saveInvoiceBtn.disabled = false;
                }
            } catch (error) {
                console.error('Error saving invoice:', error);
                alert('Error saving invoice: ' + error.message);
                saveInvoiceBtn.textContent = 'Save Invoice';
                saveInvoiceBtn.disabled = false;
            }
        });
    }

    // Initialize calculations for the first item
    setupItemCalculations();

    // Initialize buyer functionality
    initializeBuyerFunctionality();
});

function addNewItem() {
    const container = document.getElementById('items-container');
    const newItem = createItemRow(itemIndex);
    container.appendChild(newItem);
    setupItemCalculations(itemIndex);
    itemIndex++;
}

function createItemRow(index) {
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    itemRow.setAttribute('data-index', index);

    itemRow.innerHTML = `
        <div class="item-fields">
            <div class="field-group">
                <label>Item Description:</label>
                <input type="text" class="item-description" placeholder="Enter item description" required>
            </div>
            <div class="field-group">
                <label>Quantity:</label>
                <input type="number" class="item-quantity" min="1" step="0.01" value="1" required>
            </div>
            <div class="field-group">
                <label>Unit Price (₹):</label>
                <input type="number" class="item-price" min="0" step="0.01" placeholder="0.00" required>
            </div>
            <div class="field-group">
                <label>Total (₹):</label>
                <input type="number" class="item-total" readonly>
            </div>
            <div class="field-group">
                <button type="button" class="remove-item-btn" onclick="removeItem(${index})">Remove</button>
            </div>
        </div>
    `;

    return itemRow;
}

function removeItem(index) {
    const itemRow = document.querySelector(`[data-index="${index}"]`);
    if (itemRow) {
        itemRow.remove();
        updateTotals();
    }

    // Prevent removing the last item
    const remainingItems = document.querySelectorAll('.item-row');
    if (remainingItems.length === 0) {
        addNewItem();
    }
}

function setupItemCalculations(specificIndex = null) {
    const items = specificIndex !== null ?
        [document.querySelector(`[data-index="${specificIndex}"]`)] :
        document.querySelectorAll('.item-row');

    items.forEach(item => {
        if (!item) return;

        const quantityInput = item.querySelector('.item-quantity');
        const priceInput = item.querySelector('.item-price');
        const totalInput = item.querySelector('.item-total');

        function calculateItemTotal() {
            const quantity = parseFloat(quantityInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            const total = quantity * price;
            totalInput.value = total.toFixed(2);
            updateTotals();
        }

        // Remove any existing event listeners to avoid duplicates
        quantityInput.removeEventListener('input', calculateItemTotal);
        priceInput.removeEventListener('input', calculateItemTotal);

        quantityInput.addEventListener('input', calculateItemTotal);
        priceInput.addEventListener('input', calculateItemTotal);
    });
}

function updateTotals() {
    const itemTotals = document.querySelectorAll('.item-total');
    let subtotal = 0;

    itemTotals.forEach(totalInput => {
        subtotal += parseFloat(totalInput.value) || 0;
    });

    const cgstAmount = subtotal * 0.025; // 2.5% CGST
    const sgstAmount = subtotal * 0.025; // 2.5% SGST
    const totalGstAmount = cgstAmount + sgstAmount;
    const grandTotal = subtotal + totalGstAmount;

    document.getElementById('subtotal-display').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('gst-display').textContent = `₹${totalGstAmount.toFixed(2)} (CGST: ₹${cgstAmount.toFixed(2)} + SGST: ₹${sgstAmount.toFixed(2)})`;
    document.getElementById('grand-total-display').textContent = `₹${grandTotal.toFixed(2)}`;
}

function collectFormData() {
    const items = [];
    const itemRows = document.querySelectorAll('.item-row');

    itemRows.forEach(row => {
        const description = row.querySelector('.item-description').value;
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const total = parseFloat(row.querySelector('.item-total').value) || 0;

        if (description && quantity > 0 && price >= 0) {
            items.push({ description, quantity, price, total });
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
        items: items
    };
}

function validateFormData(data) {
    if (!data.seller.name) {
        alert('Please enter seller name');
        return false;
    }

    if (!data.buyer.name) {
        alert('Please enter buyer name');
        return false;
    }

    if (data.items.length === 0) {
        alert('Please add at least one item');
        return false;
    }

    return true;
}

function displayInvoice(invoice) {
    const detailsElement = document.getElementById('invoice-details');

    let itemsHtml = '';
    invoice.items.forEach(item => {
        itemsHtml += `
            <tr>
                <td>${item.description}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">₹${item.price.toFixed(2)}</td>
                <td class="text-right">₹${item.total.toFixed(2)}</td>
            </tr>
        `;
    });

    detailsElement.innerHTML = `
        <div class="invoice-preview">
            <div class="invoice-header">
                <h2>GST INVOICE</h2>
                <p>Invoice #: ${invoice.invoiceNumber}</p>
                <p>Date: ${invoice.date}</p>
            </div>
            
            <div class="invoice-details-grid">
                <div class="invoice-section">
                    <h3>Seller Details:</h3>
                    <p><strong>Name:</strong> ${invoice.seller.name}</p>
                    ${invoice.seller.address ? `<p><strong>Address:</strong> ${invoice.seller.address}</p>` : ''}
                    ${invoice.seller.gst ? `<p><strong>GST Number:</strong> ${invoice.seller.gst}</p>` : ''}
                </div>
                
                <div class="invoice-section">
                    <h3>Buyer Details:</h3>
                    <p><strong>Name:</strong> ${invoice.buyer.name}</p>
                    ${invoice.buyer.address ? `<p><strong>Address:</strong> ${invoice.buyer.address}</p>` : ''}
                    ${invoice.buyer.gst ? `<p><strong>GST Number:</strong> ${invoice.buyer.gst}</p>` : ''}
                </div>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th class="text-right">Quantity</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            
            <div class="amount-section">
                <div class="amount-row">
                    <span>Subtotal:</span>
                    <span>₹${invoice.subtotal.toFixed(2)}</span>
                </div>
                <div class="amount-row">
                    <span>CGST (2.5%):</span>
                    <span>₹${invoice.cgstAmount.toFixed(2)}</span>
                </div>
                <div class="amount-row">
                    <span>SGST (2.5%):</span>
                    <span>₹${invoice.sgstAmount.toFixed(2)}</span>
                </div>
                <div class="amount-row">
                    <span>Total GST:</span>
                    <span>₹${invoice.totalGstAmount.toFixed(2)}</span>
                </div>
                <div class="amount-row total-amount">
                    <span>Total Amount:</span>
                    <span>₹${invoice.totalAmount.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `;
}

// Buyer functionality
async function initializeBuyerFunctionality() {
    const buyerSelect = document.getElementById('buyer-select');
    const buyerNameInput = document.getElementById('buyer-name');
    const buyerAddressInput = document.getElementById('buyer-address');
    const buyerGstInput = document.getElementById('buyer-gst');

    // Load existing buyers
    await loadBuyers();

    // Handle buyer selection
    buyerSelect.addEventListener('change', function () {
        const selectedValue = this.value;
        if (selectedValue) {
            const buyerData = JSON.parse(selectedValue);
            buyerNameInput.value = buyerData.name || '';
            buyerAddressInput.value = buyerData.address || '';
            buyerGstInput.value = buyerData.gst || '';
        }
    });

    // Auto-save buyer when GST is entered/changed
    buyerGstInput.addEventListener('blur', async function () {
        const gst = this.value.trim();
        if (gst && window.authManager?.currentUser) {
            // Check if buyer exists
            const existingBuyer = await buyerStorage.getBuyerByGST(gst);
            if (existingBuyer) {
                // Populate fields with existing data
                buyerNameInput.value = existingBuyer.name || '';
                buyerAddressInput.value = existingBuyer.address || '';
            }
        }
    });

    // Save buyer when form is generated
    document.getElementById('generate-invoice').addEventListener('click', async function () {
        const buyerData = {
            name: buyerNameInput.value.trim(),
            address: buyerAddressInput.value.trim(),
            gst: buyerGstInput.value.trim()
        };

        if (buyerData.name && window.authManager?.currentUser) {
            await buyerStorage.saveBuyer(buyerData);
            await loadBuyers(); // Refresh the dropdown
        }
    });
}

async function loadBuyers() {
    const buyerSelect = document.getElementById('buyer-select');
    if (!buyerSelect || !window.authManager?.currentUser) return;

    const result = await buyerStorage.getAllBuyers();
    if (result.success) {
        // Clear existing options except the first one
        buyerSelect.innerHTML = '<option value="">-- Select a buyer or enter new details --</option>';

        result.buyers.forEach(buyer => {
            const option = document.createElement('option');
            option.value = JSON.stringify(buyer);
            option.textContent = `${buyer.name}${buyer.gst ? ` (${buyer.gst})` : ''}`;
            buyerSelect.appendChild(option);
        });
    }
}