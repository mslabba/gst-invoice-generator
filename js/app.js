document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('invoice-form');
    const generateBtn = document.getElementById('generate-invoice');
    const downloadBtn = document.getElementById('download-pdf');
    const invoiceOutput = document.getElementById('invoice-output');
    const addItemBtn = document.getElementById('add-item-btn');

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
        displayInvoice(invoice);
        invoiceOutput.classList.remove('hidden');
    });

    // Download PDF functionality
    downloadBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const invoiceData = collectFormData();
        generatePDF(invoiceData);
    });

    // Initialize calculations for the first item
    setupItemCalculations();
});

let itemIndex = 1;

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