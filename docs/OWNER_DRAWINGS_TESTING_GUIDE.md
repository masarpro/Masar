# Owner Drawings — Manual Testing Guide

> 10 scenarios to verify the complete Owner Profit Cycle feature.

---

## Prerequisites

- A running dev instance (`pnpm dev`)
- An organization with accounting activated (chart of accounts seeded)
- At least one bank account with sufficient balance (e.g., 100,000 SAR)
- At least one project with financial activity (invoices/payments creating revenue in journal entries)

---

## Scenario 1: New Organization — Auto-Setup

**Steps:**
1. Create a new organization (or use an existing one without owners)
2. Navigate to **Finance → Owner Drawings** for the first time
3. The system should call `ensureOwnerDrawingsSystem` automatically

**Expected:**
- Account `3400` (سحوبات الشركاء) created as parent (non-postable)
- Account `3410` (سحوبات المالك) created as sub-account
- Default owner "المالك" created with 100% ownership
- Owner linked to account `3410`

**Verify:**
- Chart of Accounts → search for "3400" and "3410"
- Settings → Owners → one owner "المالك" at 100%

---

## Scenario 2: Add Second Partner

**Steps:**
1. Navigate to **Settings → Owners**
2. Click "Add Owner"
3. Enter: name="أحمد", ownership=40%
4. Save

**Expected:**
- New owner created
- Account `3420` (سحوبات أحمد) auto-created
- Total ownership warning: 140% > 100% (if original owner still at 100%)
- Fix: Update original owner to 60%

**Verify:**
- Chart of Accounts → `3420` exists under `3400`
- Settings → Owners → progress bar shows 100% (green) after fixing percentages

---

## Scenario 3: General Drawing (No Project)

**Steps:**
1. Navigate to **Finance → Owner Drawings → New**
2. Select owner: "المالك"
3. Select bank account
4. Enter amount: 5,000 SAR
5. Leave project empty (general drawing)
6. Click "Save Draft"
7. Open the created drawing → Click "Approve"

**Expected:**
- Drawing created with type `COMPANY_LEVEL`
- After approval:
  - Bank balance decremented by 5,000
  - Journal entry created: DR 3410 / CR bank account
  - Journal entry has NO projectId on lines
  - Status = APPROVED

**Verify:**
- Journal Entries → search for "OWD-JE" → entry exists with correct amounts
- Banks → balance reduced by 5,000

---

## Scenario 4: Project-Specific Drawing (Profitable Project)

**Steps:**
1. Navigate to **Finance → Owner Drawings → New**
2. Select owner and bank
3. Enter amount: 3,000 SAR
4. Select a project that has positive profit (check Cost Center report first)
5. Save and approve

**Expected:**
- Drawing created with type `PROJECT_SPECIFIC`
- Journal entry: DR 3410 / CR bank — BOTH lines have `projectId` set
- Cost Center report for this project shows drawings deducted from profit
- No overdraw warning (amount < project profit)

**Verify:**
- Accounting Reports → Cost Center → project shows updated "net after drawings"
- Journal entry lines → projectId field populated

---

## Scenario 5: Drawing from Losing/Low-Profit Project (Overdraw Warning)

**Steps:**
1. Navigate to **Finance → Owner Drawings → New**
2. Select owner and bank
3. Enter amount larger than the project's profit (e.g., project profit = 2,000, enter 5,000)
4. Select the low-profit project
5. The context cards should update showing overdraw

**Expected:**
- ProjectContextCard shows: Profit = 2,000, Previous = 0, Available = 2,000
- Red warning appears: "Overdraw by 3,000 SAR"
- On submit: `OverdrawWarningDialog` appears with 3 buttons:
  1. "إلغاء" — closes dialog, no action
  2. "تحويل لسحب عام" — removes project, resubmits
  3. "تأكيد رغم التجاوز" — submits with `acknowledgeOverdraw=true`

---

## Scenario 6: Confirm Overdraw

**Steps:**
1. Continue from Scenario 5
2. Click "تأكيد رغم التجاوز" (Confirm Despite Overdraw)

**Expected:**
- Drawing created with:
  - `hasOverdrawWarning = true`
  - `overdrawAmount = 3,000`
  - `overdrawAcknowledgedBy = current user ID`
  - `overdrawAcknowledgedAt = now`
