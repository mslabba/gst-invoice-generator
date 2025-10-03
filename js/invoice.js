function generateInvoice(data) {
    const gstRate = 0.025; // 2.5%

    // Calculate totals
    let subtotal = 0;
    data.items.forEach(item => {
        subtotal += item.total;
    });

    const gstAmount = subtotal * gstRate;
    const totalAmount = subtotal + gstAmount;

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
        gstAmount: gstAmount,
        totalAmount: totalAmount,
        gstRate: gstRate * 100 // Convert to percentage for display
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

function calculateGST(baseAmount, rate = 0.025) {
    return baseAmount * rate;
}