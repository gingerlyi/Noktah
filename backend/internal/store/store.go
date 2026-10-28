// Package store berisi semua akses ke PostgreSQL.
package store

import (
	"context"
	"database/sql"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/lib/pq"
)

//go:embed migrations/*.sql
var migrationFiles embed.FS

var (
	ErrNotFound   = errors.New("tidak ditemukan")
	ErrLimit      = errors.New("batas tercapai")
	ErrEmailTaken = errors.New("email sudah terdaftar")
)

type Store struct {
	db *sql.DB
}

// Open membuka koneksi dan menunggu sampai database siap (berguna saat
// dijalankan bersama PostgreSQL lewat Docker Compose).
func Open(ctx context.Context, url string) (*Store, error) {
	db, err := sql.Open("postgres", url)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(20)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(30 * time.Minute)

	deadline := time.Now().Add(45 * time.Second)
	for {
		pingCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
		err = db.PingContext(pingCtx)
		cancel()
		if err == nil {
			return &Store{db: db}, nil
		}
		if time.Now().After(deadline) || ctx.Err() != nil {
			db.Close()
			return nil, fmt.Errorf("database tidak bisa dihubungi: %w", err)
		}
		time.Sleep(time.Second)
	}
}

func (s *Store) Close() error { return s.db.Close() }

// Migrate menjalankan berkas di migrations/ yang belum pernah dijalankan,
// berurutan menurut nomor di depan nama berkas.
func (s *Store) Migrate(ctx context.Context) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Kunci supaya dua proses yang mulai bersamaan tidak bermigrasi dua kali.
	if _, err := tx.ExecContext(ctx, `SELECT pg_advisory_xact_lock(727364)`); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (
		version int PRIMARY KEY, name text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`); err != nil {
		return err
	}
	entries, err := migrationFiles.ReadDir("migrations")
	if err != nil {
		return err
	}
	names := make([]string, 0, len(entries))
	for _, e := range entries {
		names = append(names, e.Name())
	}
	sort.Strings(names)
	for _, name := range names {
		version, err := strconv.Atoi(strings.SplitN(name, "_", 2)[0])
		if err != nil {
			return fmt.Errorf("nama migrasi %q harus diawali nomor", name)
		}
		var done bool
		if err := tx.QueryRowContext(ctx, `SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE version = $1)`, version).Scan(&done); err != nil {
			return err
		}
		if done {
			continue
		}
		body, err := migrationFiles.ReadFile("migrations/" + name)
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, string(body)); err != nil {
			return fmt.Errorf("migrasi %s gagal: %w", name, err)
		}
		if _, err := tx.ExecContext(ctx, `INSERT INTO schema_migrations (version, name) VALUES ($1, $2)`, version, name); err != nil {
			return err
		}
	}
	return tx.Commit()
}

// ---------- Pengguna dan sesi ----------

type User struct {
	ID           string     `json:"id"`
	Email        string     `json:"email"`
	Name         string     `json:"name"`
	Role         string     `json:"role"`
	CreatedAt    time.Time  `json:"createdAt"`
	LastActiveAt time.Time  `json:"lastActiveAt"`
	PremiumUntil *time.Time `json:"premiumUntil"`
}

// Premium: langganan masih berlaku. Staf (peran selain "user") selalu dianggap Premium.
func (u User) Premium(now time.Time) bool {
	return u.Role != "user" || (u.PremiumUntil != nil && u.PremiumUntil.After(now))
}

const userCols = `id, email, name, role, created_at, last_active_at, premium_until`

func scanUser(row interface{ Scan(...any) error }, extra ...any) (User, error) {
	var u User
	dest := append([]any{&u.ID, &u.Email, &u.Name, &u.Role, &u.CreatedAt, &u.LastActiveAt, &u.PremiumUntil}, extra...)
	err := row.Scan(dest...)
	if errors.Is(err, sql.ErrNoRows) {
		return User{}, ErrNotFound
	}
	return u, err
}

func isUniqueViolation(err error) bool {
	var pe *pq.Error
	return errors.As(err, &pe) && pe.Code == "23505"
}

func (s *Store) CreateUser(ctx context.Context, email, name, passwordHash, role string) (User, error) {
	u, err := scanUser(s.db.QueryRowContext(ctx,
		`INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING `+userCols,
		email, name, passwordHash, role))
	if isUniqueViolation(err) {
		return User{}, ErrEmailTaken
	}
	return u, err
}

// UserByEmail mengembalikan pengguna beserta hash kata sandinya.
func (s *Store) UserByEmail(ctx context.Context, email string) (User, string, error) {
	var hash string
	u, err := scanUser(s.db.QueryRowContext(ctx,
		`SELECT `+userCols+`, password_hash FROM users WHERE lower(email) = lower($1)`, email), &hash)
	return u, hash, err
}

// EnsureOwner membuat akun pemilik bila belum ada satu pun pemilik.
// Bila email itu sudah terdaftar sebagai akun biasa, akun itu dinaikkan jadi pemilik.
func (s *Store) EnsureOwner(ctx context.Context, email, name, passwordHash string) (created bool, err error) {
	var n int
	if err := s.db.QueryRowContext(ctx, `SELECT count(*) FROM users WHERE role = 'pemilik'`).Scan(&n); err != nil {
		return false, err
	}
	if n > 0 {
		return false, nil
	}
	res, err := s.db.ExecContext(ctx, `UPDATE users SET role = 'pemilik' WHERE lower(email) = lower($1)`, email)
	if err != nil {
		return false, err
	}
	if rows, _ := res.RowsAffected(); rows > 0 {
		return true, nil
	}
	_, err = s.CreateUser(ctx, email, name, passwordHash, "pemilik")
	return err == nil, err
}

func (s *Store) CreateSession(ctx context.Context, userID string, tokenHash []byte, expires time.Time) error {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)`, tokenHash, userID, expires)
	return err
}

