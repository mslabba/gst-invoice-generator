async function generatePDF(invoiceData) {
    // Get company logo and add it to seller data if not already present
    const logoUrl = window.authManager ? await window.authManager.getCompanyLogo() : 'assets/images/logo.png';
    if (!invoiceData.seller.logo) {
        invoiceData.seller.logo = logoUrl;
    }

    const invoice = generateInvoice(invoiceData);

    // Create items table HTML
    let itemsTableHtml = '';
    invoice.items.forEach(item => {
        itemsTableHtml += `
            <tr>
                <td>${item.description}${item.hsn ? `<br><small style="color: #666;">HSN: ${item.hsn}</small>` : ''}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">₹${item.price.toFixed(2)}</td>
                <td style="text-align: right;">₹${item.total.toFixed(2)}</td>
            </tr>
        `;
    });

    // Create a new window for printing
    const printWindow = window.open('', '_blank');

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice ${invoice.invoiceNumber}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 15px;
                    padding: 0;
                    color: #333;
                    line-height: 1.2;
                    font-size: 14px;
                }
                .invoice-container {
                    max-width: 100%;
                    margin: 0 auto;
                }
                .invoice-header {
                    text-align: center;
                    border-bottom: 2px solid #333;
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                    position: relative;
                }
                .invoice-header h1 {
                    color: #2c3e50;
                    margin: 8px 0 0 0;
                    font-size: 24px;
                }
                .invoice-header p {
                    margin: 3px 0;
                    font-size: 14px;
                }
                .invoice-logo {
                    margin-bottom: 8px;
                    text-align: center;
                }
                .invoice-logo img {
                    height: 45px;
                    width: auto;
                    object-fit: contain;
                    display: block;
                    margin: 0 auto;
                    border: none;
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                }
                .invoice-details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 20px;
                }
                .seller, .buyer {
                    padding: 10px;
                    background-color: #f8f9fa;
                    border-radius: 4px;
                    vertical-align: top;
                }
                .seller p, .buyer p {
                    margin: 3px 0;
                    font-size: 12px;
                }
                .section-title {
                    font-weight: bold;
                    color: #2c3e50;
                    margin: 0 0 8px 0;
                    font-size: 14px;
                }
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                }
                .items-table th,
                .items-table td {
                    padding: 6px 8px;
                    text-align: left;
                    border: 1px solid #ddd;
                    font-size: 12px;
                }
                .items-table th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                }
                .amount-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }
                .amount-table th,
                .amount-table td {
                    padding: 6px 8px;
                    text-align: right;
                    border: 1px solid #ddd;
                    font-size: 12px;
                }
                .amount-table th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                }
                .total-row {
                    font-weight: bold;
                    background-color: #e9ecef;
                    font-size: 14px;
                }
                .footer {
                    margin-top: 15px;
                    text-align: center;
                    font-size: 11px;
                    color: #666;
                }
                .payment-details {
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid #ddd;
                }
                .payment-details h3 {
                    margin: 0 0 8px 0;
                    font-size: 14px;
                    color: #2c3e50;
                }
                .payment-grid {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 15px;
                    align-items: start;
                }
                .payment-details p {
                    margin: 2px 0;
                    font-size: 11px;
                }
                .qr-section {
                    text-align: center;
                }
                .qr-section p {
                    margin-bottom: 5px;
                    font-size: 11px;
                }
                .qr-section img {
                    height: 80px;
                    width: 80px;
                }
                @media print {
                    body { 
                        margin: 10px !important; 
                        line-height: 1.2 !important;
                        font-size: 14px !important;
                    }
                    .no-print { display: none; }
                    .invoice-header { 
                        padding-bottom: 10px !important; 
                        margin-bottom: 15px !important; 
                    }
                    .invoice-details { 
                        margin-bottom: 15px !important; 
                        gap: 15px !important; 
                    }
                    .seller, .buyer { 
                        padding: 8px !important; 
                    }
                    .items-table { 
                        margin: 10px 0 !important; 
                    }
                    .amount-table { 
                        margin-top: 10px !important; 
                    }
                    .payment-details { 
                        margin-top: 10px !important; 
                        padding-top: 10px !important; 
                    }
                    .qr-section img { 
                        height: 70px !important; 
                        width: 70px !important; 
                    }
                    .invoice-logo img {
                        height: 40px !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                    .invoice-container { 
                        line-height: 1.2 !important; 
                    }
                    .items-table td, .items-table th {
                        line-height: 1.2 !important;
                        padding: 4px 6px !important;
                        font-size: 11px !important;
                    }
                    .amount-table td, .amount-table th {
                        line-height: 1.2 !important;
                        padding: 4px 6px !important;
                        font-size: 11px !important;
                    }
                    div[style*="page-break-inside: avoid"] {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="invoice-header">
                    ${invoice.seller.logo ? `<div class="invoice-logo"><img src="${invoice.seller.logo}" alt="Company Logo"></div>` : ''}
                    <h1>GST INVOICE</h1>
                    <p>Invoice Number: ${invoice.invoiceNumber}</p>
                    <p>Date: ${invoice.date}</p>
                </div>
                
                <div class="invoice-details">
                    <div class="seller">
                        <div class="section-title">Seller Details:</div>
                        <p><strong>Name:</strong> ${invoice.seller.name}</p>
                        ${invoice.seller.address ? `<p><strong>Address:</strong> ${invoice.seller.address}</p>` : ''}
                        ${invoice.seller.gst ? `<p><strong>GST Number:</strong> ${invoice.seller.gst}</p>` : ''}
                    </div>
                    <div class="buyer">
                        <div class="section-title">Buyer Details:</div>
                        <p><strong>Name:</strong> ${invoice.buyer.name}</p>
                        ${invoice.buyer.address ? `<p><strong>Address:</strong> ${invoice.buyer.address}</p>` : ''}
                        ${invoice.buyer.gst ? `<p><strong>GST Number:</strong> ${invoice.buyer.gst}</p>` : ''}
                    </div>
                </div>
                
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Item Description</th>
                            <th style="text-align: center;">Quantity</th>
                            <th style="text-align: right;">Unit Price (₹)</th>
                            <th style="text-align: right;">Total (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsTableHtml}
                    </tbody>
                </table>
                
                <table class="amount-table">
                    <tbody>
                        <tr>
                            <td><strong>Subtotal:</strong></td>
                            <td><strong>₹${invoice.subtotal.toFixed(2)}</strong></td>
                        </tr>
                        <tr>
                            <td>CGST (2.5%):</td>
                            <td>₹${invoice.cgstAmount.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>SGST (2.5%):</td>
                            <td>₹${invoice.sgstAmount.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td><strong>Total GST:</strong></td>
                            <td><strong>₹${invoice.totalGstAmount.toFixed(2)}</strong></td>
                        </tr>
                        <tr class="total-row">
                            <td><strong>Grand Total:</strong></td>
                            <td><strong>₹${invoice.totalAmount.toFixed(2)}</strong></td>
                        </tr>
                    </tbody>
                </table>
                
                ${await getBankingDetailsForPDF()}
                
                <div class="footer">
                    <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
                    <p>This is a computer generated invoice.</p>
                </div>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 30px;">
                <button onclick="window.print()" style="padding: 10px 20px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Print Invoice</button>
                <button onclick="window.close()" style="padding: 10px 20px; background-color: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Close</button>
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Auto-print when the content is loaded
    printWindow.onload = function () {
        setTimeout(function () {
            printWindow.print();
        }, 500);
    };
}

async function getBankingDetailsForPDF() {
    try {
        if (!window.authManager?.currentUser) return '';

        const profile = await window.authManager.getUserProfile(window.authManager.currentUser.uid);
        if (!profile?.banking && !profile?.upiQrCode) return '';

        let bankingHtml = '<div class="payment-details"><h3>Payment Details:</h3>';

        // Use grid layout to optimize space
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
        console.error('Error getting banking details for PDF:', error);
        return '';
    }
}

// PDF generator functions are available globally
// Event listeners are handled in individual pages (index.html and dashboard.html)