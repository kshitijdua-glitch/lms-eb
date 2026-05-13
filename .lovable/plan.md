# Remove Consent Flow from STB

Since no SMS service is available to capture customer consent, strip the consent capture/gating logic from the entire product. STB will no longer require consent as a precondition, and consent UI/notifications/config will be removed.

## What gets removed

### STB submission flow
- **`src/components/STBWizardDialog.tsx`** — drop `consentReceived` prop, remove the eligibility issue "Customer consent has not been recorded yet", remove the `consent_captured` checklist item, and remove the "Consent" tile on the Eligibility step.
- **`src/pages/LeadDetailPage.tsx`** — remove the entire Consent panel (Trigger SMS Consent / Resend / Mark Received / Clear Consent buttons + state: `consentStatus`, `consentSentAt`, `handleTriggerConsent`, `handleMarkConsentReceived`, `handleClearConsent`). Remove the `!consentReceived` disable + tooltip on the STB button. Drop `consentReceived` / `consentLabel` props passed to `ManualCallPanel` and `STBWizardDialog`.

### Lead creation
- **`src/components/CreateLeadWizard.tsx`** — remove Step 5 "Consent" entirely (checkboxes for contactConsent/dataConsent, validation, summary row, and state fields). Stepper becomes 4 steps.

### Manual call panel
- **`src/components/ManualCallPanel.tsx`** — remove consent badge block and the "Check consent and contact preference before calling" helper line; drop `consentReceived` / `consentLabel` props.

### Configuration
- **`src/lib/configStore.ts`** — remove `enforceConsentBeforeSTB` from `CallRulesConfig` and defaults.
- **`src/pages/admin/ConfigPage.tsx`** — remove the "Enforce consent before STB" switch.
- **`src/pages/SystemConfigPage.tsx`** — remove the `consentExpiry` state and the "Consent Required" notification toggle.

### Dashboards & notifications
- **`src/components/dashboards/ClusterHeadDashboard.tsx`** — remove the "Consent Missing" compliance tile and `consentMissing` calculation.
- **`src/components/NotificationsDrawer.tsx`** — remove `consent_received` icon mapping and the consent branch in the color logic.
- **`src/data/mockData.ts`** — remove the `consent_received` notification (n-4), the "Consent Risk Alert" notification (n-20), the `consent_missing` disposition entry, and the `consentStatus` field seeded on leads.

### Partner eligibility & types
- **`src/lib/partnerEligibility.ts`** — remove `consent_missing` from compliance disposition checks and the doc comment.
- **`src/types/lms.ts`** — remove `"consent_missing"` from disposition union, remove `consentStatus` field from the lead type, and remove `"consent_received"` from notification type union.

### Marketing copy
- **`src/pages/LandingPage.tsx`** — update the security/compliance description to no longer mention "consent capture" (e.g., "PII masking and an immutable audit trail for every interaction").

## Out of scope
- No backend changes (mock-data app). Any historical audit-log entries that reference past consent actions remain; only forward UI/logic is removed.
- We are not removing the broader Audit Trail or PII masking — only consent.

## Verification
- Open a lead detail page → no Consent panel; STB button is enabled (subject to other rules).
- Run STB Wizard → Eligibility step no longer shows consent issue/tile; checklist no longer has consent item.
- Create Lead wizard ends at the previous Step 4 (Review).
- Cluster Head dashboard no longer shows Consent Missing tile.
- Admin → Config no longer shows the Enforce Consent toggle.
- TypeScript build passes after removing `consentStatus` and union members.
