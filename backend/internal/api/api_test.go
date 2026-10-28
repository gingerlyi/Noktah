package api

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"
	"time"

	"rancangprd/internal/store"
)

func TestParseState(t *testing.T) {
	name, key, ok := parseState(json.RawMessage(`{"tpl":"toko","asal":"3f0c1a2b-aaaa-bbbb-cccc-0123456789ab","nama":"  Kopi Senja  "}`))
	if !ok || name != "Kopi Senja" || key != "3f0c1a2b-aaaa-bbbb-cccc-0123456789ab" {
		t.Fatalf("hasil tak terduga: %q %q %v", name, key, ok)
	}
	if _, key, ok := parseState(json.RawMessage(`{"tpl":"toko","asal":"../x"}`)); !ok || key != "toko" {
		t.Errorf("asal tidak valid seharusnya jatuh ke tpl, dapat %q %v", key, ok)
	}
	for _, bad := range []string{``, `[]`, `"teks"`, `null`, `{"tpl":"a b"}`, `{"nama":"x"}`, `{"tpl":5}`} {
		if _, _, ok := parseState(json.RawMessage(bad)); ok {
			t.Errorf("state %q seharusnya ditolak", bad)
		}
	}
	big := `{"tpl":"toko","x":"` + strings.Repeat("a", maxStateBytes) + `"}`
	if _, _, ok := parseState(json.RawMessage(big)); ok {
		t.Error("state terlalu besar seharusnya ditolak")
	}
}

func TestNormalizeEmail(t *testing.T) {
	if e, ok := normalizeEmail("  Budi@Contoh.ID "); !ok || e != "budi@contoh.id" {
		t.Errorf("dapat %q %v", e, ok)
	}
	for _, bad := range []string{"", "budi", "budi@", "budi@localhost", "Budi <budi@contoh.id>", "a b@contoh.id"} {
		if _, ok := normalizeEmail(bad); ok {
			t.Errorf("%q seharusnya ditolak", bad)
		}
	}
}

func TestLimiter(t *testing.T) {
	l := newLimiter(2, 50*time.Millisecond)
	if !l.allow("a") || !l.allow("a") {
		t.Fatal("dua percobaan pertama seharusnya lolos")
	}
	if l.allow("a") {
		t.Error("percobaan ketiga seharusnya ditolak")
	}
	if !l.allow("b") {
		t.Error("kunci lain tidak boleh ikut terblokir")
	}
	time.Sleep(60 * time.Millisecond)
	if !l.allow("a") {
		t.Error("setelah jendela waktu lewat seharusnya lolos lagi")
	}
}

func TestPerms(t *testing.T) {
	if !hasPerm("pemilik", "roles") || hasPerm("admin", "roles") || hasPerm("analis", "tpl") || hasPerm("user", "dash") || hasPerm("ngawur", "dash") {
		t.Error("tabel hak peran tidak sesuai")
	}
}

func TestPremium(t *testing.T) {
	now := time.Now()
	past, future := now.Add(-time.Hour), now.Add(time.Hour)
	cases := []struct {
		u    store.User
		want bool
	}{
		{store.User{Role: "user"}, false},
		{store.User{Role: "user", PremiumUntil: &past}, false},
		{store.User{Role: "user", PremiumUntil: &future}, true},
		{store.User{Role: "admin"}, true},
	}
	for _, c := range cases {
		if got := c.u.Premium(now); got != c.want {
			t.Errorf("%+v: dapat %v, mau %v", c.u, got, c.want)
		}
	}
}

func TestCleanComment(t *testing.T) {
	name, body, ok := cleanComment("  Budi   Santoso ", "  Bagian alur sudah jelas.\r\n ")
	if !ok || name != "Budi Santoso" || body != "Bagian alur sudah jelas." {
		t.Fatalf("dapat %q %q %v", name, body, ok)
	}
	for _, c := range [][2]string{{"", "isi"}, {"Budi", "  "}, {strings.Repeat("a", 61), "isi"}, {"Budi", strings.Repeat("é", 2001)}} {
		if _, _, ok := cleanComment(c[0], c[1]); ok {
			t.Errorf("%q seharusnya ditolak", c)
		}
	}
	if tok, err := newShareToken(); err != nil || !shareTokenRe.MatchString(tok) {
		t.Errorf("token bagikan tidak sesuai pola: %q %v", tok, err)
	}
}

func TestClientIP(t *testing.T) {
	r, _ := http.NewRequest("GET", "/", nil)
	r.RemoteAddr = "172.18.0.1:5555"
	r.Header.Set("X-Forwarded-For", "6.6.6.6, 203.0.113.9")
	if ip := clientIP(r, false); ip != "172.18.0.1" {
		t.Errorf("tanpa proxy seharusnya alamat koneksi, dapat %q", ip)
	}
	if ip := clientIP(r, true); ip != "203.0.113.9" {
		t.Errorf("di belakang proxy seharusnya entri terakhir, dapat %q", ip)
	}
	r.Header.Del("X-Forwarded-For")
	if ip := clientIP(r, true); ip != "172.18.0.1" {
		t.Errorf("tanpa header seharusnya alamat koneksi, dapat %q", ip)
	}
}
