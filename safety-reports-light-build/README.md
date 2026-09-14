# Safety Reports & Transfer Insight (Light Mode)

Portable UGMC dashboard pages with shared light-only UI:

- **Safety & Reports** — `/dashboard/safety-reports`
- **Transfer Insight** — `/dashboard/transfer-insight` (placeholder metrics; wire data later)

Includes sidebar navigation, top bar, cards, and animations matching the `ugmc-dashboard` design system.

## Install peers

```bash
npm install clsx react-icons apexcharts react-apexcharts
```

## Integrate

1. Copy `src/` into your Next.js app (e.g. `src/safety-reports/`).

2. **tsconfig.json**:

```json
{
  "compilerOptions": {
    "paths": {
      "@safety-reports": ["./src/safety-reports"],
      "@safety-reports/*": ["./src/safety-reports/*"]
    }
  }
}
```

3. **Tailwind v4** — in global CSS:

```css
@source "../src/safety-reports/**/*.{js,ts,jsx,tsx}";
```

4. **Layout**:

```tsx
import "@safety-reports/styles/globals-light.css";

<html lang="en" className="light">
```

5. **Routes** (wrap each page with `DashboardLayout` for the sidebar):

```tsx
// app/dashboard/safety-reports/page.tsx
import { DashboardLayout, SafetyReportsPage } from "@safety-reports";

export default function Page() {
  return (
    <DashboardLayout>
      <SafetyReportsPage />
    </DashboardLayout>
  );
}
```

```tsx
// app/dashboard/transfer-insight/page.tsx
import { DashboardLayout, TransferInsightPage } from "@safety-reports";

export default function Page() {
  return (
    <DashboardLayout>
      <TransferInsightPage />
    </DashboardLayout>
  );
}
```

6. **Logo** — copy `public/assets/images/ugmc-logo-full-light-mode.png` from `ugmc-sidebar-light.zip` or your UGMC assets.

## Wiring Transfer Insight data

Replace placeholder values in:

- `TransferInsightPage.tsx` — `kpiData` array
- `components/transfer-insight/*` — stat cards, chart, pipeline, recent list

Safety Reports already uses static demo data in the same pattern.

## Exports

| Export | Description |
|--------|-------------|
| `SafetyReportsPage` | Safety KPIs and charts |
| `TransferInsightPage` | Transfer dashboard shell (data TBD) |
| `DashboardLayout` | Sidebar + main content area |
| `Sidebar` / `SidebarProvider` | Light navigation |
