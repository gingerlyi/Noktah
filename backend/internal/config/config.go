// Package config membaca pengaturan dari variabel lingkungan.
package config

import (
	"errors"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Port          string
	DatabaseURL   string
	StaticDir     string
	CookieSecure  bool
	SessionTTL    time.Duration
	AllowRegister bool
	Timezone      string
	// UpgradeURL: tautan tombol Upgrade di halaman Harga, misalnya wa.me/62812xxxx atau halaman pembayaran.
	UpgradeURL string
	// TrustProxy: isi true bila aplikasi berada di belakang reverse proxy (Caddy, Nginx) yang mengisi X-Forwarded-For.
	TrustProxy bool

	OwnerEmail    string
	OwnerPassword string
	OwnerName     string
}

func env(key, def string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return def
}

func envBool(key string, def bool) bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv(key)))
	switch v {
	case "1", "true", "yes", "ya":
		return true
	case "0", "false", "no", "tidak":
		return false
	}
	return def
}

// Load membaca semua pengaturan. DATABASE_URL wajib diisi.
func Load() (Config, error) {
	days, err := strconv.Atoi(env("SESSION_DAYS", "30"))
	if err != nil || days < 1 || days > 365 {
		return Config{}, errors.New("SESSION_DAYS harus angka 1 sampai 365")
	}
	c := Config{
		Port:          env("PORT", "8080"),
		DatabaseURL:   env("DATABASE_URL", ""),
		StaticDir:     env("STATIC_DIR", "./public"),
		CookieSecure:  envBool("COOKIE_SECURE", false),
		SessionTTL:    time.Duration(days) * 24 * time.Hour,
		AllowRegister: envBool("ALLOW_REGISTER", true),
		Timezone:      env("APP_TIMEZONE", "Asia/Jakarta"),
		UpgradeURL:    env("UPGRADE_URL", ""),
		TrustProxy:    envBool("TRUST_PROXY", false),
		OwnerEmail:    strings.ToLower(env("OWNER_EMAIL", "")),
		OwnerPassword: os.Getenv("OWNER_PASSWORD"),
		OwnerName:     env("OWNER_NAME", "Pemilik"),
	}
	if c.DatabaseURL == "" {
		return Config{}, errors.New("DATABASE_URL belum diisi")
	}
	if _, err := time.LoadLocation(c.Timezone); err != nil {
		return Config{}, errors.New("APP_TIMEZONE tidak dikenal: " + c.Timezone)
	}
	return c, nil
}