func (s *Store) UserBySession(ctx context.Context, tokenHash []byte) (User, error) {
	return scanUser(s.db.QueryRowContext(ctx,
		`SELECT u.id, u.email, u.name, u.role, u.created_at, u.last_active_at, u.premium_until
		   FROM sessions s JOIN users u ON u.id = s.user_id
		  WHERE s.token_hash = $1 AND s.expires_at > now()`, tokenHash))
}

func (s *Store) DeleteSession(ctx context.Context, tokenHash []byte) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM sessions WHERE token_hash = $1`, tokenHash)
	return err
}

func (s *Store) DeleteExpiredSessions(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM sessions WHERE expires_at <= now()`)
	return err
}

func (s *Store) TouchUser(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `UPDATE users SET last_active_at = now() WHERE id = $1`, id)
	return err
}

// ---------- PRD ----------

type PRD struct {
	ID          string          `json:"id"`
	Name        string          `json:"name"`
	TemplateKey string          `json:"templateKey"`
	State       json.RawMessage `json:"state"`
	CreatedAt   time.Time       `json:"createdAt"`
	UpdatedAt   time.Time       `json:"updatedAt"`
}

const prdCols = `id, name, template_key, state, created_at, updated_at`

func scanPRD(row interface{ Scan(...any) error }) (PRD, error) {
	var p PRD
	var state []byte
	err := row.Scan(&p.ID, &p.Name, &p.TemplateKey, &state, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return PRD{}, ErrNotFound
	}
	p.State = state
	return p, err
}

