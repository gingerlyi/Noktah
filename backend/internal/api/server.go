// Package api berisi server HTTP: rute, middleware, dan handler.
package api

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"regexp"
	"strings"
	"sync"
	"time"

	"rancangprd/internal/auth"
	"rancangprd/internal/config"
	"rancangprd/internal/store"
)

const (
	cookieName   = "rprd_session"
	csrfHeader   = "X-Requested-With"
	csrfValue    = "rancang-prd"
	maxBodyBytes = 1 << 20 // 1 MiB
)

// Hak tiap peran. Peran "user" tidak punya hak admin.
var rolePerms = map[string][]string{
	"pemilik": {"dash", "tpl", "site", "users", "roles"},
	"admin":   {"dash", "tpl", "site", "users"},
	"konten":  {"dash", "tpl", "site"},
	"analis":  {"dash"},
}

func hasPerm(role, perm string) bool {
	for _, p := range rolePerms[role] {
		if p == perm {
			return true
		}
	}
	return false
}

var uuidRe = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

type Server struct {
	cfg config.Config
	st  *store.Store
	log *slog.Logger

	loginLimit    *limiter
	loginIPLimit  *limiter
	registerLimit *limiter
	commentLimit  *limiter

	touchMu sync.Mutex
	touched map[string]time.Time
}

func New(cfg config.Config, st *store.Store, log *slog.Logger) *Server {
	return &Server{
		cfg:           cfg,
		st:            st,
		log:           log,
		loginLimit:    newLimiter(10, 15*time.Minute),
		loginIPLimit:  newLimiter(60, 15*time.Minute),
		registerLimit: newLimiter(20, time.Hour),
		commentLimit:  newLimiter(8, 10*time.Minute),
		touched:       map[string]time.Time{},
	}
}

// Handler menyusun semua rute.
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
	})
	mux.HandleFunc("GET /api/public", s.handlePublic)

	mux.HandleFunc("POST /api/auth/register", s.handleRegister)
	mux.HandleFunc("POST /api/auth/login", s.handleLogin)
	mux.HandleFunc("POST /api/auth/logout", s.handleLogout)
	mux.HandleFunc("GET /api/auth/me", s.handleMe)

	mux.HandleFunc("GET /api/prds", s.withUser(s.handleListPRDs))
	mux.HandleFunc("POST /api/prds", s.withUser(s.handleCreatePRD))
	mux.HandleFunc("GET /api/prds/{id}", s.withUser(s.handleGetPRD))
	mux.HandleFunc("PUT /api/prds/{id}", s.withUser(s.handleUpdatePRD))
	mux.HandleFunc("DELETE /api/prds/{id}", s.withUser(s.handleDeletePRD))
	mux.HandleFunc("GET /api/prds/{id}/versions", s.withUser(s.handleListVersions))
	mux.HandleFunc("GET /api/prds/{id}/share", s.withUser(s.handleGetShare))
	mux.HandleFunc("POST /api/prds/{id}/share", s.withUser(s.handleCreateShare))
	mux.HandleFunc("DELETE /api/prds/{id}/share", s.withUser(s.handleRevokeShare))
	mux.HandleFunc("DELETE /api/prds/{id}/comments/{cid}", s.withUser(s.handleDeleteComment))
	mux.HandleFunc("GET /api/shared/{token}", s.handleShared)
	mux.HandleFunc("POST /api/shared/{token}/comments", s.handleAddComment)
	mux.HandleFunc("POST /api/prds/{id}/versions/{vid}/restore", s.withUser(s.handleRestoreVersion))

	mux.HandleFunc("GET /api/admin/stats", s.withPerm("dash", s.handleStats))
	mux.HandleFunc("GET /api/admin/templates", s.withPerm("tpl", s.handleAdminListTemplates))
	mux.HandleFunc("POST /api/admin/templates", s.withPerm("tpl", s.handleCreateTemplate))
	mux.HandleFunc("PUT /api/admin/templates/{id}", s.withPerm("tpl", s.handleUpdateTemplate))
	mux.HandleFunc("DELETE /api/admin/templates/{id}", s.withPerm("tpl", s.handleDeleteTemplate))
	mux.HandleFunc("PUT /api/admin/builtin-templates", s.withPerm("tpl", s.handleSetHiddenBuiltin))
	mux.HandleFunc("PUT /api/admin/site", s.withPerm("site", s.handleUpdateSite))
	mux.HandleFunc("GET /api/admin/users", s.withPerm("users", s.handleListUsers))
	mux.HandleFunc("PUT /api/admin/users/{id}/role", s.withPerm("roles", s.handleSetRole))
	mux.HandleFunc("PUT /api/admin/users/{id}/premium", s.withPerm("users", s.handleSetPremium))

	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		writeErr(w, http.StatusNotFound, "not_found", "Alamat API tidak ditemukan.")
	})
	mux.Handle("/", s.staticHandler())

	return s.recoverer(s.securityHeaders(s.csrf(mux)))
}

// ---------- Middleware ----------

func (s *Server) recoverer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if v := recover(); v != nil {
				s.log.Error("panic", "path", r.URL.Path, "err", v)
				writeErr(w, http.StatusInternalServerError, "internal", "Terjadi kesalahan di server.")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func (s *Server) securityHeaders(next http.Handler) http.Handler {
	const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
		"font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; " +
		"frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "DENY")
		h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		h.Set("Content-Security-Policy", csp)
		if s.cfg.CookieSecure {
			h.Set("Strict-Transport-Security", "max-age=31536000")
		}
		next.ServeHTTP(w, r)
	})
}

