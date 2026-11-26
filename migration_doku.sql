-- Migration: dukungan DOKU Checkout
-- Jalankan via: npx wrangler d1 execute auramedpro-db --remote --file=migration_doku.sql

-- Pencarian cepat saat notifikasi DOKU masuk + mencegah invoice ganda
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_reference_unique
  ON payments(reference_id) WHERE reference_id IS NOT NULL;
