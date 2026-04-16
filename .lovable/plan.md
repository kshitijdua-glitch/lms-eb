

# Plan: Move Performance into MIS & Reports for Cluster Head and Data Admin

## Summary
Remove the "Performance" sidebar link for Cluster Head and Data Admin roles. Instead, add a "Team Performance" tab/section inside the MIS & Reports page so these roles can view performance data there.

## Changes

### 1. `src/components/AppSidebar.tsx`
- Remove `{ title: "Performance", url: "/performance", icon: TrendingUp }` from `clusterHeadNav` array
- Remove `{ title: "Performance", url: "/performance", icon: TrendingUp }` from `adminNav` array

### 2. `src/pages/ReportsPage.tsx`
- Add a Tabs layout wrapping the existing content under a "MIS Reports" tab
- Add a new "Team Performance" tab that embeds the same performance content (KPI cards + trend chart) from `PerformancePage.tsx`
- Import `performanceData` from mockData, plus chart and icon components
- The performance tab will show the same KPI summary cards and metric trend line chart currently on the Performance page

### 3. `src/components/dashboards/ClusterHeadDashboard.tsx`
- Remove the `{ label: "Performance", icon: TrendingUp, path: "/performance" }` entry from the Quick Navigation grid

## Technical Notes
- Agent and Manager roles keep their standalone Performance sidebar link unchanged
- The Reports page will use shadcn Tabs to separate MIS Reports from Team Performance

