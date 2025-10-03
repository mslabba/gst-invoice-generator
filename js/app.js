document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('invoice-form');
    const generateBtn = document.getElementById('generate-invoice');
    const downloadBtn = document.getElementById('download-pdf');
    const invoiceOutput = document.getElementById('invoice-output');

    generateBtn.addEventListener('click', function () {
        // Get form values
        const sellerName = document.getElementById('seller-name').value;
        const sellerGST = document.getElementById('seller-gst').value;
        const buyerName = document.getElementById('buyer-name').value;
        const buyerGST = document.getElementById('buyer-gst').value;
        const amount = parseFloat(document.getElementById('amount').value);

        // Validate inputs
        if (!sellerName || !sellerGST || !buyerName || !buyerGST || !amount) {
            alert('Please fill in all fields');
            return;
        }

        // Generate invoice
        const invoice = generateInvoice({
            seller: { name: sellerName, gst: sellerGST },
            buyer: { name: buyerName, gst: buyerGST },
            amount: amount
        });

        // Display invoice
        displayInvoice(invoice);
        invoiceOutput.classList.remove('hidden');
    });

    downloadBtn.addEventListener('click', function () {
        const invoice = getCurrentInvoiceData();
        generatePDF(invoice);
    });
});

function displayInvoice(invoice) {
    const detailsElement = document.getElementById('invoice-details');
    const gstElement = document.getElementById('gst-amount');

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
                    <p><strong>GST Number:</strong> ${invoice.seller.gst}</p>
                </div>
                
                <div class="invoice-section">
                    <h3>Buyer Details:</h3>
                    <p><strong>Name:</strong> ${invoice.buyer.name}</p>
                    <p><strong>GST Number:</strong> ${invoice.buyer.gst}</p>
                </div>
            </div>
            
            <div class="amount-section">
                <div class="amount-row">
                    <span>Base Amount:</span>
                    <span>₹${invoice.baseAmount.toFixed(2)}</span>
                </div>
                <div class="amount-row">
                    <span>GST (2.5%):</span>
                    <span>₹${invoice.gstAmount.toFixed(2)}</span>
                </div>
                <div class="amount-row total-amount">
                    <span>Total Amount:</span>
                    <span>₹${invoice.totalAmount.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `;
}

function getCurrentInvoiceData() {
    return {
        seller: {
            name: document.getElementById('seller-name').value,
            gst: document.getElementById('seller-gst').value
        },
        buyer: {
            name: document.getElementById('buyer-name').value,
            gst: document.getElementById('buyer-gst').value
        },
        amount: parseFloat(document.getElementById('amount').value)
    };
}