- Audit log: `OWNER_DRAWING_OVERDRAW_ACKNOWLEDGED`
- Drawing detail page shows amber overdraw warning badge

**Verify:**
- Open drawing detail → amber badge "تحذير تجاوز" visible
- Audit log → search for OVERDRAW_ACKNOWLEDGED

---

## Scenario 7: Insufficient Bank Balance (Hard Block)

**Steps:**
1. Navigate to **Finance → Owner Drawings → New**
2. Select a bank account with low balance (e.g., 500 SAR)
3. Enter amount: 10,000 SAR
4. Try to submit

**Expected:**
- BankBalanceCard shows red warning: "Insufficient" with negative after-balance
- Submit button disabled or error on submit
- Drawing NOT created — this is the only hard block

---

## Scenario 8: Cancel Approved Drawing (Reverse)

**Steps:**
1. Find an APPROVED drawing (from Scenario 3 or 4)
2. Open it → Click "Cancel"
3. Enter cancellation reason
4. Confirm

**Expected:**
- Drawing status → CANCELLED
- Bank balance restored (incremented back)
- Journal entry REVERSED (new reversal entry created with swapped debits/credits)
- `cancelledAt` and `cancelReason` populated

**Verify:**
- Banks → balance restored to original
- Journal Entries → two entries: original + reversal (status REVERSED)
- Drawing detail → shows cancel reason and cancelled date

---

## Scenario 9: Year-End Closing After Drawings

**Steps:**
1. Ensure the current year has:
   - Revenue (invoices issued)
   - Expenses (expenses recorded)
   - Approved owner drawings
2. Navigate to **Finance → Year-End Closing**
3. Select the year → Click "Preview"
4. Review: revenue, expenses, net profit, profit distribution table
5. Click "Execute" → Confirm

**Expected:**
- **Closing Entry (YEAR_END_CLOSING):**
  - DR each 4xxx revenue account (zeros it)
  - CR each 5xxx/6xxx expense account (zeros it)
  - Net to CR 3200 (Retained Earnings) if profit
- **Drawings Transfer Entry (YEAR_END_RETAINED):**
  - DR 3200 (by total drawings amount)
  - CR each 34xx account (zeros owner drawings)
- Profit Distribution Table shows per-owner breakdown:
  - Share = netProfit × ownership%
  - Drawings = sum of approved drawings
  - Net to Retained = share - drawings
- `YearEndClosing` record created

**Verify:**
- Trial Balance → all 4xxx/5xxx/6xxx accounts zeroed
- Trial Balance → 34xx accounts zeroed
- Trial Balance → 3200 updated with retained earnings
- Year-End → History table shows COMPLETED entry

---

## Scenario 10: Balance Sheet — Drawings as Contra-Equity

**Steps:**
1. Before year-end closing (with active drawings):
   - Navigate to **Accounting Reports → Balance Sheet**
   - Look at Equity section

**Expected:**
- Equity section shows:
  ```
  حقوق الملكية:
    3100 رأس المال                   XXX,XXX
    3200 أرباح مبقاة                 XXX,XXX
    (-) سحوبات الشركاء:
      3410 سحوبات المالك             (XX,XXX)
      3420 سحوبات أحمد              (XX,XXX)
    ────────────────────────────────
    صافي حقوق الملكية              XXX,XXX
  ```
- 34xx accounts shown with parentheses/negative (contra-equity)
- Total equity = capital + retained earnings - drawings

---

## Quick Checklist

| # | Scenario | Status |
|---|----------|--------|
| 1 | New org auto-setup (3400/3410/default owner) | ☐ |
| 2 | Add second partner (3420 created) | ☐ |
| 3 | General drawing (no project) | ☐ |
| 4 | Project-specific drawing (profitable) | ☐ |
| 5 | Overdraw warning dialog appears | ☐ |
| 6 | Confirm overdraw (hasOverdrawWarning=true) | ☐ |
| 7 | Bank insufficient = hard block | ☐ |
| 8 | Cancel approved drawing (reverse journal) | ☐ |
| 9 | Year-end closing (profits + drawings) | ☐ |
| 10 | Balance sheet shows contra-equity | ☐ |
