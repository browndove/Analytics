# Insights — Clinical Operations (standalone)

Portable Next.js slice of the UGMC **Clinical Operations** dashboard: Topbar, subscription cards, ApexCharts widgets, and metric cards with theme support (light / dark / blue).

## Run standalone

```bash
npm install
npm run dev
```

Open [http://localhost:3000/insights](http://localhost:3000/insights).

## Merge into another Next.js app

1. Copy these folders/files into your host project (merge where paths overlap):
   - `app/insights/` → your `app/insights/` (or rename the route folder)
   - `components/` → your `components/`
   - `lib/theme-colors.ts` → your `lib/`
2. Merge `app/globals.css` theme tokens, `@theme inline`, and animation utilities **or** import this package’s `globals.css` from your root layout.
3. Add dependencies from `package.json`:
   - `apexcharts`, `react-apexcharts`, `next-themes`, `clsx`, `react-icons`
   - Dev: `tailwindcss`, `@tailwindcss/postcss`
4. Ensure `tsconfig.json` has `"@/*": ["./*"]` and PostCSS uses `@tailwindcss/postcss` (see `postcss.config.mjs`).
5. Copy `apexcharts-globals.d.ts` and add it to `tsconfig.json` `include` (required for ApexCharts types in chart components).

## Route

Default page: `/insights` (`app/insights/page.tsx`).

## Assets

Replace `public/assets/images/dr-tanko.png` with your own avatar if needed.
