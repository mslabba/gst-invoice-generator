function generateInvoice(data) {
    // Calculate totals with dynamic GST rates
    let subtotal = 0;
    let totalCgstAmount = 0;
    let totalSgstAmount = 0;

    data.items.forEach(item => {
        const itemSubtotal = item.quantity * item.price;
        const gstRate = (item.gstRate || 0) / 100; // Convert percentage to decimal
        const itemGstAmount = itemSubtotal * gstRate;
        const itemCgst = itemGstAmount / 2; // Half of total GST
        const itemSgst = itemGstAmount / 2; // Half of total GST

        subtotal += itemSubtotal;
        totalCgstAmount += itemCgst;
        totalSgstAmount += itemSgst;

        // Update item total to include GST (this should already be calculated in the UI)
        item.total = itemSubtotal + itemGstAmount;
    });

    const totalGstAmount = totalCgstAmount + totalSgstAmount;
    const totalAmount = subtotal + totalGstAmount;

    // Generate invoice number - use custom if provided, otherwise auto-generate
    const invoiceNumber = data.customInvoiceNumber || ('INV-' + Date.now().toString().slice(-6));

    // Get current date - use custom if provided, otherwise use today
    let currentDate;
    if (data.customDate && data.customDate.trim()) {
        try {
            // Convert from YYYY-MM-DD to DD/MM/YYYY format
            const dateObj = new Date(data.customDate + 'T00:00:00');
            if (isNaN(dateObj.getTime())) {
                // If date is invalid, use current date
                currentDate = new Date().toLocaleDateString('en-IN');
            } else {
                currentDate = dateObj.toLocaleDateString('en-IN');
            }
        } catch (error) {
            console.error('Error parsing date:', error);
            currentDate = new Date().toLocaleDateString('en-IN');
        }
    } else {
        currentDate = new Date().toLocaleDateString('en-IN');
    }

    return {
        invoiceNumber: invoiceNumber,
        date: currentDate,
        seller: data.seller,
        buyer: data.buyer,
        items: data.items,
        subtotal: subtotal,
        cgstAmount: totalCgstAmount,
        sgstAmount: totalSgstAmount,
        totalGstAmount: totalGstAmount,
        totalAmount: totalAmount
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