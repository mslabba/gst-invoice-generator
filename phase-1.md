# Phase 1 Specification Document
## Business Accounting & Management System

**Version:** 1.0  
**Date:** October 14, 2025  
**Phase:** 1 - Core Accounting Features

---

## 1. PURCHASE MODULE WITH INVENTORY LINK

### 1.1 Purchase Order Management

#### Features:
- Create, edit, delete purchase orders
- Track PO status (Draft, Sent, Partially Received, Completed, Cancelled)
- Convert PO to purchase invoice
- Print/PDF/Email PO to suppliers

#### Data Fields:
- PO Number (auto-generated with custom prefix)
- PO Date
- Supplier details (from supplier master)
- Expected delivery date
- Item details:
  - Product name/code
  - Description
  - Quantity
  - Unit price
  - Tax rate (GST)
  - Amount
- Subtotal, tax amount, total amount
- Terms & conditions
- Notes/remarks
- Created by (user)
- Status

#### Business Rules:
- PO number must be unique
- PO can only be edited in Draft status
- Supplier must exist in supplier master
- Products must exist in product master

### 1.2 Purchase Invoice/Bill Entry

#### Features:
- Create purchase invoice from PO or standalone
- Record supplier bill details
- Support multiple tax rates per invoice
- Attach bill image/PDF
- Print/PDF purchase invoice

