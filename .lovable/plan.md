

# Plan: Remove Bureau/BRE, Add Manual Credit & Bank Selection

## Summary
Remove the Bureau Report section, BRE Eligibility section, and Bureau Campaign admin page. Replace with: (1) manually editable credit score + existing loan details on lead profile, (2) a multi-select bank/NBFC + product type picker per lead. Rename `bre_done` stage to `bank_selected`.

## What Changes for Users

- **Lead Detail page**: Bureau Report card and BRE Eligibility card are replaced with:
  - **Credit & Obligations card**: Editable credit score, current loans (bank, amount, EMI, type), added manually by agent/manager
  - **Bank Selection card**: Multi-select dropdown of banks/NBFCs from `lendingPartners`, plus product type per selection. Shows selected banks as badges.
- **"Check Eligibility" button** removed from action bar
- **Stage pipeline**: "BRE Done" tab renamed to "Bank Selected" everywhere
- **Bureau Campaign admin page** removed from sidebar and routes
- **BRE-related dispositions** kept as legacy compat but removed from primary disposition groups

## Technical Changes

### 1. Types (`src/types/lms.ts`)
- Rename `bre_done` → `bank_selected` in `LeadStage`
- Remove `BREResult` interface
- Remove `breResult`, `bureauStatus`, `bureauPulledAt` from `Lead`
- Add to `Lead`: `existingLoans: ExistingLoan[]`, `selectedBanks: SelectedBank[]`
- New interfaces:
  ```
  ExistingLoan { bankName, loanType, outstandingAmount, emi, tenure }
  SelectedBank { partnerId, partnerName, productType, selectedAt, selectedBy }
  ```

### 2. Mock Data (`src/data/mockData.ts`)
- Remove `breResult` generation, `bureauStatus`, `bureauPulledAt` from lead generation
- Add mock `existingLoans` and `selectedBanks` arrays
- Update `getStageLabel`: `bank_selected: "Bank Selected"`
- Remove BRE Ineligible dispositions from primary `dispositionGroups` (keep in config for legacy)

### 3. Lead Detail Page (`src/pages/LeadDetailPage.tsx`)
- **Remove**: Bureau Report card (lines 209-233), BRE Eligibility card (lines 236-279), `breMode` state, `handleCheckEligibility`, `bureauFreshness`, "Check Eligibility" button
- **Remove**: Bureau timeline entry from `timelineEvents`
- **Add**: Credit & Obligations card — editable credit score input, table of existing loans with add/remove
- **Add**: Bank Selection card — multi-select from `lendingPartners` with product type dropdown per bank
- **Update**: Pre-STB checklist: remove BRE check, keep consent + PAN checks

### 4. Stage Tabs (3 files)
- `LeadsPage.tsx`, `GroupLeadsPage.tsx`, `OrgLeadsPage.tsx`: Replace `bre_done` with `bank_selected` in stages array

### 5. Delete Bureau Campaign
- Delete `src/pages/admin/BureauCampaignPage.tsx`
- Remove route from `src/App.tsx`
- Remove sidebar link from `src/components/AppSidebar.tsx`

### 6. Other References
- `mockData.ts`: Remove `"BRE Ineligible"` from primary disposition groups, update stage label
- Any file referencing `bureauStatus`, `breResult`, `bureauPulledAt` — clean up

## Files Touched
- **Edit**: ~8 files (types, mockData, LeadDetailPage, LeadsPage, GroupLeadsPage, OrgLeadsPage, App.tsx, AppSidebar)
- **Delete**: 1 file (BureauCampaignPage)

