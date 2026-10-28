// Package auth berisi hashing kata sandi dan token sesi.
package auth

import (
	"crypto/pbkdf2"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strconv"
	"strings"
)

const (
	pbkdf2Iter    = 600_000 // rekomendasi OWASP untuk PBKDF2-HMAC-SHA256
	pbkdf2MaxIter = 5_000_000
	saltLen       = 16
	keyLen        = 32
	scheme        = "pbkdf2-sha256"
)

var b64 = base64.RawStdEncoding

// HashPassword menghasilkan string "pbkdf2-sha256$<iterasi>$<salt>$<hash>".
func HashPassword(password string) (string, error) {
	salt := make([]byte, saltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	key, err := pbkdf2.Key(sha256.New, password, salt, pbkdf2Iter, keyLen)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s$%d$%s$%s", scheme, pbkdf2Iter, b64.EncodeToString(salt), b64.EncodeToString(key)), nil
}

// VerifyPassword membandingkan kata sandi dengan hash tersimpan dalam waktu konstan.
func VerifyPassword(encoded, password string) bool {
	parts := strings.Split(encoded, "$")
	if len(parts) != 4 || parts[0] != scheme {
		return false
	}
	iter, err := strconv.Atoi(parts[1])
	if err != nil || iter < 1 || iter > pbkdf2MaxIter {
		return false
	}
	salt, err := b64.DecodeString(parts[2])
	if err != nil {
		return false
	}
	want, err := b64.DecodeString(parts[3])
	if err != nil || len(want) == 0 {
		return false
	}
	got, err := pbkdf2.Key(sha256.New, password, salt, iter, len(want))
	if err != nil {
		return false
	}
	return subtle.ConstantTimeCompare(got, want) == 1
}

// NewSessionToken mengembalikan token acak untuk cookie dan hash-nya untuk database.
func NewSessionToken() (token string, hash []byte, err error) {
	raw := make([]byte, 32)
	if _, err = rand.Read(raw); err != nil {
		return "", nil, err
	}
	token = base64.RawURLEncoding.EncodeToString(raw)
	return token, HashToken(token), nil
}

// HashToken menghitung SHA-256 dari token sesi.
func HashToken(token string) []byte {
	sum := sha256.Sum256([]byte(token))
	return sum[:]
}

// ValidatePassword memeriksa aturan panjang kata sandi.
func ValidatePassword(p string) error {
	if len(p) < 8 {
		return errors.New("Kata sandi minimal 8 karakter.")
	}
	if len(p) > 200 {
		return errors.New("Kata sandi maksimal 200 karakter.")
	}
	return nil
}
