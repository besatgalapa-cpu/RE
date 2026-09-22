# PRD — Sistem Laporan Rasio Elektrifikasi Kabupaten Murung Raya

## Problem Statement
Website laporan rasio elektrifikasi Kabupaten Murung Raya dengan Admin Panel: Login Admin, Ringkasan, Upload Excel, Data Desa/Kelurahan, Data Kecamatan, Data Keluarga/RT, Periode Data, Pengguna Admin, Pengaturan. Alur: Upload Excel → Validasi → Simpan → Dashboard diperbarui. Data dari file Excel RE TW I & TW II 2026.

## Architecture
- Backend: FastAPI + MongoDB (motor). Modules: server.py, auth.py (JWT+bcrypt), excel_parser.py (openpyxl).
- Frontend: React 19 + Tailwind + shadcn/ui + recharts + sonner. Auth token in localStorage (`re_token`), Bearer header.
- Theme: light professional civic (teal #0D9488, PLN blue, EBT green, amber). Fonts: Plus Jakarta Sans + JetBrains Mono.

## User Personas
- Super Admin ESDM: full access, kelola data & pengguna.
- Verifikator Data / Viewer Eksekutif: peran tambahan (dikelola via Pengguna Admin).

## Core Requirements (static)
- Username+password login (admin / adminRE1234#).
- Dashboard KPI + 4 charts (donut proporsi, bar per kecamatan, area trend, stacked PLN/Non-PLN).
- Upload Excel → validasi → preview → commit → dashboard update.
- Data tables: Kecamatan, Desa/Kelurahan, Keluarga/RT (paginated).
- Periode management (aktif/lock), Pengguna Admin CRUD, Pengaturan.

## Implemented (2026-06)
- [x] JWT username auth + admin seed + user management
- [x] Auto-seed real data: TW I 2026 (37,041 RT) & TW II 2026 (36,800 RT), 10 kecamatan, 756 households, 43 desa
- [x] Dashboard with KPIs, donut, per-kecamatan bar, trend area, stacked bar, period selector, target progress
- [x] Data Kecamatan (search, period switch, CSV export), Data Desa (filter/search), Data Keluarga/RT (search + pagination)
- [x] Upload flow with real openpyxl parser for "RE MURUNG RAYA" sheet + validation + commit
- [x] Periode Data CRUD (activate/lock/delete), Pengguna Admin CRUD, Pengaturan
- [x] Tested: backend 17/17, frontend all flows pass
- [x] Removed "Data Keluarga/RT" from sidebar menu (per user visual edit)

## Backlog / Next (P1/P2)
- P1: Per-desa electrification detail (from detailed sheet keterangan PLN/Non-PLN, jenis pembangkit, sumber bantuan)
- P1: Export dashboard to PDF/print report
- P2: Map visualization of kecamatan
- P2: Audit log for uploads/edits
- P2: Role-based access enforcement (currently all authed users have full access)

## Notes
- No email/password-reset (username-only internal login).
- Period kode format: TW1-2026 / TW2-2026.
