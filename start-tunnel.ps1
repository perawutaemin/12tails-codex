# เปิดเว็บ 12 Tails Codex ให้คนอื่นเข้าดูผ่าน Cloudflare Tunnel
# ดับเบิลคลิก "start-tunnel.bat" เพื่อเปิด ปิดหน้าต่างนี้เพื่อหยุด
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8790
$server = Start-Process python -ArgumentList "-m", "http.server", $port, "--bind", "127.0.0.1", "--directory", $here -WindowStyle Hidden -PassThru
Write-Host "เว็บในเครื่อง: http://localhost:$port"
Write-Host "กำลังสร้างลิงก์สาธารณะ... (ลิงก์ https://....trycloudflare.com จะขึ้นด้านล่าง)"
try {
  & "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --no-autoupdate --url "http://127.0.0.1:$port"
} finally {
  Stop-Process -Id $server.Id -ErrorAction SilentlyContinue
}
