package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"regexp"
	"strconv"
	"time"

	"rancangprd/internal/store"
)

const (
	maxStateBytes  = 512 << 10
	maxPRDsPerUser = 300
	freePRDLimit   = 1 // PRD tersimpan untuk paket Gratis
)

var keyRe = regexp.MustCompile(`^[A-Za-z0-9-]{1,64}$`)

// parseState memeriksa isi PRD dan mengambil nama serta kunci templatnya.
func parseState(raw json.RawMessage) (name, templateKey string, ok bool) {
	if len(raw) == 0 || len(raw) > maxStateBytes {
		return "", "", false
	}
	var m map[string]json.RawMessage
	if err := json.Unmarshal(raw, &m); err != nil || m == nil {
		return "", "", false
	}
	str := func(k string) string {
		var v string
		if json.Unmarshal(m[k], &v) != nil {
			return ""
		}
		return v
	}
	base := str("tpl")
	if !keyRe.MatchString(base) {
		return "", "", false
	}
	templateKey = str("asal")
	if !keyRe.MatchString(templateKey) {
		templateKey = base
	}
	return clip(str("nama"), 200), templateKey, true
}

func (s *Server) handlePublic(w http.ResponseWriter, r *http.Request) {
	site, err := s.st.GetSite(r.Context())
	if err != nil {
		s.fail(w, r, err)
		return
	}
	tpls, err := s.st.ListTemplates(r.Context(), true)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"site":      site,
		"templates": tpls,
		"features":  map[string]any{"register": s.cfg.AllowRegister, "upgradeUrl": s.cfg.UpgradeURL},
	})
}

func (s *Server) handleListPRDs(w http.ResponseWriter, r *http.Request, u store.User) {
	items, err := s.st.ListPRDs(r.Context(), u.ID)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

type stateInput struct {
	State json.RawMessage `json:"state"`
}

func (s *Server) handleCreatePRD(w http.ResponseWriter, r *http.Request, u store.User) {
	var in stateInput
	if !readJSON(w, r, &in) {
		return
	}
	name, key, ok := parseState(in.State)
	if !ok {
		writeErr(w, http.StatusBadRequest, "invalid", "Isi PRD tidak valid.")
		return
	}
	n, err := s.st.CountPRDs(r.Context(), u.ID)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	if n >= freePRDLimit && !u.Premium(time.Now()) {
		writeErr(w, http.StatusForbidden, "premium", "Paket Gratis hanya bisa menyimpan 1 PRD. Upgrade ke Premium untuk menyimpan lebih banyak.")
		return
	}
	if n >= maxPRDsPerUser {
		writeErr(w, http.StatusConflict, "limit", "Jumlah PRD sudah mencapai batas 300. Hapus yang tidak dipakai dulu.")
		return
	}
	p, err := s.st.CreatePRD(r.Context(), u.ID, name, key, in.State)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, p)
}

func (s *Server) handleGetPRD(w http.ResponseWriter, r *http.Request, u store.User) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	p, err := s.st.GetPRD(r.Context(), u.ID, id)
	if errors.Is(err, store.ErrNotFound) {
		writeErr(w, http.StatusNotFound, "not_found", "PRD tidak ditemukan.")
		return
	}
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (s *Server) handleUpdatePRD(w http.ResponseWriter, r *http.Request, u store.User) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var in stateInput
	if !readJSON(w, r, &in) {
		return
	}
	name, key, valid := parseState(in.State)
	if !valid {
		writeErr(w, http.StatusBadRequest, "invalid", "Isi PRD tidak valid.")
		return
	}
	p, err := s.st.UpdatePRD(r.Context(), u.ID, id, name, key, in.State)
	if errors.Is(err, store.ErrNotFound) {
		writeErr(w, http.StatusNotFound, "not_found", "PRD tidak ditemukan.")
		return
	}
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (s *Server) handleDeletePRD(w http.ResponseWriter, r *http.Request, u store.User) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	err := s.st.DeletePRD(r.Context(), u.ID, id)
	if errors.Is(err, store.ErrNotFound) {
		writeErr(w, http.StatusNotFound, "not_found", "PRD tidak ditemukan.")
		return
	}
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// handleListVersions: daftar riwayat versi terbuka untuk semua paket, supaya pengguna Gratis tahu ada yang bisa dipulihkan.
func (s *Server) handleListVersions(w http.ResponseWriter, r *http.Request, u store.User) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	if _, err := s.st.GetPRD(r.Context(), u.ID, id); errors.Is(err, store.ErrNotFound) {
		writeErr(w, http.StatusNotFound, "not_found", "PRD tidak ditemukan.")
		return
	} else if err != nil {
		s.fail(w, r, err)
		return
	}
	items, err := s.st.ListVersions(r.Context(), u.ID, id)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

// handleRestoreVersion memulihkan satu versi. Hanya untuk Premium.
func (s *Server) handleRestoreVersion(w http.ResponseWriter, r *http.Request, u store.User) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	vid, err := strconv.ParseInt(r.PathValue("vid"), 10, 64)
	if err != nil || vid <= 0 {
		writeErr(w, http.StatusNotFound, "not_found", "Versi tidak ditemukan.")
		return
	}
	if !u.Premium(time.Now()) {
		writeErr(w, http.StatusForbidden, "premium", "Memulihkan versi lama adalah fitur Premium.")
		return
	}
	p, err := s.st.RestoreVersion(r.Context(), u.ID, id, vid)
	if errors.Is(err, store.ErrNotFound) {
		writeErr(w, http.StatusNotFound, "not_found", "Versi tidak ditemukan.")
		return
	}
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, p)
}
