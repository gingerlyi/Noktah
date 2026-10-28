package auth

import (
	"strings"
	"testing"
)

func TestHashAndVerify(t *testing.T) {
	hash, err := HashPassword("sandi-rahasia-1")
	if err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(hash, "pbkdf2-sha256$600000$") {
		t.Fatalf("format hash tidak sesuai: %s", hash)
	}
	if !VerifyPassword(hash, "sandi-rahasia-1") {
		t.Error("kata sandi benar ditolak")
	}
	if VerifyPassword(hash, "sandi-rahasia-2") {
		t.Error("kata sandi salah diterima")
	}
	other, _ := HashPassword("sandi-rahasia-1")
	if other == hash {
		t.Error("dua hash dari kata sandi yang sama seharusnya berbeda (salt acak)")
	}
}

func TestVerifyRejectsMalformed(t *testing.T) {
	for _, h := range []string{"", "abc", "pbkdf2-sha256$x$a$b", "pbkdf2-sha256$0$YQ$YQ", "bcrypt$1$YQ$YQ", "pbkdf2-sha256$99999999$YQ$YQ"} {
		if VerifyPassword(h, "apa-saja") {
			t.Errorf("hash rusak %q diterima", h)
		}
	}
}

func TestSessionToken(t *testing.T) {
	tok, hash, err := NewSessionToken()
	if err != nil {
		t.Fatal(err)
	}
	if len(tok) < 40 || len(hash) != 32 {
		t.Fatalf("panjang token %d atau hash %d tidak sesuai", len(tok), len(hash))
	}
	if string(HashToken(tok)) != string(hash) {
		t.Error("HashToken tidak konsisten")
	}
}

func TestValidatePassword(t *testing.T) {
	if ValidatePassword("1234567") == nil {
		t.Error("7 karakter seharusnya ditolak")
	}
	if ValidatePassword("12345678") != nil {
		t.Error("8 karakter seharusnya diterima")
	}
}
