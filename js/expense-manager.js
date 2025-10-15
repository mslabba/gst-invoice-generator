/**
 * Expense Manager - Handles all expense-related operations
 * Manages expense categories, expense entries, and expense reporting
 * Integrates with payment system and financial reporting
 */

class ExpenseManager {
    constructor() {
        this.db = window.databaseManager;
        this.currentExpense = null;
        this.expenseStatuses = ['Pending', 'Approved', 'Paid', 'Rejected'];
        this.paymentModes = [
            'Cash',
            'Bank Transfer',
            'UPI',
            'Cheque',
            'Credit Card',
            'Debit Card',
            'NEFT',
            'RTGS',
            'Other'
        ];
    }

    /**
     * Initialize the expense manager
     */
    async initialize() {
        if (!this.db) {
            throw new Error('Database manager not available');
        }
        await this.db.initialize();
        console.log('Expense Manager initialized');
    }

    // ==================== EXPENSE CATEGORY METHODS ====================

    /**
     * Create expense category
     */
    async createExpenseCategory(categoryData) {
        try {
            this.validateCategoryData(categoryData);

            const category = {
                category_name: categoryData.category_name,
                category_type: categoryData.category_type || 'Variable', // Fixed or Variable
                is_active: categoryData.is_active !== false
            };

            return await this.db.add('expense_categories', category);

        } catch (error) {
            console.error('Error creating expense category:', error);
            throw error;
        }
    }

    /**
     * Get all active expense categories
     */
    async getActiveExpenseCategories() {
        try {
            return await this.db.getByField('expense_categories', 'is_active', true);
        } catch (error) {
            console.error('Error getting active expense categories:', error);
            throw error;
        }
    }

    /**
     * Update expense category
     */
    async updateExpenseCategory(categoryId, categoryData) {
        try {
            return await this.db.update('expense_categories', categoryId, categoryData);
        } catch (error) {
            console.error('Error updating expense category:', error);
            throw error;
        }
    }

    /**
     * Deactivate expense category
     */
    async deactivateExpenseCategory(categoryId) {
        try {
            return await this.db.update('expense_categories', categoryId, { is_active: false });
        } catch (error) {
            console.error('Error deactivating expense category:', error);
            throw error;
        }
    }

    // ==================== EXPENSE ENTRY METHODS ====================

    /**
     * Create expense entry
     */
    async createExpense(expenseData) {
        try {
            // Validate required fields
            this.validateExpenseData(expenseData);

            const expense = {
                expense_date: expenseData.expense_date || new Date().toISOString().split('T')[0],
                expense_category_id: expenseData.expense_category_id,
                description: expenseData.description,
                amount: parseFloat(expenseData.amount) || 0,
                payment_mode: expenseData.payment_mode,
                bank_account_id: expenseData.bank_account_id || null,
                vendor_name: expenseData.vendor_name || '',
                tax_applicable: expenseData.tax_applicable || false,
                tax_amount: parseFloat(expenseData.tax_amount) || 0,
                bill_number: expenseData.bill_number || '',
                bill_attachment: expenseData.bill_attachment || null,
                status: 'Pending',
                notes: expenseData.notes || '',
                created_by: expenseData.created_by || 'system'
            };

            // Create expense
            const expenseId = await this.db.createExpense(expense);

            // Update bank/cash balance if status is approved/paid
            if (expense.status === 'Paid') {
                await this.updateAccountBalanceForExpense(expense.payment_mode, expense.bank_account_id, expense.amount);
            }

            this.currentExpense = { id: expenseId, ...expense };
            return expenseId;

        } catch (error) {
            console.error('Error creating expense:', error);
            throw error;
        }
    }

    /**
     * Update expense
     */
    async updateExpense(expenseId, expenseData) {
        try {
            const currentExpense = await this.db.getById('expenses', expenseId);
            if (!currentExpense) {
                throw new Error('Expense not found');
            }

            // If status is changing to Paid, update account balance
            if (expenseData.status === 'Paid' && currentExpense.status !== 'Paid') {
                await this.updateAccountBalanceForExpense(
                    currentExpense.payment_mode, 
                    currentExpense.bank_account_id, 
                    currentExpense.amount
                );
            }

            return await this.db.update('expenses', expenseId, expenseData);

        } catch (error) {
            console.error('Error updating expense:', error);
            throw error;
        }
    }

