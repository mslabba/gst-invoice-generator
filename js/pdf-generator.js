function generatePDF(invoiceData) {
    const invoice = generateInvoice(invoiceData);

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
                }
                .invoice-header h1 {
                    color: #2c3e50;
                    margin: 0;
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
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="invoice-header">
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
                            <td>GST (${invoice.gstRate}%):</td>
                            <td>₹${invoice.gstAmount.toFixed(2)}</td>
                        </tr>
                        <tr class="total-row">
                            <td><strong>Grand Total:</strong></td>
                            <td><strong>₹${invoice.totalAmount.toFixed(2)}</strong></td>
                        </tr>
                    </tbody>
                </table>
                
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

document.getElementById("download-btn").addEventListener("click", () => {
    const invoiceData = {
        buyer: {
            name: document.getElementById("buyer-name").value,
            gst: document.getElementById("buyer-gst").value
        },
        seller: {
            name: document.getElementById("seller-name").value,
            gst: document.getElementById("seller-gst").value
        },
        items: [
            { description: "Sample Item 1", amount: 100 },
            { description: "Sample Item 2", amount: 200 }
        ],
        totalAmount: 300,
        gstAmount: 7.5 // 2.5% of 300
    };

    generatePDF(invoiceData);
});