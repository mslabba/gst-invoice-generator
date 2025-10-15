/**
 * Database Manager - Handles all database operations for the Business Accounting System
 * Uses Firebase Firestore for data storage
 * Manages collections: customers, suppliers, products, purchase orders, invoices, payments, etc.
 */

import { db } from './firebase-config.js';
import { 
    collection, 
    doc, 
    addDoc, 
    setDoc,
    updateDoc, 
    deleteDoc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit,
    serverTimestamp,
    increment
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

class DatabaseManager {
    constructor() {
        this.db = db;
        this.isInitialized = false;
        this.collections = {
            customers: 'customers',
            suppliers: 'suppliers',
            products: 'products',
            categories: 'categories',
            units: 'units',
            purchase_orders: 'purchase_orders',
            purchase_order_items: 'purchase_order_items',
            purchase_invoices: 'purchase_invoices',
            purchase_invoice_items: 'purchase_invoice_items',
            debit_notes: 'debit_notes',
            debit_note_items: 'debit_note_items',
            payments_in: 'payments_in',
            payment_in_allocations: 'payment_in_allocations',
            payments_out: 'payments_out',
            payment_out_allocations: 'payment_out_allocations',
            bank_accounts: 'bank_accounts',
            expenses: 'expenses',
            expense_categories: 'expense_categories',
            party_ledger: 'party_ledger',
            stock_movements: 'stock_movements',
            counters: 'counters' // For auto-incrementing numbers
        };
    }

    /**
     * Initialize the database and create default data
     */
    async initialize() {
        if (this.isInitialized) return true;

        try {
            await this.initializeDefaultData();
            await this.initializeCounters();
            this.isInitialized = true;
            console.log('Firebase Database initialized successfully');
            return true;
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }

    /**
     * Initialize counters for auto-incrementing numbers
     */
    async initializeCounters() {
        const counters = [
            { id: 'customers', value: 0, prefix: 'CUST' },
            { id: 'suppliers', value: 0, prefix: 'SUPP' },
            { id: 'products', value: 0, prefix: 'PROD' },
            { id: 'purchase_orders', value: 0, prefix: 'PO' },
            { id: 'purchase_invoices', value: 0, prefix: 'PI' },
            { id: 'debit_notes', value: 0, prefix: 'DN' },
            { id: 'payments_in', value: 0, prefix: 'RCP' },
            { id: 'payments_out', value: 0, prefix: 'PAY' },
            { id: 'expenses', value: 0, prefix: 'EXP' }
        ];

        for (const counter of counters) {
            try {
                const counterDoc = await getDoc(doc(this.db, this.collections.counters, counter.id));
                if (!counterDoc.exists()) {
                    console.log(`Creating counter document: ${counter.id}`);
                    await this.add('counters', counter, counter.id);
                    console.log(`Successfully created counter: ${counter.id}`);
                } else {
                    console.log(`Counter ${counter.id} already exists`);
                }
            } catch (error) {
                console.error(`Error initializing counter ${counter.id}:`, error);
                // Continue with other counters even if one fails
            }
        }
    }

    /**
     * Generic method to add a record to any collection
     */
    async add(collectionName, data, customId = null) {
        try {
            // Add timestamps
            data.created_at = serverTimestamp();
            data.updated_at = serverTimestamp();
            
            if (customId) {
                // Use setDoc to create or overwrite the document with the custom ID
                await setDoc(doc(this.db, collectionName, customId), data);
                return customId;
            } else {
                const docRef = await addDoc(collection(this.db, collectionName), data);
                return docRef.id;
            }
        } catch (error) {
            console.error(`Error adding document to ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Generic method to update a record in any collection
     */
    async update(collectionName, docId, data) {
        try {
            data.updated_at = serverTimestamp();
            await updateDoc(doc(this.db, collectionName, docId), data);
            return docId;
        } catch (error) {
            console.error(`Error updating document in ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Generic method to get all records from a collection
     */
    async getAll(collectionName, orderByField = 'created_at', orderDirection = 'desc') {
        try {
            const q = query(
                collection(this.db, collectionName),
                orderBy(orderByField, orderDirection)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error(`Error getting documents from ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Generic method to get a single record by ID
     */
    async getById(collectionName, docId) {
        try {
            const docRef = doc(this.db, collectionName, docId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data()
                };
            } else {
                return null;
            }
        } catch (error) {
            console.error(`Error getting document from ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Get next counter value and increment it
     */
    async getNextCounter(counterName) {
        try {
            const counterRef = doc(this.db, this.collections.counters, counterName);
            const counterDoc = await getDoc(counterRef);
            
            if (counterDoc.exists()) {
                const currentValue = counterDoc.data().value || 0;
                const nextValue = currentValue + 1;
                
                // Update counter
                await updateDoc(counterRef, {
                    value: nextValue,
                    updated_at: serverTimestamp()
                });
                
                return nextValue;
            } else {
                // Create counter if it doesn't exist
                await setDoc(counterRef, {
                    value: 1,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                });
                return 1;
            }
        } catch (error) {
            console.error(`Error getting next counter for ${counterName}:`, error);
            throw error;
        }
    }

    /**
     * Generic method to delete a record
     */
    async delete(collectionName, docId) {
        try {
            await deleteDoc(doc(this.db, collectionName, docId));
            return true;
        } catch (error) {
            console.error(`Error deleting document from ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Generic method to query records with conditions
     */
    async query(collectionName, conditions = [], orderByField = 'created_at', orderDirection = 'desc') {
        try {
            let q = collection(this.db, collectionName);
            
            // Add where conditions
            conditions.forEach(condition => {
                q = query(q, where(condition.field, condition.operator, condition.value));
            });
            
            // Add ordering
            q = query(q, orderBy(orderByField, orderDirection));
            
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error(`Error querying ${collectionName}:`, error);
            throw error;
        }
    }


    /**
     * Generic method to delete a record
     */
    async delete(collectionName, id) {
        try {
            await deleteDoc(doc(this.db, collectionName, id));
            return true;
        } catch (error) {
            console.error(`Error deleting document from ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Search records by field value
     */
    async getByField(collectionName, fieldName, value, operator = '==') {
        try {
            const q = query(collection(this.db, collectionName), where(fieldName, operator, value));
            const querySnapshot = await getDocs(q);
            const results = [];
            querySnapshot.forEach((doc) => {
                results.push({ id: doc.id, ...doc.data() });
            });
            return results;
        } catch (error) {
            console.error(`Error searching documents in ${collectionName}:`, error);
            throw error;
        }
    }

    /**
     * Get next auto-generated number for entities
     */
    async getNextNumber(entityType) {
        try {
            const counterRef = doc(this.db, this.collections.counters, entityType);
            const counterDoc = await getDoc(counterRef);
            
            if (counterDoc.exists()) {
                const counterData = counterDoc.data();
                const nextValue = counterData.value + 1;
                
                // Update counter
                await updateDoc(counterRef, { value: increment(1) });
                
                return `${counterData.prefix}${nextValue.toString().padStart(4, '0')}`;
            } else {
                throw new Error(`Counter for ${entityType} not found`);
            }
        } catch (error) {
            console.error(`Error getting next number for ${entityType}:`, error);
            throw error;
        }
    }

    /**
     * Initialize default data
     */
    async initializeDefaultData() {
        try {
            // Add default expense categories
            const defaultCategories = [
                { category_name: 'Salaries & Wages', category_type: 'Fixed', is_active: true },
                { category_name: 'Rent', category_type: 'Fixed', is_active: true },
                { category_name: 'Electricity', category_type: 'Variable', is_active: true },
                { category_name: 'Water', category_type: 'Variable', is_active: true },
                { category_name: 'Telephone & Internet', category_type: 'Fixed', is_active: true },
                { category_name: 'Office Supplies', category_type: 'Variable', is_active: true },
                { category_name: 'Marketing & Advertising', category_type: 'Variable', is_active: true },
                { category_name: 'Transportation', category_type: 'Variable', is_active: true },
                { category_name: 'Fuel', category_type: 'Variable', is_active: true },
                { category_name: 'Maintenance & Repairs', category_type: 'Variable', is_active: true },
                { category_name: 'Professional Fees', category_type: 'Variable', is_active: true },
                { category_name: 'Bank Charges', category_type: 'Variable', is_active: true },
                { category_name: 'Insurance', category_type: 'Fixed', is_active: true },
                { category_name: 'Depreciation', category_type: 'Fixed', is_active: true },
                { category_name: 'Miscellaneous', category_type: 'Variable', is_active: true }
            ];

            // Check if categories already exist
            const existingCategories = await this.getAll('expense_categories');
            if (existingCategories.length === 0) {
                for (const category of defaultCategories) {
                    await this.add('expense_categories', category);
                }
            }

            // Add default units
            const defaultUnits = [
                { unit_name: 'Piece', unit_symbol: 'Pcs', is_active: true },
                { unit_name: 'Kilogram', unit_symbol: 'Kg', is_active: true },
                { unit_name: 'Gram', unit_symbol: 'g', is_active: true },
                { unit_name: 'Liter', unit_symbol: 'L', is_active: true },
                { unit_name: 'Meter', unit_symbol: 'm', is_active: true },
                { unit_name: 'Box', unit_symbol: 'Box', is_active: true },
                { unit_name: 'Dozen', unit_symbol: 'Dzn', is_active: true },
                { unit_name: 'Set', unit_symbol: 'Set', is_active: true }
            ];

            const existingUnits = await this.getAll('units');
            if (existingUnits.length === 0) {
                for (const unit of defaultUnits) {
                    await this.add('units', unit);
                }
            }

            // Add default product categories
            const defaultProductCategories = [
                { category_name: 'Electronics', is_active: true },
                { category_name: 'Clothing', is_active: true },
                { category_name: 'Food & Beverages', is_active: true },
                { category_name: 'Office Supplies', is_active: true },
                { category_name: 'Raw Materials', is_active: true },
                { category_name: 'Finished Goods', is_active: true }
            ];

            const existingProductCategories = await this.getAll('categories');
            if (existingProductCategories.length === 0) {
                for (const category of defaultProductCategories) {
                    await this.add('categories', category);
                }
            }

            console.log('Default data initialized');
        } catch (error) {
            console.error('Error initializing default data:', error);
        }
    }

    /**
     * Business-specific methods
     */

    // Customer methods
    async addCustomer(customerData) {
        customerData.customer_code = await this.getNextNumber('customers');
        return await this.add('customers', customerData);
    }

    async getActiveCustomers() {
        return await this.getByField('customers', 'is_active', true);
    }

    // Supplier methods
    async addSupplier(supplierData) {
        supplierData.supplier_code = await this.getNextNumber('suppliers');
        return await this.add('suppliers', supplierData);
    }

    async getActiveSuppliers() {
        return await this.getByField('suppliers', 'is_active', true);
    }

    // Product methods
    async addProduct(productData) {
        productData.product_code = await this.getNextNumber('products');
        return await this.add('products', productData);
    }

    async getActiveProducts() {
        return await this.getByField('products', 'is_active', true);
    }

    async updateProductStock(productId, quantity, movementType) {
        try {
            const product = await this.getById('products', productId);
            if (!product) throw new Error('Product not found');

            let newStock = product.current_stock || 0;
            if (movementType === 'IN') {
                newStock += quantity;
            } else if (movementType === 'OUT') {
                newStock -= quantity;
            }

            await this.update('products', productId, { current_stock: newStock });

            // Record stock movement
            await this.add('stock_movements', {
                product_id: productId,
                movement_type: movementType,
                quantity: quantity,
                movement_date: new Date().toISOString(),
                reference_type: 'Manual',
                reference_id: null
            });

            return newStock;
        } catch (error) {
            console.error('Error updating product stock:', error);
            throw error;
        }
    }

    // Purchase Order methods
    async createPurchaseOrder(poData) {
        poData.po_number = await this.getNextNumber('purchase_orders');
        poData.status = 'Draft';
        return await this.add('purchase_orders', poData);
    }

    // Purchase Invoice methods
    async createPurchaseInvoice(invoiceData) {
        invoiceData.purchase_invoice_number = await this.getNextNumber('purchase_invoices');
        invoiceData.payment_status = 'Unpaid';
        invoiceData.paid_amount = 0;
        return await this.add('purchase_invoices', invoiceData);
    }

    // Payment methods
    async createPaymentIn(paymentData) {
        paymentData.receipt_number = await this.getNextNumber('payments_in');
        return await this.add('payments_in', paymentData);
    }

    async createPaymentOut(paymentData) {
        paymentData.payment_number = await this.getNextNumber('payments_out');
        return await this.add('payments_out', paymentData);
    }

    // Expense methods
    async createExpense(expenseData) {
        expenseData.expense_number = await this.getNextNumber('expenses');
        expenseData.status = 'Pending';
        return await this.add('expenses', expenseData);
    }

    // Ledger methods
    async addLedgerEntry(ledgerData) {
        return await this.add('party_ledger', ledgerData);
    }

    async getPartyLedger(partyType, partyId, startDate = null, endDate = null) {
        try {
            let q = query(
                collection(this.db, 'party_ledger'),
                where('party_type', '==', partyType),
                where('party_id', '==', partyId),
                orderBy('transaction_date', 'asc')
            );

            if (startDate && endDate) {
                q = query(q, where('transaction_date', '>=', startDate), where('transaction_date', '<=', endDate));
            }

            const querySnapshot = await getDocs(q);
            const results = [];
            querySnapshot.forEach((doc) => {
                results.push({ id: doc.id, ...doc.data() });
            });

            return results;
        } catch (error) {
            console.error('Error getting party ledger:', error);
            throw error;
        }
    }
}

// Create global instance
window.databaseManager = new DatabaseManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseManager;
}
