# Phase 3: Project Finance - Manual Test Checklist

## Prerequisites
1. Run `pnpm prisma db push` to apply schema changes
2. Run `pnpm build` to verify TypeScript compiles
3. Create a test project if not already exists

## Test Scenarios

### 1. Finance Summary
- [ ] Navigate to a project and click "المالية" (Finance) button
- [ ] Verify 4 KPI cards display correctly:
  - قيمة العقد (Contract Value)
  - المصروفات الفعلية (Actual Expenses)
  - المتبقي (Remaining)
  - المستخلصات المدفوعة (Claims Paid)
- [ ] Verify values are 0 initially for a new project

### 2. Create Expense
- [ ] Click "إضافة مصروف" (Add Expense)
- [ ] Fill in all fields:
  - التاريخ (Date): Select a date
  - الفئة (Category): Select "مواد" (Materials)
  - المبلغ (Amount): Enter 5000
  - المورد (Vendor): Enter "مورد تجريبي"
  - ملاحظات (Notes): Optional
- [ ] Click "إضافة المصروف" (Add Expense)
- [ ] Verify toast success message appears
- [ ] Verify expense appears in table
- [ ] Verify summary updates (المصروفات الفعلية should show 5,000 ر.س)

### 3. Filter Expenses
- [ ] Create multiple expenses with different categories
- [ ] Use category filter dropdown to filter by "مواد"
- [ ] Verify only "مواد" expenses are shown
- [ ] Select "جميع الفئات" to show all

### 4. Create Claim (مستخلص)
- [ ] Switch to المستخلصات (Claims) tab
- [ ] Click "مستخلص جديد" (New Claim)
- [ ] Fill in all fields:
  - بداية الفترة (Period Start): Select date
  - نهاية الفترة (Period End): Select date
  - المبلغ (Amount): Enter 50000
  - تاريخ الاستحقاق (Due Date): Select future date
  - ملاحظات (Notes): Optional
- [ ] Click "إنشاء المستخلص" (Create Claim)
- [ ] Verify toast success message
- [ ] Verify claim appears in table with رقم المستخلص = #1

### 5. Sequential Claim Numbers
- [ ] Create second claim
- [ ] Verify رقم المستخلص = #2
- [ ] Create third claim
- [ ] Verify رقم المستخلص = #3

### 6. Update Claim Status
- [ ] Find a claim in table
- [ ] Click on status dropdown
- [ ] Change from "مسودة" → "مقدم" (Draft → Submitted)
- [ ] Verify toast success message
- [ ] Change to "معتمد" (Approved)
- [ ] Verify status badge updates
- [ ] Change to "مدفوع" (Paid)
- [ ] Verify المستخلصات المدفوعة updates in summary

### 7. Multi-tenant Isolation
- [ ] Create expenses/claims in Organization A
- [ ] Switch to Organization B
- [ ] Navigate to same project (if exists) or another project
- [ ] Verify expenses/claims from Org A are NOT visible

### 8. Permission Checks
- [ ] Log in as a user without edit permissions (if applicable)
- [ ] Verify "إضافة مصروف" and "مستخلص جديد" buttons are disabled or hidden
- [ ] Verify status dropdown is disabled

### 9. Arabic RTL Layout
- [ ] Verify all text is right-aligned
- [ ] Verify numbers format correctly in Arabic locale (SAR currency)
- [ ] Verify date formats are correct (dd/MM/yyyy)
- [ ] Verify icons and buttons align correctly

### 10. Mobile Responsive
- [ ] Open finance page on mobile viewport (375px width)
- [ ] Verify summary cards stack correctly (2 columns on mobile)
- [ ] Verify tables are scrollable horizontally if needed
- [ ] Verify forms are usable on mobile

### 11. Navigation
- [ ] Click back button from finance page → returns to project overview
- [ ] Click back from new-expense page → returns to finance page
- [ ] Click back from new-claim page → returns to finance page
- [ ] Click cancel in forms → returns to finance page

### 12. Error Handling
- [ ] Submit expense form without required fields → verify validation message
- [ ] Submit claim form without amount → verify validation message
- [ ] Try to access finance page for non-existent project → verify 404 or error

## Expected Database Changes After Tests
```sql
-- Check expenses created
SELECT * FROM project_expenses WHERE organization_id = 'your-org-id';

-- Check claims created
SELECT * FROM project_claims WHERE organization_id = 'your-org-id';

-- Verify claim numbers are sequential per project
SELECT project_id, claim_no FROM project_claims ORDER BY project_id, claim_no;
```

## Known Limitations
- Attachment upload for expenses is not yet implemented (UI shows field but file upload not connected)
- No edit/delete functionality for expenses and claims (can be added later)
- No pagination for large lists (can be added if needed)