    /**
     * Approve expense
     */
    async approveExpense(expenseId, approvedBy) {
        try {
            return await this.updateExpense(expenseId, {
                status: 'Approved',
                approved_by: approvedBy,
                approved_date: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error approving expense:', error);
            throw error;
        }
    }

    /**
     * Mark expense as paid
     */
    async markExpenseAsPaid(expenseId, paidBy) {
        try {
            const expense = await this.db.getById('expenses', expenseId);
            if (!expense) {
                throw new Error('Expense not found');
            }

            // Update account balance
            await this.updateAccountBalanceForExpense(expense.payment_mode, expense.bank_account_id, expense.amount);

            return await this.updateExpense(expenseId, {
                status: 'Paid',
                paid_by: paidBy,
                paid_date: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error marking expense as paid:', error);
            throw error;
        }
    }

    /**
     * Reject expense
     */
    async rejectExpense(expenseId, rejectedBy, rejectionReason) {
        try {
            return await this.updateExpense(expenseId, {
                status: 'Rejected',
                rejected_by: rejectedBy,
                rejection_reason: rejectionReason,
                rejected_date: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error rejecting expense:', error);
            throw error;
        }
    }

    /**
     * Get expense by ID
     */
    async getExpense(expenseId) {
        try {
            const expense = await this.db.getById('expenses', expenseId);
            if (!expense) return null;

            // Get category details
            if (expense.expense_category_id) {
                const category = await this.db.getById('expense_categories', expense.expense_category_id);
                expense.category = category;
            }

            return expense;

        } catch (error) {
            console.error('Error getting expense:', error);
            throw error;
        }
    }

    /**
     * Get all expenses
     */
    async getAllExpenses(filters = {}) {
        try {
            let expenses = await this.db.getAll('expenses', 'expense_date', 'desc');

            // Apply filters
            if (filters.category_id) {
                expenses = expenses.filter(exp => exp.expense_category_id === filters.category_id);
            }

            if (filters.status) {
                expenses = expenses.filter(exp => exp.status === filters.status);
            }

            if (filters.start_date && filters.end_date) {
                expenses = expenses.filter(exp => {
                    const expenseDate = new Date(exp.expense_date);
                    return expenseDate >= new Date(filters.start_date) && 
                           expenseDate <= new Date(filters.end_date);
                });
            }

            if (filters.payment_mode) {
                expenses = expenses.filter(exp => exp.payment_mode === filters.payment_mode);
            }

            // Add category details
            const categories = await this.getActiveExpenseCategories();
            const categoryMap = {};
            categories.forEach(cat => {
                categoryMap[cat.id] = cat;
            });

            expenses.forEach(expense => {
                if (expense.expense_category_id && categoryMap[expense.expense_category_id]) {
                    expense.category = categoryMap[expense.expense_category_id];
                }
            });

            return expenses;

        } catch (error) {
            console.error('Error getting all expenses:', error);
            throw error;
        }
    }

    /**
     * Delete expense
     */
    async deleteExpense(expenseId) {
        try {
            const expense = await this.db.getById('expenses', expenseId);
            if (!expense) {
                throw new Error('Expense not found');
            }

            // Only allow deletion of pending expenses
            if (expense.status !== 'Pending') {
                throw new Error('Cannot delete approved/paid expenses');
            }

            return await this.db.delete('expenses', expenseId);

        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    }

    // ==================== ACCOUNT BALANCE METHODS ====================

    /**
     * Update account balance for expense
     */
    async updateAccountBalanceForExpense(paymentMode, bankAccountId, amount) {
        try {
            if (paymentMode === 'Cash') {
                // Handle cash balance (could be stored in a separate cash account)
                return;
            }

            if (bankAccountId) {
                const bankAccount = await this.db.getById('bank_accounts', bankAccountId);
                if (bankAccount) {
                    const newBalance = (bankAccount.current_balance || 0) - amount;
                    await this.db.update('bank_accounts', bankAccountId, { 
                        current_balance: newBalance 
                    });
                }
            }

        } catch (error) {
            console.error('Error updating account balance for expense:', error);
            throw error;
        }
    }

    // ==================== REPORTING METHODS ====================

    /**
     * Get expense summary by category
     */
    async getExpenseSummaryByCategory(startDate, endDate) {
        try {
            const expenses = await this.getAllExpenses({
                start_date: startDate,
                end_date: endDate,
                status: 'Paid' // Only include paid expenses
            });

            const categories = await this.getActiveExpenseCategories();
            const summary = {};

            // Initialize categories
            categories.forEach(category => {
                summary[category.id] = {
                    category_id: category.id,
                    category_name: category.category_name,
                    category_type: category.category_type,
                    total_amount: 0,
                    expense_count: 0,
                    expenses: []
                };
            });

            // Group expenses by category
            expenses.forEach(expense => {
                if (summary[expense.expense_category_id]) {
                    summary[expense.expense_category_id].total_amount += expense.amount || 0;
                    summary[expense.expense_category_id].expense_count++;
                    summary[expense.expense_category_id].expenses.push(expense);
                }
            });

            return Object.values(summary).filter(cat => cat.expense_count > 0);

        } catch (error) {
            console.error('Error getting expense summary by category:', error);
            throw error;
        }
    }

    /**
     * Get expense summary by month
     */
    async getExpenseSummaryByMonth(year) {
        try {
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;
            
            const expenses = await this.getAllExpenses({
                start_date: startDate,
                end_date: endDate,
                status: 'Paid'
            });

            const monthlySummary = {};

            // Initialize months
            for (let month = 1; month <= 12; month++) {
                const monthKey = month.toString().padStart(2, '0');
                monthlySummary[monthKey] = {
                    month: monthKey,
                    month_name: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
                    total_amount: 0,
                    expense_count: 0,
                    fixed_expenses: 0,
                    variable_expenses: 0
                };
            }

            // Group expenses by month
            expenses.forEach(expense => {
                const expenseDate = new Date(expense.expense_date);
                const monthKey = (expenseDate.getMonth() + 1).toString().padStart(2, '0');
                
                if (monthlySummary[monthKey]) {
                    monthlySummary[monthKey].total_amount += expense.amount || 0;
                    monthlySummary[monthKey].expense_count++;
                    
                    if (expense.category && expense.category.category_type === 'Fixed') {
                        monthlySummary[monthKey].fixed_expenses += expense.amount || 0;
                    } else {
                        monthlySummary[monthKey].variable_expenses += expense.amount || 0;
                    }
                }
            });

            return Object.values(monthlySummary);

        } catch (error) {
            console.error('Error getting expense summary by month:', error);
            throw error;
        }
    }

    /**
     * Get expense trend analysis
     */
    async getExpenseTrendAnalysis(months = 6) {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - months);

            const expenses = await this.getAllExpenses({
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                status: 'Paid'
            });

            const trendData = [];
            const currentDate = new Date(startDate);

            while (currentDate <= endDate) {
                const monthKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
                
                const monthExpenses = expenses.filter(expense => {
                    const expenseDate = new Date(expense.expense_date);
                    return expenseDate.getFullYear() === currentDate.getFullYear() &&
                           expenseDate.getMonth() === currentDate.getMonth();
                });

                const totalAmount = monthExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

                trendData.push({
                    period: monthKey,
                    month_name: currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
                    total_amount: totalAmount,
                    expense_count: monthExpenses.length
                });

                currentDate.setMonth(currentDate.getMonth() + 1);
            }

            return trendData;

        } catch (error) {
            console.error('Error getting expense trend analysis:', error);
            throw error;
        }
    }

    /**
     * Get expense summary by payment mode
     */
    async getExpenseSummaryByPaymentMode(startDate, endDate) {
        try {
            const expenses = await this.getAllExpenses({
                start_date: startDate,
                end_date: endDate,
                status: 'Paid'
            });

            const summary = {};

            // Initialize payment modes
            this.paymentModes.forEach(mode => {
                summary[mode] = {
                    payment_mode: mode,
                    total_amount: 0,
                    expense_count: 0
                };
            });

            // Group expenses by payment mode
            expenses.forEach(expense => {
                if (summary[expense.payment_mode]) {
                    summary[expense.payment_mode].total_amount += expense.amount || 0;
                    summary[expense.payment_mode].expense_count++;
                }
            });

            return Object.values(summary).filter(mode => mode.expense_count > 0);

        } catch (error) {
            console.error('Error getting expense summary by payment mode:', error);
            throw error;
        }
    }

    /**
     * Get pending expenses for approval
     */
    async getPendingExpenses() {
        try {
            return await this.getAllExpenses({ status: 'Pending' });
        } catch (error) {
            console.error('Error getting pending expenses:', error);
            throw error;
        }
    }

    /**
     * Get approved expenses awaiting payment
     */
    async getApprovedExpenses() {
        try {
            return await this.getAllExpenses({ status: 'Approved' });
        } catch (error) {
            console.error('Error getting approved expenses:', error);
            throw error;
        }
    }

    // ==================== VALIDATION METHODS ====================

    validateCategoryData(categoryData) {
        if (!categoryData.category_name) {
            throw new Error('Category name is required');
        }
        if (categoryData.category_type && !['Fixed', 'Variable'].includes(categoryData.category_type)) {
            throw new Error('Category type must be Fixed or Variable');
        }
    }

    validateExpenseData(expenseData) {
        if (!expenseData.expense_category_id) {
            throw new Error('Expense category is required');
        }
        if (!expenseData.description) {
            throw new Error('Description is required');
        }
        if (!expenseData.amount || expenseData.amount <= 0) {
            throw new Error('Amount must be greater than zero');
        }
        if (!expenseData.payment_mode) {
            throw new Error('Payment mode is required');
        }
        if (!this.paymentModes.includes(expenseData.payment_mode)) {
            throw new Error('Invalid payment mode');
        }
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Get expense statistics
     */
    async getExpenseStatistics(startDate, endDate) {
        try {
            const allExpenses = await this.getAllExpenses({
                start_date: startDate,
                end_date: endDate
            });

            const paidExpenses = allExpenses.filter(exp => exp.status === 'Paid');
            const pendingExpenses = allExpenses.filter(exp => exp.status === 'Pending');
            const approvedExpenses = allExpenses.filter(exp => exp.status === 'Approved');

            return {
                total_expenses: allExpenses.length,
                paid_expenses: {
                    count: paidExpenses.length,
                    amount: paidExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
                },
                pending_expenses: {
                    count: pendingExpenses.length,
                    amount: pendingExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
                },
                approved_expenses: {
                    count: approvedExpenses.length,
                    amount: approvedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
                }
            };

        } catch (error) {
            console.error('Error getting expense statistics:', error);
            throw error;
        }
    }

    /**
     * Export expenses to CSV format
     */
    async exportExpensesToCSV(filters = {}) {
        try {
            const expenses = await this.getAllExpenses(filters);
            
            const csvHeaders = [
                'Expense Number',
                'Date',
                'Category',
                'Description',
                'Amount',
                'Payment Mode',
                'Vendor',
                'Status',
                'Created By'
            ];

            const csvRows = expenses.map(expense => [
                expense.expense_number || '',
                expense.expense_date || '',
                expense.category ? expense.category.category_name : '',
                expense.description || '',
                expense.amount || 0,
                expense.payment_mode || '',
                expense.vendor_name || '',
                expense.status || '',
                expense.created_by || ''
            ]);

            return {
                headers: csvHeaders,
                rows: csvRows
            };

        } catch (error) {
            console.error('Error exporting expenses to CSV:', error);
            throw error;
        }
    }
}

// Create global instance
window.expenseManager = new ExpenseManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExpenseManager;
}
