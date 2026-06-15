# SurfersCafe

A modern café ordering frontend built with React, TypeScript, and Vite.

## Overview

SurfersCafe is a point-of-sale style ordering interface for a café menu. It supports:
- Menu browsing and cart management
- Checkout with optional service type (`內用` / `外帶`)
- Multiple payment methods including `現金`, `LINE Pay`, `街口支付`, `刷卡`, and deferred pay (`待付款`)
- Pending orders displayed as `待付款` until payment is completed
- Active order management and memo editing
- Daily summary and settlement view
- Local persistence using `localStorage`

## Tech stack

- React + TypeScript
- Vite
- Tailwind CSS
- Radix UI components
- date-fns
- lucide-react icons

## Project structure

- `src/main.tsx` — application bootstrap
- `src/app/App.tsx` — main app state, order workflow, and navigation
- `src/app/components/Checkout.tsx` — checkout flow and payment split UI
- `src/app/components/ActiveOrders.tsx` — active/completed order list and settlement actions
- `src/app/components/DailySummary.tsx` — revenue summary and daily settlement
- `src/app/components/Menu.tsx` — menu listing and cart controls
- `src/app/styles/` — CSS and theme files

## Getting started

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the console.

## Build

```bash
npm run build
```

## Notes

- Order data is saved in `localStorage` under the `menu_system_orders_v1` key.
- Checkout logs may be sent to a Google Sheets web app via `SHEETS_WEBAPP_URL` in `src/app/App.tsx`.
- Deferred payment orders (`待付款`) are held as pending and are not logged until payment is settled.

## License

This repository is provided as-is for development and demo purposes.
