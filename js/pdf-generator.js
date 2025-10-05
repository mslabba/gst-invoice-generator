async function generatePDF(invoiceData) {
    const invoice = generateInvoice(invoiceData);

    // Get company logo
    const logoUrl = window.authManager ? await window.authManager.getCompanyLogo() : 'assets/images/logo.png';

    // Create items table HTML
    let itemsTableHtml = '';
    invoice.items.forEach(item => {
        itemsTableHtml += `
            <tr>
                <td>${item.description}</td>
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
                    margin: 0;
                    padding: 20px;
                    color: #333;
                    line-height: 1.4;
                }
                .invoice-container {
                    max-width: 800px;
                    margin: 0 auto;
                }
                .invoice-header {
                    text-align: center;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                    position: relative;
                }
                .invoice-header h1 {
                    color: #2c3e50;
                    margin: 10px 0 0 0;
                }
                .invoice-logo {
                    height: 60px;
                    width: auto;
                    margin-bottom: 10px;
                }
                .invoice-logo {
                    margin-bottom: 15px;
                    text-align: center;
                }
                .invoice-logo img {
                    max-height: 80px;
                    max-width: 200px;
                    object-fit: contain;
                    display: block;
                    margin: 0 auto;
                    border: none;
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                }
                .invoice-logo {
                    margin-bottom: 15px;
                    text-align: center;
                }
                .invoice-logo img {
                    max-height: 80px;
                    max-width: 200px;
                    object-fit: contain;
                    display: block;
                    margin: 0 auto;
                    border: none;
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                }
                .invoice-details {
                    display: table;
                    width: 100%;
                    margin-bottom: 30px;
                }
                .seller-buyer {
                    display: table-row;
                }
                .seller, .buyer {
                    display: table-cell;
                    width: 50%;
                    padding: 15px;
                    vertical-align: top;
                }
                .seller {
                    border-right: 1px solid #ddd;
                }
                .section-title {
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 10px;
                    font-size: 1.1em;
                }
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .items-table th,
                .items-table td {
                    padding: 10px;
                    text-align: left;
                    border: 1px solid #ddd;
                }
                .items-table th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                }
                .amount-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 30px;
                }
                .amount-table th,
                .amount-table td {
                    padding: 10px;
                    text-align: right;
                    border: 1px solid #ddd;
                }
                .amount-table th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                }
                .total-row {
                    font-weight: bold;
                    background-color: #e9ecef;
                }
                .footer {
                    margin-top: 50px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                }
                @media print {
                    body { 
                        margin: 0; 
                        line-height: 1.4 !important;
                    }
                    .no-print { display: none; }
                    .invoice-logo img {
                        max-height: 80px;
                        max-width: 200px;
                        object-fit: contain;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                    .invoice-container { 
                        line-height: 1.4 !important; 
                    }
                    .items-table td, .items-table th {
                        line-height: 1.4 !important;
                        padding: 8px !important;
                    }
                    .amount-table td, .amount-table th {
                        line-height: 1.4 !important;
                        padding: 8px !important;
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
                    <div class="seller-buyer">
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

        let bankingHtml = `
            <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #ddd; page-break-inside: avoid;">
                <h3 style="color: #2c3e50; margin-bottom: 12px; line-height: 1.3;">Payment Details:</h3>
        `;

        if (profile.banking) {
            const banking = profile.banking;
            bankingHtml += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">';

            bankingHtml += '<div>';
            if (banking.bankName) bankingHtml += `<p><strong>Bank:</strong> ${banking.bankName}</p>`;
            if (banking.accountHolder) bankingHtml += `<p><strong>Account Holder:</strong> ${banking.accountHolder}</p>`;
            if (banking.accountNumber) bankingHtml += `<p><strong>Account Number:</strong> ${banking.accountNumber}</p>`;
            bankingHtml += '</div>';

            bankingHtml += '<div>';
            if (banking.ifscCode) bankingHtml += `<p><strong>IFSC Code:</strong> ${banking.ifscCode}</p>`;
            if (banking.branchName) bankingHtml += `<p><strong>Branch:</strong> ${banking.branchName}</p>`;
            if (banking.upiId) bankingHtml += `<p><strong>UPI ID:</strong> ${banking.upiId}</p>`;
            bankingHtml += '</div>';

            bankingHtml += '</div>';
        }

        if (profile.upiQrCode) {
            bankingHtml += `
                <div style="text-align: center; margin-top: 15px; page-break-inside: avoid;">
                    <p style="margin-bottom: 8px;"><strong>Scan to Pay:</strong></p>
                    <img src="${profile.upiQrCode}" alt="UPI QR Code" style="height: 100px; width: 100px; border: 1px solid #ddd; display: inline-block;">
                </div>
            `;
        }

        bankingHtml += '</div>';
        return bankingHtml;
    } catch (error) {
        console.error('Error getting banking details for PDF:', error);
        return '';
    }
}

// PDF generator functions are available globally
// Event listeners are handled in individual pages (index.html and dashboard.html)