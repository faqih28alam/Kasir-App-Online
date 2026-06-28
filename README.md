# Kasir App — Demo

Live demo of a web-based Point of Sale (POS) system built for small retail stores.

> **Frontend-only demo** — no backend required. All data lives in memory and resets on page refresh.

## Demo

| Role  | Username | Password   | Access |
|-------|----------|------------|--------|
| Owner | `admin`  | `admin123` | Full access (all menus + reports) |
| Kasir | `kasir`  | `kasir123` | POS screen only |

## Features

- **Kasir (POS)** — barcode lookup, tiered pricing, qty/discount numpad, payment flow, change calculation
- **Master Barang** — add/edit/delete products, tiered pricing per product
- **Penjualan** — per-item sales detail, void transactions (admin/owner)
- **Laporan** — daily revenue chart, top products, gross profit card
- **Keuangan** — income & expense ledger with manual entries
- **Pembelian** — purchase orders, draft → confirm flow (auto-increments stock)
- **Master User** — manage cashier accounts
- **Setting** — store info, receipt footer

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |

## Run Locally

```bash
git clone https://github.com/faqih28alam/Kasir-App-Online.git
cd Kasir-App-Online
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- Data is **in-memory only** — changes reset on every page refresh
- 18 transactions are pre-seeded across the last 12 days so reports and charts have sample data
- The full production version (with Python/FastAPI backend and SQLite) is a separate private repo
