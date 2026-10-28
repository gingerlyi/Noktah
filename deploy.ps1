# Mengirim perubahan dari laptop ke server dalam satu perintah:
# kemas project (tanpa node_modules, dist, dan .env), unggah lewat scp, lalu bangun ulang dengan Docker di server.
# .env di server tidak tersentuh. Data database tetap ada.
#
# Pakai (dari folder project, di PowerShell):
#   .\deploy.ps1 -Server ginger1@ALAMAT_SERVER
# Contoh: .\deploy.ps1 -Server ginger1@100.92.242.93
#
# Bila PowerShell menolak menjalankan skrip, jalankan sekali:
#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
param(
  [Parameter(Mandatory = $true)][string]$Server,
  [string]$Dir = '/opt/noktah'
)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$paket = Join-Path $env:TEMP 'noktah-deploy.tgz'

Write-Host '1/3 Mengemas project...'
tar -czf $paket --exclude=node_modules --exclude=dist --exclude=dist-demo --exclude=.git --exclude=.claude --exclude=.env --exclude=deploy.ps1 .
if ($LASTEXITCODE -ne 0) { throw 'Gagal mengemas project.' }

Write-Host "2/3 Mengunggah ke $Server..."
scp $paket "${Server}:~/noktah-deploy.tgz"
if ($LASTEXITCODE -ne 0) { throw 'Gagal mengunggah. Periksa alamat server dan koneksi SSH.' }

Write-Host '3/3 Membangun ulang di server (masukkan kata sandi sudo bila diminta)...'
ssh -t $Server "sudo tar -xzf ~/noktah-deploy.tgz -C $Dir && rm ~/noktah-deploy.tgz && cd $Dir && sudo docker compose up -d --build && sudo docker compose ps"
if ($LASTEXITCODE -ne 0) { throw 'Gagal membangun ulang di server. Lihat pesan di atas.' }

Remove-Item $paket
Write-Host 'Selesai. Buka https://noktah.documentation.my.id lalu tekan Ctrl+Shift+R.'
