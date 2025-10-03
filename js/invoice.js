function generateInvoice(data) {
    const cgstRate = 0.025; // 2.5% CGST
    const sgstRate = 0.025; // 2.5% SGST

    // Calculate totals
    let subtotal = 0;
    data.items.forEach(item => {
        subtotal += item.total;
    });

    const cgstAmount = subtotal * cgstRate;
    const sgstAmount = subtotal * sgstRate;
    const totalGstAmount = cgstAmount + sgstAmount;
    const totalAmount = subtotal + totalGstAmount;

    // Generate invoice number
    const invoiceNumber = 'INV-' + Date.now().toString().slice(-6);

    // Get current date
    const currentDate = new Date().toLocaleDateString('en-IN');

    return {
        invoiceNumber: invoiceNumber,
        date: currentDate,
        seller: data.seller,
        buyer: data.buyer,
        items: data.items,
        subtotal: subtotal,
        cgstAmount: cgstAmount,
        sgstAmount: sgstAmount,
        totalGstAmount: totalGstAmount,
        totalAmount: totalAmount,
        cgstRate: cgstRate * 100, // Convert to percentage for display
        sgstRate: sgstRate * 100  // Convert to percentage for display
    };
}

function validateGSTNumber(gstNumber) {
    // Basic GST number validation (15 characters, alphanumeric)
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gstNumber);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

function calculateGST(baseAmount, cgstRate = 0.025, sgstRate = 0.025) {
    return {
        cgst: baseAmount * cgstRate,
        sgst: baseAmount * sgstRate,
        total: baseAmount * (cgstRate + sgstRate)
    };
}