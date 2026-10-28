package api

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"

	"rancangprd/internal/store"
)

// Tautan bagikan: pemilik membuat token acak, lalu siapa pun yang punya tautannya bisa membaca PRD
// dan berkomentar tanpa akun. Komentar dibatasi per IP dan punya kolom jebakan untuk bot.

var shareTokenRe = regexp.MustCompile(`^[A-Za-z0-9_-]{22}$`)

func newShareToken() (string, error) {
	raw := make([]byte, 16)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(raw), nil
}

// sharedPRD membaca PRD dari token di alamat. Mengembalikan false bila sudah membalas galat.
func (s *Server) sharedPRD(w http.ResponseWriter, r *http.Request) (store.PRD, bool) {
	token := r.PathValue("token")
	if !shareTokenRe.MatchString(token) {
		writeErr(w, http.StatusNotFound, "not_found", "Tautan ini tidak ada atau sudah dicabut pemiliknya.")
		return store.PRD{}, false
	}
	p, err := s.st.SharedPRD(r.Context(), token)
	if errors.Is(err, store.ErrNotFound) {
		writeErr(w, http.StatusNotFound, "not_found", "Tautan ini tidak ada atau sudah dicabut pemiliknya.")
		return store.PRD{}, false
	}
	if err != nil {
		s.fail(w, r, err)
		return store.PRD{}, false
	}
	return p, true
}

func (s *Server) writeShare(w http.ResponseWriter, r *http.Request, prdID, token string) {
	items := []store.Comment{}
	if token != "" {
		var err error
		if items, err = s.st.ListComments(r.Context(), prdID); err != nil {
			s.fail(w, r, err)
			return
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"token": token, "comments": items})
}

func (s *Server) handleGetShare(w http.ResponseWriter, r *http.Request, u store.User) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	token, err := s.st.ShareToken(r.Context(), u.ID, id)
	if errors.Is(err, store.ErrNotFound) {
		writeErr(w, http.StatusNotFound, "not_found", "PRD tidak ditemukan.")
		return
	}
	if err != nil {
		s.fail(w, r, err)
		return
	}
	s.writeShare(w, r, id, token)
}

// handleCreateShare membuat tautan bila belum ada; tautan yang sudah ada dipakai lagi.
func (s *Server) handleCreateShare(w http.ResponseWriter, r *http.Request, u store.User) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	token, err := s.st.ShareToken(r.Context(), u.ID, id)
	if errors.Is(err, store.ErrNotFound) {
		writeErr(w, http.StatusNotFound, "not_found", "PRD tidak ditemukan.")
		return
	}
	if err != nil {
		s.fail(w, r, err)
		return
	}
	if token == "" {
		if token, err = newShareToken(); err == nil {
			err = s.st.SetShareToken(r.Context(), u.ID, id, token)
		}
		if err != nil {
			s.fail(w, r, err)
			return
		}
	}
	s.writeShare(w, r, id, token)
}

// handleRevokeShare mencabut tautan. Komentar tetap tersimpan dan muncul lagi bila PRD dibagikan ulang.
func (s *Server) handleRevokeShare(w http.ResponseWriter, r *http.Request, u store.User) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	if err := s.st.SetShareToken(r.Context(), u.ID, id, ""); errors.Is(err, store.ErrNotFound) {
		writeErr(w, http.StatusNotFound, "not_found", "PRD tidak ditemukan.")
		return
	} else if err != nil {
		s.fail(w, r, err)
		return
	}
	s.writeShare(w, r, id, "")
}

func (s *Server) handleDeleteComment(w http.ResponseWriter, r *http.Request, u store.User) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	cid, err := strconv.ParseInt(r.PathValue("cid"), 10, 64)
	if err == nil && cid > 0 {
		err = s.st.DeleteComment(r.Context(), u.ID, id, cid)
	} else {
		err = store.ErrNotFound
	}
	if errors.Is(err, store.ErrNotFound) {
		writeErr(w, http.StatusNotFound, "not_found", "Komentar tidak ditemukan.")
		return
	}
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// handleShared: halaman publik /p/{token}. Hanya nama, isi PRD, dan komentar; tanpa data pemilik.
func (s *Server) handleShared(w http.ResponseWriter, r *http.Request) {
	p, ok := s.sharedPRD(w, r)
	if !ok {
		return
	}
	items, err := s.st.ListComments(r.Context(), p.ID)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"name": p.Name, "state": p.State, "updatedAt": p.UpdatedAt, "comments": items})
}

// cleanComment merapikan nama dan isi komentar; ok = false bila kosong atau terlalu panjang.
func cleanComment(name, body string) (string, string, bool) {
	name = strings.Join(strings.Fields(name), " ")
	body = strings.TrimSpace(strings.ReplaceAll(body, "\r\n", "\n"))
	n, b := utf8.RuneCountInString(name), utf8.RuneCountInString(body)
	return name, body, n >= 1 && n <= 60 && b >= 1 && b <= 2000
}

func (s *Server) handleAddComment(w http.ResponseWriter, r *http.Request) {
	p, ok := s.sharedPRD(w, r)
	if !ok {
		return
	}
	var in struct {
		Name    string `json:"name"`
		Body    string `json:"body"`
		Website string `json:"website"` // kolom jebakan: manusia tidak melihatnya, bot biasanya mengisinya
	}
	if !readJSON(w, r, &in) {
		return
	}
	if in.Website != "" {
		writeJSON(w, http.StatusCreated, store.Comment{Name: in.Name, Body: in.Body})
		return
	}
	name, body, valid := cleanComment(in.Name, in.Body)
	if !valid {
		writeErr(w, http.StatusBadRequest, "invalid", "Isi nama (maksimal 60 huruf) dan komentar (maksimal 2.000 huruf).")
		return
	}
	if !s.commentLimit.allow(clientIP(r, s.cfg.TrustProxy) + "|" + p.ID) {
		writeErr(w, http.StatusTooManyRequests, "rate_limited", "Terlalu banyak komentar. Coba lagi beberapa menit lagi.")
		return
	}
	c, err := s.st.AddComment(r.Context(), p.ID, name, body)
	if errors.Is(err, store.ErrLimit) {
		writeErr(w, http.StatusConflict, "limit", "PRD ini sudah mencapai batas 500 komentar.")
		return
	}
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, c)
}
