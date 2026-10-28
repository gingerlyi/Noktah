-- Riwayat versi PRD: salinan isi lama yang diambil saat PRD diubah (paling sering tiap 10 menit)
-- dan sebelum versi lama dipulihkan. Paling banyak 50 versi per PRD.
CREATE TABLE prd_versions (
    id         bigserial PRIMARY KEY,
    prd_id     uuid NOT NULL REFERENCES prds (id) ON DELETE CASCADE,
    name       text NOT NULL,
    state      jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX prd_versions_prd_idx ON prd_versions (prd_id, created_at DESC);
