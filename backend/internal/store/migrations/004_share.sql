-- Tautan bagikan: siapa pun yang punya token bisa membaca PRD dan berkomentar tanpa akun.
-- Token disimpan apa adanya karena pemilik perlu melihat tautannya lagi; mencabutnya cukup mengosongkan kolom ini.
ALTER TABLE prds ADD COLUMN share_token text UNIQUE;

CREATE TABLE prd_comments (
    id         bigserial PRIMARY KEY,
    prd_id     uuid NOT NULL REFERENCES prds (id) ON DELETE CASCADE,
    name       text NOT NULL,
    body       text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX prd_comments_prd_idx ON prd_comments (prd_id, created_at);
