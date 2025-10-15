/**
 * Purchase Manager - Handles all purchase-related operations
 * Manages Purchase Orders, Purchase Invoices, and Debit Notes
 * Integrates with inventory management for stock updates
 */

class PurchaseManager {
    constructor() {
        this.db = window.databaseManager;
        this.currentPO = null;
        this.currentInvoice = null;
        this.currentDebitNote = null;
    }

    /**
     * Initialize the purchase manager
     */
    async initialize() {
        if (!this.db) {
            throw new Error('Database manager not available');
        }
        await this.db.initialize();
        console.log('Purchase Manager initialized');
    }

    // ==================== PURCHASE ORDER METHODS ====================

    /**
     * Create a new purchase order
     */
    async createPurchaseOrder(poData) {
        try {
            // Validate required fields
            this.validatePOData(poData);

            // Set default values
            const purchaseOrder = {
                po_date: poData.po_date || new Date().toISOString().split('T')[0],
                supplier_id: poData.supplier_id,
                expected_delivery_date: poData.expected_delivery_date,
                subtotal: 0,
                tax_amount: 0,
                total_amount: 0,
                status: 'Draft',
                terms_conditions: poData.terms_conditions || '',
                notes: poData.notes || '',
                created_by: poData.created_by || 'system',
                items: poData.items || []
            };

            // Calculate totals
            this.calculatePOTotals(purchaseOrder);

            // Create PO
            const poId = await this.db.createPurchaseOrder(purchaseOrder);

            // Add PO items
            if (purchaseOrder.items && purchaseOrder.items.length > 0) {
                for (const item of purchaseOrder.items) {
                    await this.addPOItem(poId, item);
                }
            }

            this.currentPO = { id: poId, ...purchaseOrder };
            return poId;

        } catch (error) {
            console.error('Error creating purchase order:', error);
            throw error;
        }
    }

    /**
     * Add item to purchase order
     */
    async addPOItem(poId, itemData) {
        try {
            const item = {
                po_id: poId,
                product_id: itemData.product_id,
                description: itemData.description || '',
                quantity: parseFloat(itemData.quantity) || 0,
                unit_price: parseFloat(itemData.unit_price) || 0,
                tax_rate: parseFloat(itemData.tax_rate) || 0,
                amount: 0
            };

            // Calculate item amount
            item.amount = item.quantity * item.unit_price;
            const taxAmount = (item.amount * item.tax_rate) / 100;
            item.amount += taxAmount;

            return await this.db.add('purchase_order_items', item);

        } catch (error) {
            console.error('Error adding PO item:', error);
            throw error;
        }
    }

    /**
     * Update purchase order status
     */
    async updatePOStatus(poId, status) {
        try {
            const validStatuses = ['Draft', 'Sent', 'Partially Received', 'Completed', 'Cancelled'];
            if (!validStatuses.includes(status)) {
                throw new Error('Invalid PO status');
            }

            await this.db.update('purchase_orders', poId, { status: status });
            
            if (this.currentPO && this.currentPO.id === poId) {
                this.currentPO.status = status;
            }

            return true;

        } catch (error) {
            console.error('Error updating PO status:', error);
            throw error;
        }
    }

    /**
     * Get purchase order with items
     */
    async getPurchaseOrder(poId) {
        try {
            const po = await this.db.getById('purchase_orders', poId);
            if (!po) return null;

            const items = await this.db.getByField('purchase_order_items', 'po_id', poId);
            po.items = items;

            return po;

        } catch (error) {
            console.error('Error getting purchase order:', error);
            throw error;
        }
    }

    /**
     * Get all purchase orders
     */
    async getAllPurchaseOrders(status = null) {
        try {
            if (status) {
                return await this.db.getByField('purchase_orders', 'status', status);
            } else {
                return await this.db.getAll('purchase_orders', 'po_date', 'desc');
            }

        } catch (error) {
            console.error('Error getting purchase orders:', error);
            throw error;
        }
    }

    // ==================== PURCHASE INVOICE METHODS ====================