func (s *Store) ListPRDs(ctx context.Context, userID string) ([]PRD, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT `+prdCols+` FROM prds WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 500`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []PRD{}
	for rows.Next() {
		p, err := scanPRD(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Store) CountPRDs(ctx context.Context, userID string) (int, error) {
	var n int
	err := s.db.QueryRowContext(ctx, `SELECT count(*) FROM prds WHERE user_id = $1`, userID).Scan(&n)
	return n, err
}

// CreatePRD menyimpan PRD baru dan mencatatnya untuk grafik dashboard.
func (s *Store) CreatePRD(ctx context.Context, userID, name, templateKey string, state json.RawMessage) (PRD, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return PRD{}, err
	}
	defer tx.Rollback()
	p, err := scanPRD(tx.QueryRowContext(ctx,
		`INSERT INTO prds (user_id, name, template_key, state) VALUES ($1, $2, $3, $4::jsonb) RETURNING `+prdCols,
		userID, name, templateKey, string(state)))
	if err != nil {
		return PRD{}, err
	}
	if _, err := tx.ExecContext(ctx, `INSERT INTO prd_events (user_id, template_key) VALUES ($1, $2)`, userID, templateKey); err != nil {
		return PRD{}, err
	}
	if _, err := tx.ExecContext(ctx, `UPDATE users SET last_active_at = now() WHERE id = $1`, userID); err != nil {
		return PRD{}, err
	}
	return p, tx.Commit()
}

func (s *Store) GetPRD(ctx context.Context, userID, id string) (PRD, error) {
	return scanPRD(s.db.QueryRowContext(ctx,
		`SELECT `+prdCols+` FROM prds WHERE id = $1 AND user_id = $2`, id, userID))
}

// UpdatePRD menyimpan isi baru. Isi lama disalin ke riwayat versi bila berubah dan versi terakhir
// sudah lebih dari 10 menit, jadi satu sesi mengedit menghasilkan satu versi.
func (s *Store) UpdatePRD(ctx context.Context, userID, id, name, templateKey string, state json.RawMessage) (PRD, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return PRD{}, err
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO prd_versions (prd_id, name, state)
		 SELECT p.id, p.name, p.state FROM prds p
		  WHERE p.id = $1 AND p.user_id = $2 AND p.state <> $3::jsonb
		    AND NOT EXISTS (SELECT 1 FROM prd_versions v WHERE v.prd_id = p.id AND v.created_at > now() - interval '10 minutes')`,
		id, userID, string(state)); err != nil {
		return PRD{}, err
	}
	p, err := scanPRD(tx.QueryRowContext(ctx,
		`UPDATE prds SET name = $3, template_key = $4, state = $5::jsonb, updated_at = now()
		  WHERE id = $1 AND user_id = $2 RETURNING `+prdCols,
		id, userID, name, templateKey, string(state)))
	if err != nil {
		return PRD{}, err
	}
	if err := pruneVersions(ctx, tx, id); err != nil {
		return PRD{}, err
	}
	return p, tx.Commit()
}

const maxVersions = 50

func pruneVersions(ctx context.Context, tx *sql.Tx, prdID string) error {
	_, err := tx.ExecContext(ctx,
		`DELETE FROM prd_versions WHERE prd_id = $1 AND id NOT IN
		   (SELECT id FROM prd_versions WHERE prd_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2)`, prdID, maxVersions)
	return err
}

type Version struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
}

