package api

import (
	"errors"
	"net/http"
	"net/mail"
	"strings"
	"time"

	"rancangprd/internal/auth"
	"rancangprd/internal/store"
)

type userView struct {
	ID    string   `json:"id"`
	Name  string   `json:"name"`
	Email string   `json:"email"`
	Role  string   `json:"role"`
	Perms []string `json:"perms"`
	// Premium dan PremiumUntil menentukan fitur berbayar di frontend; batasnya tetap diperiksa di server.
	Premium      bool       `json:"premium"`
	PremiumUntil *time.Time `json:"premiumUntil"`
}

func viewUser(u store.User) userView {
	perms := rolePerms[u.Role]
	if perms == nil {
		perms = []string{}
	}
	return userView{ID: u.ID, Name: u.Name, Email: u.Email, Role: u.Role, Perms: perms, Premium: u.Premium(time.Now()), PremiumUntil: u.PremiumUntil}
}

// Hash acak untuk dibandingkan saat email tidak terdaftar, supaya lama
// jawaban login tidak membocorkan email mana yang ada.
var dummyHash, _ = auth.HashPassword("kata-sandi-pengganti")

func normalizeEmail(raw string) (string, bool) {
	e := strings.ToLower(strings.TrimSpace(raw))
	if len(e) < 3 || len(e) > 254 {
		return "", false
	}
	a, err := mail.ParseAddress(e)
	if err != nil || a.Address != e || !strings.Contains(e[strings.LastIndex(e, "@")+1:], ".") {
		return "", false
	}
	return e, true
}

func (s *Server) startSession(w http.ResponseWriter, r *http.Request, u store.User) bool {
	token, hash, err := auth.NewSessionToken()
	if err != nil {
		s.fail(w, r, err)
		return false
	}
	expires := time.Now().Add(s.cfg.SessionTTL)
	if err := s.st.CreateSession(r.Context(), u.ID, hash, expires); err != nil {
		s.fail(w, r, err)
		return false
	}
	http.SetCookie(w, &http.Cookie{
		Name:     cookieName,
		Value:    token,
		Path:     "/",
		Expires:  expires,
		MaxAge:   int(s.cfg.SessionTTL.Seconds()),
		HttpOnly: true,
		Secure:   s.cfg.CookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
	return true
}

func (s *Server) clearCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name: cookieName, Value: "", Path: "/", MaxAge: -1,
		HttpOnly: true, Secure: s.cfg.CookieSecure, SameSite: http.SameSiteLaxMode,
	})
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	if !s.cfg.AllowRegister {
		writeErr(w, http.StatusForbidden, "register_closed", "Pendaftaran akun baru sedang ditutup.")
		return
	}
	if !s.registerLimit.allow(clientIP(r, s.cfg.TrustProxy)) {
		writeErr(w, http.StatusTooManyRequests, "rate_limited", "Terlalu banyak pendaftaran dari jaringan ini. Coba lagi nanti.")
		return
	}
	var in struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !readJSON(w, r, &in) {
		return
	}
	name := clip(in.Name, 80)
	if name == "" {
		writeErr(w, http.StatusBadRequest, "invalid", "Nama belum diisi.")
		return
	}
	email, ok := normalizeEmail(in.Email)
	if !ok {
		writeErr(w, http.StatusBadRequest, "invalid", "Alamat email tidak valid.")
		return
	}
	if err := auth.ValidatePassword(in.Password); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid", err.Error())
		return
	}
	hash, err := auth.HashPassword(in.Password)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	u, err := s.st.CreateUser(r.Context(), email, name, hash, "user")
	if errors.Is(err, store.ErrEmailTaken) {
		writeErr(w, http.StatusConflict, "email_taken", "Email ini sudah terdaftar. Silakan masuk.")
		return
	}
	if err != nil {
		s.fail(w, r, err)
		return
	}
	if !s.startSession(w, r, u) {
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"user": viewUser(u)})
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !readJSON(w, r, &in) {
		return
	}
	email := strings.ToLower(strings.TrimSpace(in.Email))
	if !s.loginLimit.allow(email + "|" + clientIP(r, s.cfg.TrustProxy)) {
		writeErr(w, http.StatusTooManyRequests, "rate_limited", "Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.")
		return
	}
	const wrong = "Email atau kata sandi salah."
	u, hash, err := s.st.UserByEmail(r.Context(), email)
	if errors.Is(err, store.ErrNotFound) {
		auth.VerifyPassword(dummyHash, in.Password)
		writeErr(w, http.StatusUnauthorized, "bad_credentials", wrong)
		return
	}
	if err != nil {
		s.fail(w, r, err)
		return
	}
	if !auth.VerifyPassword(hash, in.Password) {
		writeErr(w, http.StatusUnauthorized, "bad_credentials", wrong)
		return
	}
	if !s.startSession(w, r, u) {
		return
	}
	_ = s.st.TouchUser(r.Context(), u.ID)
	writeJSON(w, http.StatusOK, map[string]any{"user": viewUser(u)})
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(cookieName); err == nil && c.Value != "" {
		if err := s.st.DeleteSession(r.Context(), auth.HashToken(c.Value)); err != nil {
			s.log.Warn("hapus sesi", "err", err)
		}
	}
	s.clearCookie(w)
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	u, err := s.currentUser(r)
	if errors.Is(err, store.ErrNotFound) {
		writeJSON(w, http.StatusOK, map[string]any{"user": nil})
		return
	}
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": viewUser(u)})
}
