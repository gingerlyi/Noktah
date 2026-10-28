# Tahap 1: build frontend React
FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Tahap 2: build backend Go
FROM golang:1.24-alpine AS api
WORKDIR /src
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

# Tahap 3: image akhir, berisi satu program dan berkas frontend
FROM alpine:3.20
RUN apk add --no-cache ca-certificates && adduser -D -u 10001 app
WORKDIR /app
COPY --from=api /out/server ./server
COPY --from=web /web/dist ./public
USER app
ENV PORT=8080 STATIC_DIR=/app/public
EXPOSE 8080
CMD ["./server"]