// ListVersions mengembalikan riwayat versi PRD milik pengguna, yang terbaru lebih dulu.
func (s *Store) ListVersions(ctx context.Context, userID, prdID string) ([]Version, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT v.id, v.name, v.created_at FROM prd_versions v JOIN prds p ON p.id = v.prd_id
		  WHERE p.id = $1 AND p.user_id = $2 ORDER BY v.created_at DESC, v.id DESC`, prdID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Version{}
	for rows.Next() {
		var v Version
		if err := rows.Scan(&v.ID, &v.Name, &v.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, v)
	}
	return out, rows.Err()
}

// RestoreVersion menyalin isi sekarang ke riwayat, lalu mengganti isi PRD dengan versi itu.
// Jadi pemulihan selalu bisa dibatalkan dengan memulihkan versi yang baru dibuat.
func (s *Store) RestoreVersion(ctx context.Context, userID, prdID string, versionID int64) (PRD, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return PRD{}, err
	}
	defer tx.Rollback()
	res, err := tx.ExecContext(ctx,
		`INSERT INTO prd_versions (prd_id, name, state)
		 SELECT p.id, p.name, p.state FROM prds p
		  WHERE p.id = $1 AND p.user_id = $2 AND EXISTS (SELECT 1 FROM prd_versions v WHERE v.id = $3 AND v.prd_id = p.id)`,
		prdID, userID, versionID)
	if err != nil {
		return PRD{}, err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return PRD{}, ErrNotFound
	}
	p, err := scanPRD(tx.QueryRowContext(ctx,
		`UPDATE prds p SET name = v.name, state = v.state, updated_at = now()
		   FROM prd_versions v WHERE p.id = $1 AND p.user_id = $2 AND v.id = $3 AND v.prd_id = p.id
		 RETURNING p.id, p.name, p.template_key, p.state, p.created_at, p.updated_at`,
		prdID, userID, versionID))
	if err != nil {
		return PRD{}, err
	}
	if err := pruneVersions(ctx, tx, prdID); err != nil {
		return PRD{}, err
	}
	return p, tx.Commit()
}

func (s *Store) DeletePRD(ctx context.Context, userID, id string) error {
	res, err := s.db.ExecContext(ctx, `DELETE FROM prds WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}

// ---------- Templat buatan admin ----------

type Template struct {
	ID        string          `json:"id"`
	Name      string          `json:"name"`
	Summary   string          `json:"summary"`
	Base      string          `json:"base"`
	Hidden    bool            `json:"hidden"`
	State     json.RawMessage `json:"state"`
	UpdatedAt time.Time       `json:"updatedAt"`
}

const tplCols = `id, name, summary, base, hidden, state, updated_at`

func scanTemplate(row interface{ Scan(...any) error }) (Template, error) {
	var t Template
	var state []byte
	err := row.Scan(&t.ID, &t.Name, &t.Summary, &t.Base, &t.Hidden, &state, &t.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return Template{}, ErrNotFound
	}
	t.State = state
	return t, err
}