    /**
     * Create purchase invoice from PO or standalone
     */
    async createPurchaseInvoice(invoiceData) {
        try {
            // Validate required fields
            this.validateInvoiceData(invoiceData);

            const purchaseInvoice = {
                supplier_invoice_number: invoiceData.supplier_invoice_number,
                purchase_date: invoiceData.purchase_date || new Date().toISOString().split('T')[0],
                supplier_id: invoiceData.supplier_id,
                po_id: invoiceData.po_id || null,
                subtotal: 0,
                discount_amount: parseFloat(invoiceData.discount_amount) || 0,
                tax_amount: 0,
                round_off: parseFloat(invoiceData.round_off) || 0,
                total_amount: 0,
                payment_terms: invoiceData.payment_terms || 0,
                due_date: this.calculateDueDate(invoiceData.purchase_date, invoiceData.payment_terms),
                payment_status: 'Unpaid',
                paid_amount: 0,
                bill_attachment: invoiceData.bill_attachment || null,
                notes: invoiceData.notes || '',
                created_by: invoiceData.created_by || 'system',
                items: invoiceData.items || []
            };

            // Calculate totals
            this.calculateInvoiceTotals(purchaseInvoice);

            // Create invoice
            const invoiceId = await this.db.createPurchaseInvoice(purchaseInvoice);

            // Add invoice items and update inventory
            if (purchaseInvoice.items && purchaseInvoice.items.length > 0) {
                for (const item of purchaseInvoice.items) {
                    await this.addInvoiceItem(invoiceId, item);
                    
                    // Update product stock
                    await this.updateInventoryFromPurchase(item.product_id, item.quantity, invoiceId);
                }
            }

            // Create supplier ledger entry
            await this.createSupplierLedgerEntry(invoiceData.supplier_id, invoiceId, 'Invoice', purchaseInvoice.total_amount, 'debit');

            // Update PO status if linked
            if (invoiceData.po_id) {
                await this.updatePOStatus(invoiceData.po_id, 'Partially Received');
            }

            this.currentInvoice = { id: invoiceId, ...purchaseInvoice };
            return invoiceId;

        } catch (error) {
            console.error('Error creating purchase invoice:', error);
            throw error;
        }
    }

    /**
     * Add item to purchase invoice
     */
    async addInvoiceItem(invoiceId, itemData) {
        try {
            const item = {
                purchase_invoice_id: invoiceId,
                product_id: itemData.product_id,
                hsn_code: itemData.hsn_code || '',
                description: itemData.description || '',
                quantity: parseFloat(itemData.quantity) || 0,
                unit_price: parseFloat(itemData.unit_price) || 0,
                discount_amount: parseFloat(itemData.discount_amount) || 0,
                tax_rate: parseFloat(itemData.tax_rate) || 0,
                cgst_amount: 0,
                sgst_amount: 0,
                igst_amount: 0,
                amount: 0
            };

            // Calculate amounts
            const baseAmount = (item.quantity * item.unit_price) - item.discount_amount;
            const taxAmount = (baseAmount * item.tax_rate) / 100;

            // For simplicity, assuming CGST+SGST (can be modified for IGST)
            item.cgst_amount = taxAmount / 2;
            item.sgst_amount = taxAmount / 2;
            item.amount = baseAmount + taxAmount;

            return await this.db.add('purchase_invoice_items', item);

        } catch (error) {
            console.error('Error adding invoice item:', error);
            throw error;
        }
    }

    /**
     * Update inventory from purchase
     */
    async updateInventoryFromPurchase(productId, quantity, invoiceId) {
        try {
            // Update product stock
            await this.db.updateProductStock(productId, quantity, 'IN');

            // Record stock movement
            await this.db.add('stock_movements', {
                product_id: productId,
                movement_type: 'Purchase',
                reference_type: 'Purchase Invoice',
                reference_id: invoiceId,
                quantity: quantity,
                movement_date: new Date().toISOString()
            });

            // Update product purchase price
            const product = await this.db.getById('products', productId);
            if (product) {
                const invoiceItems = await this.db.getByField('purchase_invoice_items', 'purchase_invoice_id', invoiceId);
                const item = invoiceItems.find(i => i.product_id === productId);
                if (item) {
                    await this.db.update('products', productId, { 
                        purchase_price: item.unit_price,
                        last_purchase_date: new Date().toISOString()
                    });
                }
            }

        } catch (error) {
            console.error('Error updating inventory:', error);
            throw error;
        }
    }

    // ==================== DEBIT NOTE METHODS ====================

