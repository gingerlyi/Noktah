package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"rancangprd/internal/store"
)

// PRD bawaan perpustakaan (frontend/src/lib/catalog*.js), dipakai untuk memeriksa masukan admin.
// Daftar ini harus sama dengan TPL_IDS di frontend; frontend/scripts/cek-id-bawaan.mjs memeriksanya.
var builtinTemplates = map[string]bool{
	"landing": true, "toko": true, "portofolio": true, "profil": true, "blog": true, "booking": true,
	"kursus": true, "dashboard": true, "restoran": true, "undangan": true, "event": true,
	"properti": true, "karier": true, "donasi": true, "sekolah": true, "hotel": true, "wisata": true,
	"agensi": true, "fotografer": true, "bengkel": true, "gym": true, "dokumentasi": true,
	"linkbio": true, "masjid": true, "crm": true,
	"marketplace": true, "rekrutmen": true, "klinik": true, "desa": true, "koperasi": true,
	"helpdesk": true, "ujian": true, "proyek": true, "galeri": true, "rental": true, "katering": true,
	"berita": true, "salon": true, "invoice": true,
	"m-toko": true, "m-antar": true, "m-keuangan": true, "m-booking": true, "m-belajar": true,
	"m-kebugaran": true, "m-kos": true, "m-dokter": true, "m-absensi": true, "m-resep": true,
	"m-tiket": true, "m-meditasi": true, "m-kasir": true, "m-sekolah": true, "m-wisata": true,
	"m-komunitas": true, "m-laundry": true, "m-perpus": true,
	"m-ojek": true, "m-kurir": true, "m-warga": true, "m-posyandu": true, "m-sales": true,
	"m-galon": true, "m-jualbeli": true, "m-tani": true, "m-jemput": true, "m-nikah": true,
	"m-arisan": true, "m-esports": true,
}

func (s *Server) handleStats(w http.ResponseWriter, r *http.Request, u store.User) {
	st, err := s.st.Stats(r.Context(), s.cfg.Timezone)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	site, err := s.st.GetSite(r.Context())
	if err != nil {
		s.fail(w, r, err)
		return
	}
	out := map[string]any{"stats": st, "hiddenBuiltin": site.HiddenBuiltin, "recent": []any{}}
	// Daftar orang hanya untuk peran yang boleh melihat pengguna.
	if hasPerm(u.Role, "users") {
		recent, err := s.st.ListUsers(r.Context(), 5)
		if err != nil {
			s.fail(w, r, err)
			return
		}
		out["recent"] = recent
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) handleAdminListTemplates(w http.ResponseWriter, r *http.Request, _ store.User) {
	tpls, err := s.st.ListTemplates(r.Context(), false)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": tpls})
}

type templateInput struct {
	Name    string          `json:"name"`
	Summary string          `json:"summary"`
	Base    string          `json:"base"`
	Hidden  bool            `json:"hidden"`
	State   json.RawMessage `json:"state"`
}

func (s *Server) handleCreateTemplate(w http.ResponseWriter, r *http.Request, u store.User) {
	var in templateInput
	if !readJSON(w, r, &in) {
		return
	}
	name := clip(in.Name, 60)
	if _, _, ok := parseState(in.State); !ok || name == "" || !builtinTemplates[in.Base] {
		writeErr(w, http.StatusBadRequest, "invalid", "Isi templat tidak valid.")
		return
	}
	n, err := s.st.CountTemplates(r.Context())
	if err != nil {
		s.fail(w, r, err)
		return
	}
	if n >= 100 {
		writeErr(w, http.StatusConflict, "limit", "Jumlah templat sudah mencapai batas 100.")
		return
	}
	t, err := s.st.CreateTemplate(r.Context(), u.ID, name, clip(in.Summary, 200), in.Base, in.State)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, t)
}

