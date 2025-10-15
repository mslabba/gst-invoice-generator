/**
 * Payment Manager - Handles all payment operations
 * Manages Payment In (receipts from customers) and Payment Out (payments to suppliers)
 * Handles payment allocation to invoices and maintains party ledgers
 */

class PaymentManager {
    constructor() {
        this.db = window.databaseManager;
        this.currentPaymentIn = null;
        this.currentPaymentOut = null;
        this.paymentModes = [
            'Cash',
            'Bank Transfer',
            'UPI',
            'Cheque',
            'Credit Card',
            'Debit Card',
            'NEFT',
            'RTGS',
            'IMPS',
            'Other'
        ];
    }

    /**
     * Initialize the payment manager
     */
    async initialize() {
        if (!this.db) {
            throw new Error('Database manager not available');
        }
        await this.db.initialize();
        console.log('Payment Manager initialized');
    }

    // ==================== PAYMENT IN METHODS (Customer Receipts) ====================

    /**
     * Create payment in (receipt from customer)
     */
    async createPaymentIn(paymentData) {
        try {
            // Validate required fields
            this.validatePaymentInData(paymentData);

            const paymentIn = {
                receipt_date: paymentData.receipt_date || new Date().toISOString().split('T')[0],
                customer_id: paymentData.customer_id,
                payment_mode: paymentData.payment_mode,
                payment_reference: paymentData.payment_reference || '',
                bank_account_id: paymentData.bank_account_id || null,
                amount_received: parseFloat(paymentData.amount_received) || 0,
                unapplied_amount: 0,
                notes: paymentData.notes || '',
                created_by: paymentData.created_by || 'system',
                allocations: paymentData.allocations || []
            };

            // Calculate unapplied amount
            const totalAllocated = paymentIn.allocations.reduce((sum, alloc) => 
                sum + (parseFloat(alloc.amount_allocated) || 0), 0);
            paymentIn.unapplied_amount = paymentIn.amount_received - totalAllocated;

            // Create payment record
            const paymentId = await this.db.createPaymentIn(paymentIn);

            // Process allocations
            if (paymentIn.allocations && paymentIn.allocations.length > 0) {
                for (const allocation of paymentIn.allocations) {
                    await this.addPaymentInAllocation(paymentId, allocation);
                    await this.updateInvoicePaymentStatus(allocation.sales_invoice_id, allocation.amount_allocated);
                }
            }

            // Create customer ledger entry
            await this.createCustomerLedgerEntry(
                paymentData.customer_id, 
                paymentId, 
                'Payment', 
                paymentIn.amount_received, 
                'credit'
            );

            // Update bank/cash balance
            await this.updateAccountBalance(paymentData.payment_mode, paymentData.bank_account_id, paymentIn.amount_received, 'credit');

            this.currentPaymentIn = { id: paymentId, ...paymentIn };
            return paymentId;

        } catch (error) {
            console.error('Error creating payment in:', error);
            throw error;
        }
    }

    /**
     * Add payment allocation for payment in
     */
    async addPaymentInAllocation(paymentInId, allocationData) {
        try {
            const allocation = {
                payment_in_id: paymentInId,
                sales_invoice_id: allocationData.sales_invoice_id,
                amount_allocated: parseFloat(allocationData.amount_allocated) || 0
            };

            return await this.db.add('payment_in_allocations', allocation);

        } catch (error) {
            console.error('Error adding payment in allocation:', error);
            throw error;
        }
    }

    /**
     * Get payment in with allocations
     */
    async getPaymentIn(paymentId) {
        try {
            const payment = await this.db.getById('payments_in', paymentId);
            if (!payment) return null;

            const allocations = await this.db.getByField('payment_in_allocations', 'payment_in_id', paymentId);
            payment.allocations = allocations;

            return payment;

        } catch (error) {
            console.error('Error getting payment in:', error);
            throw error;
        }
    }