    /**
     * Create debit note (purchase return)
     */
    async createDebitNote(debitNoteData) {
        try {
            // Validate required fields
            this.validateDebitNoteData(debitNoteData);

            const debitNote = {
                debit_note_date: debitNoteData.debit_note_date || new Date().toISOString().split('T')[0],
                purchase_invoice_id: debitNoteData.purchase_invoice_id,
                supplier_id: debitNoteData.supplier_id,
                return_reason: debitNoteData.return_reason || '',
                subtotal: 0,
                tax_amount: 0,
                total_amount: 0,
                notes: debitNoteData.notes || '',
                created_by: debitNoteData.created_by || 'system',
                items: debitNoteData.items || []
            };

            // Calculate totals
            this.calculateDebitNoteTotals(debitNote);

            // Create debit note
            const debitNoteId = await this.db.add('debit_notes', {
                ...debitNote,
                debit_note_number: await this.db.getNextNumber('debit_notes')
            });

            // Add debit note items and update inventory
            if (debitNote.items && debitNote.items.length > 0) {
                for (const item of debitNote.items) {
                    await this.addDebitNoteItem(debitNoteId, item);
                    
                    // Update product stock (reduce)
                    await this.updateInventoryFromReturn(item.product_id, item.return_quantity, debitNoteId);
                }
            }

            // Create supplier ledger entry (credit)
            await this.createSupplierLedgerEntry(debitNoteData.supplier_id, debitNoteId, 'Debit Note', debitNote.total_amount, 'credit');

            this.currentDebitNote = { id: debitNoteId, ...debitNote };
            return debitNoteId;

        } catch (error) {
            console.error('Error creating debit note:', error);
            throw error;
        }
    }

    /**
     * Add item to debit note
     */
    async addDebitNoteItem(debitNoteId, itemData) {
        try {
            const item = {
                debit_note_id: debitNoteId,
                product_id: itemData.product_id,
                return_quantity: parseFloat(itemData.return_quantity) || 0,
                rate: parseFloat(itemData.rate) || 0,
                tax_rate: parseFloat(itemData.tax_rate) || 0,
                amount: 0
            };

            // Calculate amount
            const baseAmount = item.return_quantity * item.rate;
            const taxAmount = (baseAmount * item.tax_rate) / 100;
            item.amount = baseAmount + taxAmount;

            return await this.db.add('debit_note_items', item);

        } catch (error) {
            console.error('Error adding debit note item:', error);
            throw error;
        }
    }

