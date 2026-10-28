-- Langganan Premium: aktif selama premium_until masih di masa depan. NULL berarti paket Gratis.
ALTER TABLE users ADD COLUMN premium_until timestamptz;
