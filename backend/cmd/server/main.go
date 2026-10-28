// Server Noktah: API JSON di /api dan frontend React dari folder statis.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
	_ "time/tzdata" // data zona waktu ikut di dalam program, jadi APP_TIMEZONE berfungsi di mesin mana pun

	"rancangprd/internal/api"
	"rancangprd/internal/auth"
	"rancangprd/internal/config"
	"rancangprd/internal/store"
)

func main() {
	log := slog.New(slog.NewTextHandler(os.Stdout, nil))
	if err := run(log); err != nil {
		log.Error("server berhenti", "err", err)
		os.Exit(1)
	}
}

func run(log *slog.Logger) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	st, err := store.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer st.Close()
	if err := st.Migrate(ctx); err != nil {
		return err
	}
	if err := seedOwner(ctx, cfg, st, log); err != nil {
		return err
	}

	// Bersihkan sesi kedaluwarsa tiap jam.
	go func() {
		t := time.NewTicker(time.Hour)
		defer t.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-t.C:
				if err := st.DeleteExpiredSessions(ctx); err != nil && ctx.Err() == nil {
					log.Warn("bersihkan sesi", "err", err)
				}
			}
		}
	}()

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           api.New(cfg, st, log).Handler(),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      120 * time.Second,
		IdleTimeout:       120 * time.Second,
	}
	errCh := make(chan error, 1)
	go func() { errCh <- srv.ListenAndServe() }()
	log.Info("server berjalan", "alamat", "http://localhost:"+cfg.Port)

	select {
	case err := <-errCh:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	case <-ctx.Done():
	}
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	return srv.Shutdown(shutdownCtx)
}

// seedOwner membuat akun pemilik dari OWNER_EMAIL dan OWNER_PASSWORD bila belum ada pemilik.
func seedOwner(ctx context.Context, cfg config.Config, st *store.Store, log *slog.Logger) error {
	if cfg.OwnerEmail == "" || cfg.OwnerPassword == "" {
		log.Warn("OWNER_EMAIL atau OWNER_PASSWORD kosong: akun pemilik tidak dibuat otomatis")
		return nil
	}
	if err := auth.ValidatePassword(cfg.OwnerPassword); err != nil {
		return errors.New("OWNER_PASSWORD: " + err.Error())
	}
	hash, err := auth.HashPassword(cfg.OwnerPassword)
	if err != nil {
		return err
	}
	created, err := st.EnsureOwner(ctx, cfg.OwnerEmail, cfg.OwnerName, hash)
	if err != nil {
		return err
	}
	if created {
		log.Info("akun pemilik siap", "email", cfg.OwnerEmail)
	}
	return nil
}