func (s *Server) handleUpdateTemplate(w http.ResponseWriter, r *http.Request, _ store.User) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var in templateInput
	if !readJSON(w, r, &in) {
		return
	}
	name := clip(in.Name, 60)
	if _, _, valid := parseState(in.State); !valid || name == "" {
		writeErr(w, http.StatusBadRequest, "invalid", "Isi templat tidak valid.")
		return
	}
	t, err := s.st.UpdateTemplate(r.Context(), id, name, clip(in.Summary, 200), in.Hidden, in.State)
	if errors.Is(err, store.ErrNotFound) {
		writeErr(w, http.StatusNotFound, "not_found", "Templat tidak ditemukan.")
		return
	}
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (s *Server) handleDeleteTemplate(w http.ResponseWriter, r *http.Request, _ store.User) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	err := s.st.DeleteTemplate(r.Context(), id)
	if errors.Is(err, store.ErrNotFound) {
		writeErr(w, http.StatusNotFound, "not_found", "Templat tidak ditemukan.")
		return
	}
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (s *Server) handleSetHiddenBuiltin(w http.ResponseWriter, r *http.Request, _ store.User) {
	var in struct {
		Hidden []string `json:"hiddenBuiltin"`
	}
	if !readJSON(w, r, &in) {
		return
	}
	keys := []string{}
	seen := map[string]bool{}
	for _, k := range in.Hidden {
		if builtinTemplates[k] && !seen[k] {
			seen[k] = true
			keys = append(keys, k)
		}
	}
	if err := s.st.SetHiddenBuiltin(r.Context(), keys); err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"hiddenBuiltin": keys})
}

func (s *Server) handleUpdateSite(w http.ResponseWriter, r *http.Request, _ store.User) {
	var in struct {
		Title    string `json:"title"`
		Subtitle string `json:"subtitle"`
	}
	if !readJSON(w, r, &in) {
		return
	}
	title, subtitle := clip(in.Title, 120), clip(in.Subtitle, 300)
	if err := s.st.UpdateSiteText(r.Context(), title, subtitle); err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"title": title, "subtitle": subtitle})
}

func (s *Server) handleListUsers(w http.ResponseWriter, r *http.Request, _ store.User) {
	users, err := s.st.ListUsers(r.Context(), 500)
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": users})
}

func (s *Server) handleSetRole(w http.ResponseWriter, r *http.Request, u store.User) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var in struct {
		Role string `json:"role"`
	}
	if !readJSON(w, r, &in) {
		return
	}
	switch in.Role {
	case "user", "analis", "konten", "admin":
	default:
		writeErr(w, http.StatusBadRequest, "invalid", "Peran tidak dikenal.")
		return
	}
	if id == u.ID {
		writeErr(w, http.StatusBadRequest, "invalid", "Kamu tidak bisa mengubah peranmu sendiri.")
		return
	}
	target, err := s.st.SetRole(r.Context(), id, in.Role)
	if errors.Is(err, store.ErrNotFound) {
		writeErr(w, http.StatusNotFound, "not_found", "Pengguna tidak ditemukan, atau dia pemilik.")
		return
	}
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": viewUser(target)})
}

// handleSetPremium mengaktifkan atau memperpanjang Premium secara manual, misalnya setelah admin
// menerima bukti transfer. days = 0 mencabutnya.
func (s *Server) handleSetPremium(w http.ResponseWriter, r *http.Request, _ store.User) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	var in struct {
		Days int `json:"days"`
	}
	if !readJSON(w, r, &in) {
		return
	}
	if in.Days < 0 || in.Days > 3660 {
		writeErr(w, http.StatusBadRequest, "invalid", "Jumlah hari harus 0 sampai 3660.")
		return
	}
	target, err := s.st.AddPremium(r.Context(), id, in.Days)
	if errors.Is(err, store.ErrNotFound) {
		writeErr(w, http.StatusNotFound, "not_found", "Pengguna tidak ditemukan.")
		return
	}
	if err != nil {
		s.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"user": viewUser(target)})
}