    /**
     * Get all payments in
     */
    async getAllPaymentsIn(customerId = null, startDate = null, endDate = null) {
        try {
            let payments;
            
            if (customerId) {
                payments = await this.db.getByField('payments_in', 'customer_id', customerId);
            } else {
                payments = await this.db.getAll('payments_in', 'receipt_date', 'desc');
            }

            // Filter by date range if provided
            if (startDate && endDate) {
                payments = payments.filter(payment => {
                    const paymentDate = new Date(payment.receipt_date);
                    return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate);
                });
            }

            return payments;

        } catch (error) {
            console.error('Error getting payments in:', error);
            throw error;
        }
    }

    // ==================== PAYMENT OUT METHODS (Supplier Payments) ====================

    /**
     * Create payment out (payment to supplier)
     */
    async createPaymentOut(paymentData) {
        try {
            // Validate required fields
            this.validatePaymentOutData(paymentData);

            const paymentOut = {
                payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
                supplier_id: paymentData.supplier_id,
                payment_mode: paymentData.payment_mode,
                payment_reference: paymentData.payment_reference || '',
                bank_account_id: paymentData.bank_account_id || null,
                cheque_number: paymentData.cheque_number || null,
                cheque_date: paymentData.cheque_date || null,
                amount_paid: parseFloat(paymentData.amount_paid) || 0,
                unapplied_amount: 0,
                notes: paymentData.notes || '',
                approved_by: paymentData.approved_by || null,
                created_by: paymentData.created_by || 'system',
                allocations: paymentData.allocations || []
            };

            // Calculate unapplied amount
            const totalAllocated = paymentOut.allocations.reduce((sum, alloc) => 
                sum + (parseFloat(alloc.amount_allocated) || 0), 0);
            paymentOut.unapplied_amount = paymentOut.amount_paid - totalAllocated;

            // Create payment record
            const paymentId = await this.db.createPaymentOut(paymentOut);

            // Process allocations
            if (paymentOut.allocations && paymentOut.allocations.length > 0) {
                for (const allocation of paymentOut.allocations) {
                    await this.addPaymentOutAllocation(paymentId, allocation);
                    await this.updatePurchaseInvoicePaymentStatus(allocation.purchase_invoice_id, allocation.amount_allocated);
                }
            }

            // Create supplier ledger entry
            await this.createSupplierLedgerEntry(
                paymentData.supplier_id, 
                paymentId, 
                'Payment', 
                paymentOut.amount_paid, 
                'debit'
            );

            // Update bank/cash balance
            await this.updateAccountBalance(paymentData.payment_mode, paymentData.bank_account_id, paymentOut.amount_paid, 'debit');

            this.currentPaymentOut = { id: paymentId, ...paymentOut };
            return paymentId;

        } catch (error) {
            console.error('Error creating payment out:', error);
            throw error;
        }
    }

    /**
     * Add payment allocation for payment out
     */
    async addPaymentOutAllocation(paymentOutId, allocationData) {
        try {
            const allocation = {
                payment_out_id: paymentOutId,
                purchase_invoice_id: allocationData.purchase_invoice_id,
                amount_allocated: parseFloat(allocationData.amount_allocated) || 0
            };

            return await this.db.add('payment_out_allocations', allocation);

        } catch (error) {
            console.error('Error adding payment out allocation:', error);
            throw error;
        }
    }

    /**
     * Get payment out with allocations
     */
    async getPaymentOut(paymentId) {
        try {
            const payment = await this.db.getById('payments_out', paymentId);
            if (!payment) return null;

            const allocations = await this.db.getByField('payment_out_allocations', 'payment_out_id', paymentId);
            payment.allocations = allocations;

            return payment;

        } catch (error) {
            console.error('Error getting payment out:', error);
            throw error;
        }
    }

    /**
     * Get all payments out
     */
    async getAllPaymentsOut(supplierId = null, startDate = null, endDate = null) {
        try {
            let payments;
            
            if (supplierId) {
                payments = await this.db.getByField('payments_out', 'supplier_id', supplierId);
            } else {
                payments = await this.db.getAll('payments_out', 'payment_date', 'desc');
            }

            // Filter by date range if provided
            if (startDate && endDate) {
                payments = payments.filter(payment => {
                    const paymentDate = new Date(payment.payment_date);
                    return paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate);
                });
            }

            return payments;

        } catch (error) {
            console.error('Error getting payments out:', error);
            throw error;
        }
    }

    // ==================== BANK ACCOUNT METHODS ====================

    /**
     * Create bank account
     */
    async createBankAccount(bankData) {
        try {
            this.validateBankAccountData(bankData);

            const bankAccount = {
                bank_name: bankData.bank_name,
                account_number: bankData.account_number,
                ifsc_code: bankData.ifsc_code,
                branch: bankData.branch || '',
                account_type: bankData.account_type || 'Current',
                opening_balance: parseFloat(bankData.opening_balance) || 0,
                current_balance: parseFloat(bankData.opening_balance) || 0,
                is_active: bankData.is_active !== false
            };

            return await this.db.add('bank_accounts', bankAccount);

        } catch (error) {
            console.error('Error creating bank account:', error);
            throw error;
        }
    }

    /**
     * Get all active bank accounts
     */
    async getActiveBankAccounts() {
        try {
            return await this.db.getByField('bank_accounts', 'is_active', true);
        } catch (error) {
            console.error('Error getting active bank accounts:', error);
            throw error;
        }
    }

    /**
     * Update account balance
     */
    async updateAccountBalance(paymentMode, bankAccountId, amount, type) {
        try {
            if (paymentMode === 'Cash') {
                // Handle cash balance (could be stored in a separate cash account)
                return;
            }

            if (bankAccountId) {
                const bankAccount = await this.db.getById('bank_accounts', bankAccountId);
                if (bankAccount) {
                    let newBalance = bankAccount.current_balance || 0;
                    
                    if (type === 'credit') {
                        newBalance += amount;
                    } else if (type === 'debit') {
                        newBalance -= amount;
                    }

                    await this.db.update('bank_accounts', bankAccountId, { 
                        current_balance: newBalance 
                    });
                }
            }

        } catch (error) {
            console.error('Error updating account balance:', error);
            throw error;
        }
    }

    // ==================== INVOICE PAYMENT STATUS METHODS ====================

    /**
     * Update sales invoice payment status
     */
    async updateInvoicePaymentStatus(invoiceId, paidAmount) {
        try {
            // This would typically update sales invoice, but since we're focusing on purchase module
            // we'll implement this when sales module is created
            console.log(`Updating sales invoice ${invoiceId} with payment ${paidAmount}`);
            
        } catch (error) {
            console.error('Error updating invoice payment status:', error);
            throw error;
        }
    }

    /**
     * Update purchase invoice payment status
     */
    async updatePurchaseInvoicePaymentStatus(invoiceId, paidAmount) {
        try {
            const invoice = await this.db.getById('purchase_invoices', invoiceId);
            if (!invoice) return;

            const newPaidAmount = (invoice.paid_amount || 0) + paidAmount;
            const totalAmount = invoice.total_amount || 0;

            let paymentStatus = 'Unpaid';
            if (newPaidAmount >= totalAmount) {
                paymentStatus = 'Paid';
            } else if (newPaidAmount > 0) {
                paymentStatus = 'Partially Paid';
            }

            await this.db.update('purchase_invoices', invoiceId, {
                paid_amount: newPaidAmount,
                payment_status: paymentStatus
            });

        } catch (error) {
            console.error('Error updating purchase invoice payment status:', error);
            throw error;
        }
    }

    // ==================== LEDGER METHODS ====================

    /**
     * Create customer ledger entry
     */
    async createCustomerLedgerEntry(customerId, transactionId, transactionType, amount, entryType) {
        try {
            const ledgerEntry = {
                party_type: 'Customer',
                party_id: customerId,
                transaction_date: new Date().toISOString(),
                transaction_type: transactionType,
                transaction_id: transactionId,
                transaction_number: '', // Will be filled based on transaction type
                description: `${transactionType} - ${transactionId}`,
                debit_amount: entryType === 'debit' ? amount : 0,
                credit_amount: entryType === 'credit' ? amount : 0,
                balance: 0 // Will be calculated
            };

            return await this.db.addLedgerEntry(ledgerEntry);

        } catch (error) {
            console.error('Error creating customer ledger entry:', error);
            throw error;
        }
    }

    /**
     * Create supplier ledger entry
     */
    async createSupplierLedgerEntry(supplierId, transactionId, transactionType, amount, entryType) {
        try {
            const ledgerEntry = {
                party_type: 'Supplier',
                party_id: supplierId,
                transaction_date: new Date().toISOString(),
                transaction_type: transactionType,
                transaction_id: transactionId,
                transaction_number: '', // Will be filled based on transaction type
                description: `${transactionType} - ${transactionId}`,
                debit_amount: entryType === 'debit' ? amount : 0,
                credit_amount: entryType === 'credit' ? amount : 0,
                balance: 0 // Will be calculated
            };

            return await this.db.addLedgerEntry(ledgerEntry);

        } catch (error) {
            console.error('Error creating supplier ledger entry:', error);
            throw error;
        }
    }

    // ==================== OUTSTANDING CALCULATION METHODS ====================

    /**
     * Get customer outstanding
     */
    async getCustomerOutstanding(customerId) {
        try {
            const ledgerEntries = await this.db.getPartyLedger('Customer', customerId);
            
            let balance = 0;
            ledgerEntries.forEach(entry => {
                balance += (entry.debit_amount || 0) - (entry.credit_amount || 0);
            });

            return {
                customer_id: customerId,
                outstanding_amount: balance,
                last_updated: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error getting customer outstanding:', error);
            throw error;
        }
    }

    /**
     * Get supplier outstanding
     */
    async getSupplierOutstanding(supplierId) {
        try {
            const ledgerEntries = await this.db.getPartyLedger('Supplier', supplierId);
            
            let balance = 0;
            ledgerEntries.forEach(entry => {
                balance += (entry.credit_amount || 0) - (entry.debit_amount || 0);
            });

            return {
                supplier_id: supplierId,
                outstanding_amount: balance,
                last_updated: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error getting supplier outstanding:', error);
            throw error;
        }
    }

    /**
     * Get all customer outstandings
     */
    async getAllCustomerOutstandings() {
        try {
            const customers = await this.db.getActiveCustomers();
            const outstandings = [];

            for (const customer of customers) {
                const outstanding = await this.getCustomerOutstanding(customer.id);
                if (outstanding.outstanding_amount !== 0) {
                    outstandings.push({
                        ...outstanding,
                        customer_name: customer.customer_name,
                        customer_code: customer.customer_code
                    });
                }
            }

            return outstandings;

        } catch (error) {
            console.error('Error getting all customer outstandings:', error);
            throw error;
        }
    }

    /**
     * Get all supplier outstandings
     */
    async getAllSupplierOutstandings() {
        try {
            const suppliers = await this.db.getActiveSuppliers();
            const outstandings = [];

            for (const supplier of suppliers) {
                const outstanding = await this.getSupplierOutstanding(supplier.id);
                if (outstanding.outstanding_amount !== 0) {
                    outstandings.push({
                        ...outstanding,
                        supplier_name: supplier.supplier_name,
                        supplier_code: supplier.supplier_code
                    });
                }
            }

            return outstandings;

        } catch (error) {
            console.error('Error getting all supplier outstandings:', error);
            throw error;
        }
    }

    // ==================== VALIDATION METHODS ====================

    validatePaymentInData(paymentData) {
        if (!paymentData.customer_id) {
            throw new Error('Customer is required');
        }
        if (!paymentData.payment_mode) {
            throw new Error('Payment mode is required');
        }
        if (!paymentData.amount_received || paymentData.amount_received <= 0) {
            throw new Error('Amount received must be greater than zero');
        }
        if (!this.paymentModes.includes(paymentData.payment_mode)) {
            throw new Error('Invalid payment mode');
        }
    }

    validatePaymentOutData(paymentData) {
        if (!paymentData.supplier_id) {
            throw new Error('Supplier is required');
        }
        if (!paymentData.payment_mode) {
            throw new Error('Payment mode is required');
        }
        if (!paymentData.amount_paid || paymentData.amount_paid <= 0) {
            throw new Error('Amount paid must be greater than zero');
        }
        if (!this.paymentModes.includes(paymentData.payment_mode)) {
            throw new Error('Invalid payment mode');
        }
        if (paymentData.payment_mode === 'Cheque' && !paymentData.cheque_number) {
            throw new Error('Cheque number is required for cheque payments');
        }
    }

    validateBankAccountData(bankData) {
        if (!bankData.bank_name) {
            throw new Error('Bank name is required');
        }
        if (!bankData.account_number) {
            throw new Error('Account number is required');
        }
        if (!bankData.ifsc_code) {
            throw new Error('IFSC code is required');
        }
    }

    // ==================== REPORTING METHODS ====================

    /**
     * Get payment summary for a date range
     */
    async getPaymentSummary(startDate, endDate) {
        try {
            const paymentsIn = await this.getAllPaymentsIn(null, startDate, endDate);
            const paymentsOut = await this.getAllPaymentsOut(null, startDate, endDate);

            const summary = {
                payments_in: {
                    count: paymentsIn.length,
                    total_amount: paymentsIn.reduce((sum, payment) => sum + (payment.amount_received || 0), 0)
                },
                payments_out: {
                    count: paymentsOut.length,
                    total_amount: paymentsOut.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0)
                },
                net_cash_flow: 0
            };

            summary.net_cash_flow = summary.payments_in.total_amount - summary.payments_out.total_amount;

            return summary;

        } catch (error) {
            console.error('Error getting payment summary:', error);
            throw error;
        }
    }

    /**
     * Get payment mode wise summary
     */
    async getPaymentModeWiseSummary(startDate, endDate) {
        try {
            const paymentsIn = await this.getAllPaymentsIn(null, startDate, endDate);
            const paymentsOut = await this.getAllPaymentsOut(null, startDate, endDate);

            const summary = {};

            // Initialize all payment modes
            this.paymentModes.forEach(mode => {
                summary[mode] = {
                    payments_in: { count: 0, amount: 0 },
                    payments_out: { count: 0, amount: 0 },
                    net_amount: 0
                };
            });

            // Process payments in
            paymentsIn.forEach(payment => {
                const mode = payment.payment_mode;
                if (summary[mode]) {
                    summary[mode].payments_in.count++;
                    summary[mode].payments_in.amount += payment.amount_received || 0;
                }
            });

            // Process payments out
            paymentsOut.forEach(payment => {
                const mode = payment.payment_mode;
                if (summary[mode]) {
                    summary[mode].payments_out.count++;
                    summary[mode].payments_out.amount += payment.amount_paid || 0;
                }
            });

            // Calculate net amounts
            Object.keys(summary).forEach(mode => {
                summary[mode].net_amount = 
                    summary[mode].payments_in.amount - summary[mode].payments_out.amount;
            });

            return summary;

        } catch (error) {
            console.error('Error getting payment mode wise summary:', error);
            throw error;
        }
    }
}

// Create global instance
window.paymentManager = new PaymentManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentManager;
}