    /**
     * Update inventory from return
     */
    async updateInventoryFromReturn(productId, quantity, debitNoteId) {
        try {
            // Update product stock (reduce)
            await this.db.updateProductStock(productId, quantity, 'OUT');

            // Record stock movement
            await this.db.add('stock_movements', {
                product_id: productId,
                movement_type: 'Return',
                reference_type: 'Debit Note',
                reference_id: debitNoteId,
                quantity: -quantity, // Negative for return
                movement_date: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error updating inventory from return:', error);
            throw error;
        }
    }

    // ==================== HELPER METHODS ====================

    /**
     * Calculate purchase order totals
     */
    calculatePOTotals(po) {
        let subtotal = 0;
        let taxAmount = 0;

        if (po.items && po.items.length > 0) {
            po.items.forEach(item => {
                const itemSubtotal = item.quantity * item.unit_price;
                const itemTax = (itemSubtotal * item.tax_rate) / 100;
                
                subtotal += itemSubtotal;
                taxAmount += itemTax;
            });
        }

        po.subtotal = subtotal;
        po.tax_amount = taxAmount;
        po.total_amount = subtotal + taxAmount;
    }

    /**
     * Calculate purchase invoice totals
     */
    calculateInvoiceTotals(invoice) {
        let subtotal = 0;
        let taxAmount = 0;

        if (invoice.items && invoice.items.length > 0) {
            invoice.items.forEach(item => {
                const itemSubtotal = (item.quantity * item.unit_price) - (item.discount_amount || 0);
                const itemTax = (itemSubtotal * item.tax_rate) / 100;
                
                subtotal += itemSubtotal;
                taxAmount += itemTax;
            });
        }

        invoice.subtotal = subtotal - (invoice.discount_amount || 0);
        invoice.tax_amount = taxAmount;
        invoice.total_amount = invoice.subtotal + invoice.tax_amount + (invoice.round_off || 0);
    }

    /**
     * Calculate debit note totals
     */
    calculateDebitNoteTotals(debitNote) {
        let subtotal = 0;
        let taxAmount = 0;

        if (debitNote.items && debitNote.items.length > 0) {
            debitNote.items.forEach(item => {
                const itemSubtotal = item.return_quantity * item.rate;
                const itemTax = (itemSubtotal * item.tax_rate) / 100;
                
                subtotal += itemSubtotal;
                taxAmount += itemTax;
            });
        }

        debitNote.subtotal = subtotal;
        debitNote.tax_amount = taxAmount;
        debitNote.total_amount = subtotal + taxAmount;
    }

    /**
     * Calculate due date based on payment terms
     */
    calculateDueDate(purchaseDate, paymentTerms) {
        const date = new Date(purchaseDate);
        date.setDate(date.getDate() + (paymentTerms || 0));
        return date.toISOString().split('T')[0];
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

    // ==================== VALIDATION METHODS ====================

    validatePOData(poData) {
        if (!poData.supplier_id) {
            throw new Error('Supplier is required');
        }
        if (!poData.items || poData.items.length === 0) {
            throw new Error('At least one item is required');
        }
    }

    validateInvoiceData(invoiceData) {
        if (!invoiceData.supplier_id) {
            throw new Error('Supplier is required');
        }
        if (!invoiceData.supplier_invoice_number) {
            throw new Error('Supplier invoice number is required');
        }
        if (!invoiceData.items || invoiceData.items.length === 0) {
            throw new Error('At least one item is required');
        }
    }

    validateDebitNoteData(debitNoteData) {
        if (!debitNoteData.purchase_invoice_id) {
            throw new Error('Purchase invoice is required');
        }
        if (!debitNoteData.supplier_id) {
            throw new Error('Supplier is required');
        }
        if (!debitNoteData.items || debitNoteData.items.length === 0) {
            throw new Error('At least one item is required');
        }
    }

    // ==================== REPORTING METHODS ====================

    /**
     * Get purchase summary for a date range
     */
    async getPurchaseSummary(startDate, endDate) {
        try {
            const invoices = await this.db.getAll('purchase_invoices');
            
            const filteredInvoices = invoices.filter(invoice => {
                const invoiceDate = new Date(invoice.purchase_date);
                return invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate);
            });

            const summary = {
                total_invoices: filteredInvoices.length,
                total_amount: filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
                paid_amount: filteredInvoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0),
                outstanding_amount: 0
            };

            summary.outstanding_amount = summary.total_amount - summary.paid_amount;

            return summary;

        } catch (error) {
            console.error('Error getting purchase summary:', error);
            throw error;
        }
    }

    /**
     * Get supplier-wise purchase report
     */
    async getSupplierWisePurchaseReport(startDate, endDate) {
        try {
            const invoices = await this.db.getAll('purchase_invoices');
            const suppliers = await this.db.getAll('suppliers');
            
            const supplierMap = {};
            suppliers.forEach(supplier => {
                supplierMap[supplier.id] = supplier.supplier_name;
            });

            const filteredInvoices = invoices.filter(invoice => {
                const invoiceDate = new Date(invoice.purchase_date);
                return invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate);
            });

            const report = {};
            filteredInvoices.forEach(invoice => {
                const supplierName = supplierMap[invoice.supplier_id] || 'Unknown';
                
                if (!report[supplierName]) {
                    report[supplierName] = {
                        supplier_name: supplierName,
                        total_invoices: 0,
                        total_amount: 0,
                        paid_amount: 0,
                        outstanding_amount: 0
                    };
                }

                report[supplierName].total_invoices++;
                report[supplierName].total_amount += invoice.total_amount || 0;
                report[supplierName].paid_amount += invoice.paid_amount || 0;
            });

            // Calculate outstanding amounts
            Object.keys(report).forEach(supplier => {
                report[supplier].outstanding_amount = 
                    report[supplier].total_amount - report[supplier].paid_amount;
            });

            return Object.values(report);

        } catch (error) {
            console.error('Error getting supplier-wise purchase report:', error);
            throw error;
        }
    }
}

// Create global instance
window.purchaseManager = new PurchaseManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PurchaseManager;
}
