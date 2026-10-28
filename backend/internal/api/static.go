package api

import (
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
)

// staticHandler menyajikan hasil build frontend. Alamat yang bukan berkas
// dibalas index.html supaya rute React (mis. /prd/123) tetap terbuka saat dimuat ulang.
func (s *Server) staticHandler() http.Handler {
	dir := s.cfg.StaticDir
	index := filepath.Join(dir, "index.html")
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			http.Error(w, "Metode tidak didukung.", http.StatusMethodNotAllowed)
			return
		}
		if _, err := os.Stat(index); err != nil {
			http.Error(w, "Frontend belum dibangun. Jalankan \"npm run build\" di folder frontend, atau buka server pengembangan Vite.", http.StatusServiceUnavailable)
			return
		}
		clean := path.Clean("/" + r.URL.Path)
		if clean != "/" {
			full := filepath.Join(dir, filepath.FromSlash(clean))
			if fi, err := os.Stat(full); err == nil && !fi.IsDir() {
				if strings.HasPrefix(clean, "/assets/") {
					w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
				}
				http.ServeFile(w, r, full)
				return
			}
			if path.Ext(clean) != "" {
				http.NotFound(w, r)
				return
			}
		}
		w.Header().Set("Cache-Control", "no-cache")
		http.ServeFile(w, r, index)
	})
}