// ListTemplates mengembalikan templat buatan admin. Dengan onlyVisible,
// templat yang disembunyikan tidak ikut.
func (s *Store) ListTemplates(ctx context.Context, onlyVisible bool) ([]Template, error) {
	q := `SELECT ` + tplCols + ` FROM templates`
	if onlyVisible {
		q += ` WHERE NOT hidden`
	}
	rows, err := s.db.QueryContext(ctx, q+` ORDER BY created_at LIMIT 200`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Template{}
	for rows.Next() {
		t, err := scanTemplate(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (s *Store) CountTemplates(ctx context.Context) (int, error) {
	var n int
	err := s.db.QueryRowContext(ctx, `SELECT count(*) FROM templates`).Scan(&n)
	return n, err
}

func (s *Store) CreateTemplate(ctx context.Context, userID, name, summary, base string, state json.RawMessage) (Template, error) {
	return scanTemplate(s.db.QueryRowContext(ctx,
		`INSERT INTO templates (name, summary, base, state, created_by) VALUES ($1, $2, $3, $4::jsonb, $5) RETURNING `+tplCols,
		name, summary, base, string(state), userID))
}

func (s *Store) UpdateTemplate(ctx context.Context, id, name, summary string, hidden bool, state json.RawMessage) (Template, error) {
	return scanTemplate(s.db.QueryRowContext(ctx,
		`UPDATE templates SET name = $2, summary = $3, hidden = $4, state = $5::jsonb, updated_at = now()
		  WHERE id = $1 RETURNING `+tplCols,
		id, name, summary, hidden, string(state)))
}

func (s *Store) DeleteTemplate(ctx context.Context, id string) error {
	res, err := s.db.ExecContext(ctx, `DELETE FROM templates WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}

// ---------- Pengaturan situs ----------

type Site struct {
	Title         string   `json:"title"`
	Subtitle      string   `json:"subtitle"`
	HiddenBuiltin []string `json:"hiddenBuiltin"`
}

func (s *Store) GetSite(ctx context.Context) (Site, error) {
	var site Site
	err := s.db.QueryRowContext(ctx, `SELECT title, subtitle, hidden_builtin FROM site_settings WHERE id = 1`).
		Scan(&site.Title, &site.Subtitle, pq.Array(&site.HiddenBuiltin))
	if site.HiddenBuiltin == nil {
		site.HiddenBuiltin = []string{}
	}
	return site, err
}

func (s *Store) UpdateSiteText(ctx context.Context, title, subtitle string) error {
	_, err := s.db.ExecContext(ctx,
		`UPDATE site_settings SET title = $1, subtitle = $2, updated_at = now() WHERE id = 1`, title, subtitle)
	return err
}

func (s *Store) SetHiddenBuiltin(ctx context.Context, keys []string) error {
	_, err := s.db.ExecContext(ctx,
		`UPDATE site_settings SET hidden_builtin = $1, updated_at = now() WHERE id = 1`, pq.Array(keys))
	return err
}

// ---------- Dashboard admin ----------

type DayCount struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

type KeyCount struct {
	Key   string `json:"key"`
	Count int    `json:"count"`
}

type Stats struct {
	Users       int        `json:"users"`
	PRDs        int        `json:"prds"`
	Active7     int        `json:"active7"`
	PerDay      []DayCount `json:"perDay"`
	ByTemplate  []KeyCount `json:"byTemplate"`
	CustomTotal int        `json:"customTotal"`
	CustomShown int        `json:"customShown"`
}

// Stats menghitung angka dashboard. tz menentukan batas hari pada grafik.
func (s *Store) Stats(ctx context.Context, tz string) (Stats, error) {
	st := Stats{PerDay: []DayCount{}, ByTemplate: []KeyCount{}}
	err := s.db.QueryRowContext(ctx, `SELECT
		(SELECT count(*) FROM users),
		(SELECT count(*) FROM prds),
		(SELECT count(*) FROM users WHERE last_active_at >= now() - interval '7 days'),
		(SELECT count(*) FROM templates),
		(SELECT count(*) FROM templates WHERE NOT hidden)`).
		Scan(&st.Users, &st.PRDs, &st.Active7, &st.CustomTotal, &st.CustomShown)
	if err != nil {
		return st, err
	}

	rows, err := s.db.QueryContext(ctx, `
		WITH today AS (SELECT (now() AT TIME ZONE $1)::date AS d)
		SELECT to_char(g.day, 'YYYY-MM-DD'), coalesce(c.n, 0)
		  FROM today, generate_series(today.d - 13, today.d, interval '1 day') AS g(day)
		  LEFT JOIN (
		        SELECT (created_at AT TIME ZONE $1)::date AS day, count(*) AS n
		          FROM prd_events
		         WHERE created_at >= now() - interval '15 days'
		         GROUP BY 1) c ON c.day = g.day::date
		 ORDER BY g.day`, tz)
	if err != nil {
		return st, err
	}
	for rows.Next() {
		var d DayCount
		if err := rows.Scan(&d.Date, &d.Count); err != nil {
			rows.Close()
			return st, err
		}
		st.PerDay = append(st.PerDay, d)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return st, err
	}

	rows, err = s.db.QueryContext(ctx,
		`SELECT template_key, count(*) FROM prds GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 6`)
	if err != nil {
		return st, err
	}
	defer rows.Close()
	for rows.Next() {
		var k KeyCount
		if err := rows.Scan(&k.Key, &k.Count); err != nil {
			return st, err
		}
		st.ByTemplate = append(st.ByTemplate, k)
	}
	return st, rows.Err()
}

type UserRow struct {
	User
	PRDs int `json:"prds"`
}

// ListUsers mengembalikan pengguna beserta jumlah PRD-nya, yang terakhir aktif lebih dulu.
func (s *Store) ListUsers(ctx context.Context, limit int) ([]UserRow, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT u.id, u.email, u.name, u.role, u.created_at, u.last_active_at, u.premium_until,
		       (SELECT count(*) FROM prds p WHERE p.user_id = u.id)
		  FROM users u ORDER BY u.last_active_at DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []UserRow{}
	for rows.Next() {
		var r UserRow
		u, err := scanUser(rows, &r.PRDs)
		if err != nil {
			return nil, err
		}
		r.User = u
		out = append(out, r)
	}
	return out, rows.Err()
}

// SetRole mengubah peran pengguna yang bukan pemilik.
func (s *Store) SetRole(ctx context.Context, id, role string) (User, error) {
	return scanUser(s.db.QueryRowContext(ctx,
		`UPDATE users SET role = $2 WHERE id = $1 AND role <> 'pemilik' RETURNING `+userCols, id, role))
}

// AddPremium memperpanjang Premium sebanyak days hari, dihitung dari akhir langganan yang masih
// berjalan atau dari sekarang. days = 0 mencabut Premium.
func (s *Store) AddPremium(ctx context.Context, id string, days int) (User, error) {
	return scanUser(s.db.QueryRowContext(ctx,
		`UPDATE users SET premium_until = CASE WHEN $2::int = 0 THEN NULL
		        ELSE greatest(coalesce(premium_until, now()), now()) + make_interval(days => $2::int) END
		  WHERE id = $1 RETURNING `+userCols, id, days))
}

// ---------- Tautan bagikan dan komentar ----------

type Comment struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"createdAt"`
}

// ShareToken mengembalikan token bagikan PRD milik pengguna ("" bila belum dibagikan).
func (s *Store) ShareToken(ctx context.Context, userID, prdID string) (string, error) {
	var t sql.NullString
	err := s.db.QueryRowContext(ctx, `SELECT share_token FROM prds WHERE id = $1 AND user_id = $2`, prdID, userID).Scan(&t)
	if errors.Is(err, sql.ErrNoRows) {
		return "", ErrNotFound
	}
	return t.String, err
}

// SetShareToken memasang token baru, atau mencabutnya bila token kosong.
func (s *Store) SetShareToken(ctx context.Context, userID, prdID, token string) error {
	res, err := s.db.ExecContext(ctx, `UPDATE prds SET share_token = NULLIF($3, '') WHERE id = $1 AND user_id = $2`, prdID, userID, token)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}

// SharedPRD mencari PRD lewat token bagikan, tanpa pemeriksaan pemilik.
func (s *Store) SharedPRD(ctx context.Context, token string) (PRD, error) {
	return scanPRD(s.db.QueryRowContext(ctx, `SELECT `+prdCols+` FROM prds WHERE share_token = $1`, token))
}

func (s *Store) ListComments(ctx context.Context, prdID string) ([]Comment, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, name, body, created_at FROM prd_comments WHERE prd_id = $1 ORDER BY created_at, id LIMIT 500`, prdID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Comment{}
	for rows.Next() {
		var c Comment
		if err := rows.Scan(&c.ID, &c.Name, &c.Body, &c.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

const maxComments = 500

// AddComment menambah komentar selama PRD itu belum punya 500 komentar.
func (s *Store) AddComment(ctx context.Context, prdID, name, body string) (Comment, error) {
	var c Comment
	err := s.db.QueryRowContext(ctx,
		`INSERT INTO prd_comments (prd_id, name, body)
		 SELECT $1, $2, $3 WHERE (SELECT count(*) FROM prd_comments WHERE prd_id = $1) < $4
		 RETURNING id, name, body, created_at`, prdID, name, body, maxComments).Scan(&c.ID, &c.Name, &c.Body, &c.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return Comment{}, ErrLimit
	}
	return c, err
}

// DeleteComment menghapus komentar di PRD milik pengguna.
func (s *Store) DeleteComment(ctx context.Context, userID, prdID string, commentID int64) error {
	res, err := s.db.ExecContext(ctx,
		`DELETE FROM prd_comments c USING prds p
		  WHERE c.id = $3 AND c.prd_id = p.id AND p.id = $1 AND p.user_id = $2`, prdID, userID, commentID)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}
