-- Skema awal Rancang PRD.

CREATE TABLE users (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email          text NOT NULL,
    name           text NOT NULL,
    password_hash  text NOT NULL,
    role           text NOT NULL DEFAULT 'user'
                   CHECK (role IN ('user', 'analis', 'konten', 'admin', 'pemilik')),
    created_at     timestamptz NOT NULL DEFAULT now(),
    last_active_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_key ON users (lower(email));

-- Sesi login. Yang disimpan hanya hash SHA-256 dari token, bukan tokennya.
CREATE TABLE sessions (
    token_hash bytea PRIMARY KEY,
    user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_expires_idx ON sessions (expires_at);

-- PRD milik pengguna. Isi formulir disimpan utuh sebagai JSON.
CREATE TABLE prds (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name         text NOT NULL DEFAULT '',
    template_key text NOT NULL DEFAULT '',
    state        jsonb NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX prds_user_updated_idx ON prds (user_id, updated_at DESC);

-- Catatan pembuatan PRD untuk grafik dashboard. Tetap ada walau PRD-nya dihapus.
CREATE TABLE prd_events (
    id           bigserial PRIMARY KEY,
    user_id      uuid REFERENCES users (id) ON DELETE SET NULL,
    template_key text NOT NULL DEFAULT '',
    created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX prd_events_created_idx ON prd_events (created_at);

-- Templat buatan admin. Templat bawaan ada di kode frontend.
CREATE TABLE templates (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    summary    text NOT NULL DEFAULT '',
    base       text NOT NULL,
    hidden     boolean NOT NULL DEFAULT true,
    state      jsonb NOT NULL,
    created_by uuid REFERENCES users (id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Pengaturan situs: satu baris saja.
CREATE TABLE site_settings (
    id             smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    title          text NOT NULL DEFAULT '',
    subtitle       text NOT NULL DEFAULT '',
    hidden_builtin text[] NOT NULL DEFAULT '{}',
    updated_at     timestamptz NOT NULL DEFAULT now()
);
INSERT INTO site_settings (id) VALUES (1);