// csrf mewajibkan header khusus pada permintaan yang mengubah data. Situs lain
// tidak bisa mengirim header ini tanpa izin CORS, dan server ini tidak memberi izin itu.
func (s *Server) csrf(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			switch r.Method {
			case http.MethodGet, http.MethodHead, http.MethodOptions:
			default:
				if r.Header.Get(csrfHeader) != csrfValue {
					writeErr(w, http.StatusForbidden, "csrf", "Permintaan ditolak.")
					return
				}
			}
		}
		next.ServeHTTP(w, r)
	})
}

type userHandler func(http.ResponseWriter, *http.Request, store.User)

// currentUser membaca cookie sesi. Mengembalikan ErrNotFound bila belum masuk.
func (s *Server) currentUser(r *http.Request) (store.User, error) {
	c, err := r.Cookie(cookieName)
	if err != nil || c.Value == "" {
		return store.User{}, store.ErrNotFound
	}
	u, err := s.st.UserBySession(r.Context(), auth.HashToken(c.Value))
	if err != nil {
		return store.User{}, err
	}
	s.touch(u.ID)
	return u, nil
}

// touch memperbarui "terakhir aktif" paling sering sekali per 10 menit per pengguna.
func (s *Server) touch(id string) {
	now := time.Now()
	s.touchMu.Lock()
	last, ok := s.touched[id]
	if ok && now.Sub(last) < 10*time.Minute {
		s.touchMu.Unlock()
		return
	}
	if len(s.touched) > 50_000 {
		s.touched = map[string]time.Time{}
	}
	s.touched[id] = now
	s.touchMu.Unlock()
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := s.st.TouchUser(ctx, id); err != nil {
			s.log.Warn("touch user", "err", err)
		}
	}()
}

func (s *Server) withUser(h userHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		u, err := s.currentUser(r)
		if errors.Is(err, store.ErrNotFound) {
			writeErr(w, http.StatusUnauthorized, "unauthorized", "Kamu belum masuk.")
			return
		}
		if err != nil {
			s.fail(w, r, err)
			return
		}
		h(w, r, u)
	}
}

func (s *Server) withPerm(perm string, h userHandler) http.HandlerFunc {
	return s.withUser(func(w http.ResponseWriter, r *http.Request, u store.User) {
		if !hasPerm(u.Role, perm) {
			writeErr(w, http.StatusForbidden, "forbidden", "Peranmu tidak punya hak untuk ini.")
			return
		}
		h(w, r, u)
	})
}

// ---------- Bantuan ----------

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]any{"error": map[string]string{"code": code, "message": message}})
}

// fail mencatat kesalahan tak terduga dan membalas 500 tanpa membocorkan detailnya.
func (s *Server) fail(w http.ResponseWriter, r *http.Request, err error) {
	if errors.Is(err, context.Canceled) {
		return
	}
	s.log.Error("request gagal", "method", r.Method, "path", r.URL.Path, "err", err)
	writeErr(w, http.StatusInternalServerError, "internal", "Terjadi kesalahan di server.")
}

// readJSON membaca badan permintaan ke dst. Mengembalikan false bila sudah membalas galat.
func readJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	dec := json.NewDecoder(r.Body)
	if err := dec.Decode(dst); err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			writeErr(w, http.StatusRequestEntityTooLarge, "too_large", "Data yang dikirim terlalu besar.")
		} else {
			writeErr(w, http.StatusBadRequest, "bad_json", "Format data tidak terbaca.")
		}
		return false
	}
	return true
}

func pathID(w http.ResponseWriter, r *http.Request) (string, bool) {
	id := strings.ToLower(r.PathValue("id"))
	if !uuidRe.MatchString(id) {
		writeErr(w, http.StatusNotFound, "not_found", "Data tidak ditemukan.")
		return "", false
	}
	return id, true
}

// clientIP mengembalikan alamat IP pengunjung untuk pembatas laju. Di belakang reverse proxy (TRUST_PROXY=true),
// alamat koneksi adalah alamat proxy, jadi yang dipakai adalah entri terakhir X-Forwarded-For: alamat yang
// ditambahkan proxy kita sendiri. Entri sebelumnya dikirim pengunjung dan bisa dipalsukan.
func clientIP(r *http.Request, trustProxy bool) string {
	if trustProxy {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			parts := strings.Split(xff, ",")
			if ip := strings.TrimSpace(parts[len(parts)-1]); ip != "" {
				return ip
			}
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func clip(s string, max int) string {
	s = strings.TrimSpace(s)
	r := []rune(s)
	if len(r) > max {
		return strings.TrimSpace(string(r[:max]))
	}
	return s
}

// ---------- Pembatas laju sederhana di memori ----------

type limiter struct {
	mu     sync.Mutex
	hits   map[string][]time.Time
	max    int
	window time.Duration
}

func newLimiter(max int, window time.Duration) *limiter {
	return &limiter{hits: map[string][]time.Time{}, max: max, window: window}
}

// allow mencatat satu percobaan dan mengembalikan false bila sudah melewati batas.
func (l *limiter) allow(key string) bool {
	now := time.Now()
	cut := now.Add(-l.window)
	l.mu.Lock()
	defer l.mu.Unlock()
	if len(l.hits) > 20_000 {
		for k, v := range l.hits {
			if len(v) == 0 || v[len(v)-1].Before(cut) {
				delete(l.hits, k)
			}
		}
	}
	keep := l.hits[key][:0]
	for _, t := range l.hits[key] {
		if t.After(cut) {
			keep = append(keep, t)
		}
	}
	if len(keep) >= l.max {
		l.hits[key] = keep
		return false
	}
	l.hits[key] = append(keep, now)
	return true
}