#### Data Fields:
- Purchase Invoice Number (internal auto-generated)
- Supplier Invoice Number (supplier's bill number)
- Purchase Date
- Supplier details
- Purchase order reference (if applicable)
- Item details:
  - Product name/code
  - HSN/SAC code
  - Description
  - Quantity
  - Unit price
  - Discount (if any)
  - Tax rate (CGST, SGST, IGST)
  - Amount
- Subtotal
- Discount amount (if overall discount)
- Tax amount
- Round off
- Total amount
- Payment terms (credit days)
- Due date
- Payment status (Unpaid, Partially Paid, Paid)
- Bill attachment (file upload)
- Notes
- Created by, created date

#### Business Rules:
- Invoice number must be unique
- Supplier must exist in supplier master
- Products must exist in product master
- On saving invoice:
  - Update inventory (increase stock)
  - Update purchase price of product
  - Create supplier ledger entry
  - Update outstanding amount
- Tax calculation must be accurate
- If linked to PO, validate quantities don't exceed PO quantity

### 1.3 Purchase Returns/Debit Note

#### Features:
- Create debit note against purchase invoice
- Partial or full return
- Auto-adjust stock and accounts

#### Data Fields:
- Debit Note Number (auto-generated)
- Debit Note Date
- Original Purchase Invoice Reference
- Supplier details
- Return reason
- Item details:
  - Product name
  - Return quantity
  - Rate
  - Tax
  - Amount
- Total return amount
- Notes

#### Business Rules:
- Must be linked to an existing purchase invoice
- Return quantity cannot exceed purchased quantity
- On saving:
  - Reduce inventory
  - Create negative entry in supplier ledger
  - Reduce outstanding if unpaid
  - Adjust purchase value

### 1.4 Inventory Integration

#### Auto Stock Updates:
- Purchase Invoice → Increase stock quantity
- Purchase Return → Decrease stock quantity
- Update last purchase price
- Update weighted average cost (if applicable)
- Track stock movement history

#### Validation:
- Check if product exists before creating purchase
- Alert on duplicate product entries in same invoice
- Validate HSN codes

---

## 2. PAYMENT IN/OUT MANAGEMENT

### 2.1 Payment In (Receipt from Customers)

#### Features:
- Record payments received from customers
- Link payment to one or multiple invoices
- Support advance payments (unapplied amount)
- Record excess payments
- Print payment receipt

#### Data Fields:
- Receipt Number (auto-generated)
- Receipt Date
- Customer name (from customer master)
- Payment mode (Cash, Bank Transfer, UPI, Cheque, Card, etc.)
- Payment reference/transaction ID
- Bank account (if applicable)
- Amount received
- Invoice allocation:
  - Invoice number
  - Invoice date
  - Invoice amount
  - Amount paid
  - Balance amount
- Unapplied amount (if payment exceeds invoice total)
- Notes
- Created by

#### Business Rules:
- Customer must exist in customer master
- Total allocated amount cannot exceed payment amount
- On saving:
  - Update invoice payment status
  - Create customer ledger entry (credit)
  - Update customer outstanding
  - Update bank/cash balance
- Support partial payments
- Track unapplied amounts for future invoices

### 2.2 Payment Out (Payment to Suppliers)

#### Features:
- Record payments made to suppliers
- Link payment to one or multiple purchase invoices
- Support advance payments
- Track payment methods
- Print payment voucher

#### Data Fields:
- Payment Number (auto-generated)
- Payment Date
- Supplier name (from supplier master)
- Payment mode (Cash, Bank Transfer, UPI, Cheque, NEFT, RTGS, etc.)
- Payment reference/transaction ID
- Bank account (if applicable)
- Cheque number & date (if cheque)
- Amount paid
- Invoice allocation:
  - Purchase invoice number
  - Invoice date
  - Invoice amount
  - Amount paid
  - Balance amount
- Unapplied amount
- Notes
- Approved by (if workflow needed)
- Created by

#### Business Rules:
- Supplier must exist in supplier master
- Total allocated amount cannot exceed payment amount
- On saving:
  - Update purchase invoice payment status
  - Create supplier ledger entry (debit)
  - Update supplier outstanding
  - Update bank/cash balance
- Support partial payments
- Track unapplied amounts for future bills

### 2.3 Payment Modes Configuration

#### Supported Modes:
- Cash
- Bank Transfer/NEFT/RTGS/IMPS
- UPI
- Cheque
- Credit Card
- Debit Card
- Other (custom)

#### Bank Account Master:
- Bank name
- Account number
- IFSC code
- Branch
- Account type (Current, Savings)
- Opening balance
- Current balance (auto-calculated)
- Active/Inactive status

---

## 3. PARTY LEDGER & OUTSTANDING REPORTS

### 3.1 Party Master Enhancement

#### Customer Master:
- Customer name (required)
- Customer code (auto-generated or manual)
- GSTIN (if registered)
- PAN
- Contact person
- Mobile number (required)
- Email
- Billing address
- Shipping address (multiple allowed)
- Credit limit
- Credit days (payment terms)
- Opening balance (Dr/Cr)
- Price category (if different pricing)
- Active/Inactive status
- Notes

#### Supplier/Vendor Master:
- Supplier name (required)
- Supplier code (auto-generated or manual)
- GSTIN (required for GST purchases)
- PAN
- Contact person
- Mobile number (required)
- Email
- Address
- Payment terms (credit days)
- Opening balance (Dr/Cr)
- Active/Inactive status
- Bank details (for NEFT/RTGS)
- Notes

### 3.2 Party Ledger

#### Features:
- View complete transaction history of customer/supplier
- Filter by date range
- Show opening balance, closing balance
- Drill-down to view transaction details
- Export to Excel/PDF
- Print ledger

#### Ledger Display Columns:
- Date
- Transaction type (Invoice, Payment, Credit Note, etc.)
- Transaction number
- Description
- Debit amount
- Credit amount
- Balance
- Reference (invoice/payment number)

#### Business Rules:
- Opening balance from party master
- Chronological order by date
- Running balance calculation
- Debit increases customer outstanding (invoice)
- Credit reduces customer outstanding (payment)
- Opposite for suppliers

### 3.3 Outstanding Reports

#### Receivables Report (Customer Outstanding):
- Customer name
- Total invoice amount
- Total paid amount
- Outstanding amount
- Overdue amount (past due date)
- Current (not yet due)
- Age-wise analysis:
  - 0-30 days
  - 31-60 days
  - 61-90 days
  - 90+ days
- Last payment date
- Last payment amount

#### Payables Report (Supplier Outstanding):
- Supplier name
- Total bill amount
- Total paid amount
- Outstanding amount
- Overdue amount
- Current
- Age-wise analysis
- Last payment date
- Last payment amount

#### Features:
- Filter by party, date range
- Sort by amount, due date, age
- Export to Excel/PDF
- Show summary totals
- Drill-down to view details
- Send statement via email

### 3.4 Party Statement

#### Features:
- Generate statement for specific customer/supplier
- Date range selection
- Show all transactions in period
- Opening and closing balance
- Professional format for sending to parties
- Email directly from system
- PDF download

---

## 4. BASIC FINANCIAL REPORTS

### 4.1 Profit & Loss Statement

#### Structure:
**Revenue:**
- Sales (from sales invoices)
- Less: Sales returns (credit notes)
- Net Sales

**Cost of Goods Sold:**
- Opening stock
- Add: Purchases
- Less: Purchase returns
- Less: Closing stock
- Cost of Goods Sold

**Gross Profit:**
- Net Sales - Cost of Goods Sold

**Operating Expenses:**
- Expense categories (from expense management)
  - Salaries
  - Rent
  - Utilities
  - Marketing
  - Transportation
  - Office expenses
  - Other expenses
- Total Operating Expenses

**Operating Profit:**
- Gross Profit - Operating Expenses

**Other Income/Expenses:**
- Interest income
- Interest expenses
- Other income/expenses

**Net Profit:**
- Operating Profit +/- Other Income/Expenses

#### Features:
- Date range selection (monthly, quarterly, yearly, custom)
- Comparative view (current vs previous period)
- Percentage analysis
- Export to Excel/PDF
- Print
- Graphical representation

### 4.2 Balance Sheet

#### Structure:

**Assets:**

*Current Assets:*
- Cash in hand
- Bank balances
- Accounts receivable (customer outstanding)
- Inventory/Stock
- Other current assets

*Fixed Assets:*
- Plant & Machinery
- Furniture & Fixtures
- Vehicles
- Computers
- Less: Accumulated depreciation
- Net Fixed Assets

**Total Assets**

**Liabilities:**

*Current Liabilities:*
- Accounts payable (supplier outstanding)
- Short-term loans
- Other current liabilities

*Long-term Liabilities:*
- Long-term loans
- Other long-term liabilities

**Total Liabilities**

**Equity:**
- Capital
- Add: Net Profit
- Less: Drawings
- Retained earnings

**Total Liabilities + Equity**

#### Features:
- As of date selection
- Comparative balance sheet
- Vertical/Horizontal format
- Export to Excel/PDF
- Print

### 4.3 Supporting Reports

#### Sales Reports:
- Sales summary (daily, monthly, yearly)
- Sales by customer
- Sales by product
- Sales by category
- Sales invoice list
- Tax summary

#### Purchase Reports:
- Purchase summary
- Purchase by supplier
- Purchase by product
- Purchase invoice list
- Tax summary

#### Stock Reports:
- Current stock summary
- Stock valuation
- Low stock items
- Stock movement
- Product-wise stock details

---

## 5. EXPENSE MANAGEMENT

### 5.1 Expense Categories

#### Default Categories:
- Salaries & Wages
- Rent
- Electricity
- Water
- Telephone & Internet
- Office Supplies
- Marketing & Advertising
- Transportation
- Fuel
- Maintenance & Repairs
- Professional Fees
- Bank Charges
- Insurance
- Depreciation
- Miscellaneous

#### Features:
- Add custom categories
- Enable/disable categories
- Categorize as fixed/variable
- Group expenses

### 5.2 Expense Entry

#### Data Fields:
- Expense Number (auto-generated)
- Expense Date
- Expense Category (dropdown)
- Description
- Amount
- Payment mode (Cash, Bank Transfer, etc.)
- Bank account (if paid through bank)
- Vendor/Payee name (optional, can link to supplier)
- Tax applicable (if GST on expense)
- Bill/Receipt number
- Attach receipt/bill (file upload)
- Status (Pending, Approved, Paid)
- Notes
- Created by

#### Business Rules:
- Expense category must be selected
- Amount must be greater than zero
- On saving:
  - Update expense total for category
  - Update bank/cash balance
  - Reflect in P&L report
- Support GST on expenses (ITC claim)

### 5.3 Expense Reports

#### Features:
- Expense summary by category
- Expense summary by month
- Expense trend analysis
- Comparison with budget (if set)
- Export to Excel/PDF
- Filter by date range, category, payment mode

---

## 6. DATABASE SCHEMA

### 6.1 Core Tables

#### customers
- id (PK)
- customer_code
- customer_name
- gstin
- pan
- contact_person
- mobile
- email
- billing_address
- shipping_address (JSON for multiple)
- credit_limit
- credit_days
- opening_balance
- opening_balance_type (Dr/Cr)
- price_category_id (FK)
- is_active
- notes
- created_at
- updated_at
- created_by (FK to users)

#### suppliers
- id (PK)
- supplier_code
- supplier_name
- gstin
- pan
- contact_person
- mobile
- email
- address
- payment_terms
- opening_balance
- opening_balance_type
- bank_details (JSON)
- is_active
- notes
- created_at
- updated_at
- created_by

#### products
- id (PK)
- product_code
- product_name
- description
- hsn_code
- category_id (FK)
- unit_id (FK)
- current_stock
- reorder_level
- purchase_price
- sale_price
- tax_rate
- is_active
- created_at
- updated_at

#### purchase_orders
- id (PK)
- po_number
- po_date
- supplier_id (FK)
- expected_delivery_date
- subtotal
- tax_amount
- total_amount
- status (Draft, Sent, Partial, Completed, Cancelled)
- terms_conditions
- notes
- created_at
- updated_at
- created_by

#### purchase_order_items
- id (PK)
- po_id (FK)
- product_id (FK)
- description
- quantity
- unit_price
- tax_rate
- amount

#### purchase_invoices
- id (PK)
- purchase_invoice_number
- supplier_invoice_number
- purchase_date
- supplier_id (FK)
- po_id (FK, nullable)
- subtotal
- discount_amount
- tax_amount
- round_off
- total_amount
- payment_terms
- due_date
- payment_status (Unpaid, Partial, Paid)
- paid_amount
- bill_attachment
- notes
- created_at
- updated_at
- created_by

#### purchase_invoice_items
- id (PK)
- purchase_invoice_id (FK)
- product_id (FK)
- hsn_code
- description
- quantity
- unit_price
- discount_amount
- tax_rate
- cgst_amount
- sgst_amount
- igst_amount
- amount

#### debit_notes
- id (PK)
- debit_note_number
- debit_note_date
- purchase_invoice_id (FK)
- supplier_id (FK)
- return_reason
- subtotal
- tax_amount
- total_amount
- notes
- created_at
- created_by

#### debit_note_items
- id (PK)
- debit_note_id (FK)
- product_id (FK)
- return_quantity
- rate
- tax_rate
- amount

#### payments_in
- id (PK)
- receipt_number
- receipt_date
- customer_id (FK)
- payment_mode
- payment_reference
- bank_account_id (FK, nullable)
- amount_received
- unapplied_amount
- notes
- created_at
- created_by

#### payment_in_allocations
- id (PK)
- payment_in_id (FK)
- sales_invoice_id (FK)
- amount_allocated

#### payments_out
- id (PK)
- payment_number
- payment_date
- supplier_id (FK)
- payment_mode
- payment_reference
- bank_account_id (FK, nullable)
- cheque_number
- cheque_date
- amount_paid
- unapplied_amount
- notes
- approved_by
- created_at
- created_by

#### payment_out_allocations
- id (PK)
- payment_out_id (FK)
- purchase_invoice_id (FK)
- amount_allocated

#### bank_accounts
- id (PK)
- bank_name
- account_number
- ifsc_code
- branch
- account_type
- opening_balance
- current_balance
- is_active
- created_at

#### expenses
- id (PK)
- expense_number
- expense_date
- expense_category_id (FK)
- description
- amount
- payment_mode
- bank_account_id (FK, nullable)
- vendor_name
- tax_applicable
- tax_amount
- bill_number
- bill_attachment
- status
- notes
- created_at
- created_by

#### expense_categories
- id (PK)
- category_name
- category_type (Fixed/Variable)
- is_active

#### party_ledger
- id (PK)
- party_type (Customer/Supplier)
- party_id (customer_id or supplier_id)
- transaction_date
- transaction_type (Invoice, Payment, Return, etc.)
- transaction_id (reference to source table)
- transaction_number
- description
- debit_amount
- credit_amount
- balance
- created_at

#### stock_movements
- id (PK)
- product_id (FK)
- movement_type (Purchase, Sale, Return, Adjustment)
- reference_type (Invoice, PO, etc.)
- reference_id
- quantity
- movement_date
- created_at

---

## 7. USER INTERFACE REQUIREMENTS

### 7.1 Common UI Elements

#### Navigation Menu:
- Dashboard
- Sales
  - Sales Invoices
  - Credit Notes
  - Customers
- Purchases
  - Purchase Orders
  - Purchase Invoices
  - Debit Notes
  - Suppliers
- Payments
  - Payment In
  - Payment Out
- Expenses
- Inventory/Stock
- Reports
  - P&L Statement
  - Balance Sheet
  - Outstanding Reports
  - Sales Reports
  - Purchase Reports
  - Stock Reports
  - Expense Reports
- Masters
  - Products
  - Customers
  - Suppliers
  - Categories
  - Banks
  - Users
- Settings

#### List Views (Standard):
- Search/Filter box
- Date range filter
- Export buttons (Excel, PDF)
- Add new button
- Action columns (View, Edit, Delete, Print)
- Pagination
- Show entries per page
- Column sorting

#### Form Views (Standard):
- Clear field labels
- Required field indicators (*)
- Validation messages
- Save, Save & New, Cancel buttons
- Auto-save drafts (optional)
- Audit trail (created by, created date, modified by, modified date)

### 7.2 Dashboard Requirements

#### Key Metrics (Cards):
- Today's Sales
- This Month's Sales
- Total Outstanding (Receivables)
- Total Payable
- Cash in Hand
- Bank Balance
- Current Stock Value
- Low Stock Items Count

#### Charts:
- Sales trend (last 6 months)
- Purchase trend
- Top 5 customers by sales
- Top 5 products by sales
- Expense breakdown by category
- Outstanding aging chart

#### Quick Actions:
- Create New Invoice
- Record Payment
- Add Expense
- View Outstanding

#### Recent Activities:
- Last 10 invoices
- Recent payments
- Recent purchases

### 7.3 Responsive Design
- Mobile-friendly interface
- Tablet optimization
- Desktop full features

---

## 8. BUSINESS RULES & VALIDATIONS

### 8.1 Common Validations
- All financial amounts must be non-negative
- Dates cannot be in future (except expected dates)
- GST numbers must be validated (format check)
- Email format validation
- Mobile number format (10 digits)
- Duplicate entry checks
- Reference integrity (FK constraints)

### 8.2 Purchase Module Rules
- Purchase invoice date cannot be before PO date
- Return quantity cannot exceed purchased quantity
- Purchase price cannot be negative
- Stock must update in real-time
- Cannot delete invoice if payment received
- Cannot delete PO if converted to invoice

### 8.3 Payment Rules
- Payment amount must be positive
- Cannot allocate more than available amount
- Payment date cannot be before invoice date
- Cannot delete payment if reconciled
- Cheque payments must have cheque number
- Bank payments must have transaction reference

### 8.4 Reporting Rules
- Balance sheet must balance (Assets = Liabilities + Equity)
- P&L must calculate correctly
- Outstanding must match ledger balance
- Stock value must match stock records

---

## 9. SECURITY & ACCESS CONTROL

### 9.1 User Roles
- Admin (full access)
- Accountant (all accounting, no settings)
- Purchase Manager (purchase module only)
- Sales Manager (sales module only)
- Data Entry Operator (limited access)

### 9.2 Permissions
- View
- Create
- Edit
- Delete
- Export
- Print
- Approve (for payments)

### 9.3 Audit Trail
- Track all create/update/delete operations
- User who performed action
- Timestamp
- Before/after values for critical fields
- Login/logout logs

---

## 10. TECHNICAL REQUIREMENTS

### 10.1 Performance
- Page load time < 2 seconds
- Support 1000+ transactions per month
- Report generation < 5 seconds
- Search results < 1 second

### 10.2 Data Backup
- Daily automatic backup
- Manual backup option
- Backup restore functionality
- Data export (full database)

### 10.3 Data Import
- Import customers from Excel
- Import suppliers from Excel
- Import products from Excel
- Import opening balances

### 10.4 Browser Compatibility
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

---

## 11. TESTING REQUIREMENTS

### 11.1 Test Cases
- Functional testing for each module
- Integration testing (inventory + purchase)
- Payment allocation testing
- Report accuracy testing
- Edge case testing (zero values, large numbers)
- Negative testing (invalid inputs)

### 11.2 User Acceptance Testing
- Real business scenarios
- Data accuracy verification
- Report validation
- Performance testing with actual data volume

---

## 12. DELIVERABLES

### Phase 1 Completion Checklist:
- [ ] Purchase module (PO, Invoice, Returns)
- [ ] Inventory auto-update from purchases
- [ ] Payment In module
- [ ] Payment Out module
- [ ] Party Ledger (Customer & Supplier)
- [ ] Outstanding Reports (Receivables & Payables)
- [ ] Profit & Loss Statement
- [ ] Balance Sheet
- [ ] Expense Management
- [ ] All reports with export functionality
- [ ] User roles & permissions
- [ ] Data backup functionality
- [ ] User documentation
- [ ] Admin manual
- [ ] Test cases & UAT sign-off

---

## 13. TIMELINE ESTIMATE

- **Week 1-2:** Purchase Module (PO, Invoice, Returns)
- **Week 3:** Inventory Integration
- **Week 4:** Payment In/Out Module
- **Week 5:** Party Ledger & Outstanding Reports
- **Week 6:** Financial Reports (P&L, Balance Sheet)
- **Week 7:** Expense Management
- **Week 8:** Testing & Bug Fixes
- **Week 9:** UAT & Documentation
- **Week 10:** Deployment & Training

**Total Duration:** 10 weeks

---

## 14. SUCCESS CRITERIA

Phase 1 is considered successful when:
1. All purchase transactions reflect correctly in inventory
2. Payments are accurately allocated to invoices
3. Outstanding reports match ledger balances
4. P&L and Balance Sheet generate correctly
5. All expenses are tracked and categorized
6. System handles 100+ transactions without performance issues
7. Users can complete end-to-end workflows without errors
8. Data backup and restore works reliably
9. All reports can be exported and printed
10. UAT sign-off received from business users

---

**Document End**